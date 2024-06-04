import { Bot } from "#models/bot.model";
import { EXCHANGES, INDICATORS } from "#constants/index";
import sellOrder from "#utils/binance/sellOrder";
import stopBot from "#utils/binance/stopBot";
import buyOrder from "#utils/binance/buyOrder";
import fetchRSIValues from "#utils/taapi/fetchRSIValues";
import leverageMarketClose from "#utils/binance/leverageMarketClose";
import leverageMarketOpen from "#utils/binance/leverageMarketOpen";

import _ from "lodash";
import inRange from "#utils/common/inRange";
import { BotSetting } from "#models/bot_setting.model";
// import { DefaultLogger, WebsocketClient } from "binance";
import { DefaultLogger, WebsocketClient } from "bybit-api";

import { LeverageHistory } from "#models/leverageHistoryModel";
global.a = 0;
export default function binanceLib() {
  const API_KEY = "xxx";
  const API_SECRET = "yyy";
  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };
  const wsClient = new WebsocketClient(
    {
      api_key: API_KEY,
      api_secret: API_SECRET,
      market: "v5",
    },
    logger
  );
  wsClient.on("open", (data) => {
    console.log("Binance Library connection opened:");
  });
  wsClient.on("update", async (res) => {
    const coin = res?.topic === "kline.1.BTCUSDT" ? "BTC" : "ETH";
    const symbol = res?.topic === "kline.1.BTCUSDT" ? "BTCUSDT" : "ETHUSDT";
    const { close } = res.data[0];
    const currentPrice = _.round(close);
    await cb({ currentPrice, coin, symbol });
  });

  wsClient.subscribeV5("kline.1.BTCUSDT", "spot");

  // wsClient.subscribeSpotKline("ETHUSDT", "1s");
}
const leverage = _.debounce(
  async ({ markPrice }) => {
    markPrice = Number(markPrice);
    // console.log("Leverage Mark Price", markPrice);
    const limitOrders = await LeverageHistory.find({
      active: true,
      coin: "BTCUSDT",
      hasPurchasedCoins: false,
    });
    console.log("Total Btc Leverage Limit Open Orders : ", limitOrders.length);

    if (limitOrders.length > 0) {
      limitOrders.forEach(async (order) => {
        let buyCondition = false;
        if (order.side === "Buy") {
          buyCondition = inRange(markPrice, order.price - 3, order.price);
          // sellCondition = markPrice >= order.takeProfit;
        } else if (order.side === "Sell") {
          // buyCondition = markPrice <= order.price;
          buyCondition = inRange(markPrice, order.price + 3, order.price);
          // sellCondition = markPrice <= order.takeProfit;
        }
        // console.log(sellCondition);
        if (buyCondition) {
          // console.log(order);
          console.log(markPrice);
          const buyOrderParams = {
            id: order.user.toString(),
            coin: "BTCUSDT",
            orderId: order._id.toString(),
            markPrice: markPrice,
          };
          console.log(buyOrderParams);
          await leverageMarketOpen(buyOrderParams);
        }
      });
    }

    const leverages = await LeverageHistory.find({
      active: true,
      tpsl: true,
      coin: "BTCUSDT",
      hasPurchasedCoins: true,
    });
    console.log("Total Btc Leverage Open Orders : ", leverages.length);
    if (leverages.length > 0) {
      leverages.forEach(async (leverage) => {
        let sellCondition = false;
        if (leverage.side === "Buy") {
          sellCondition = inRange(
            markPrice,
            leverage.takeProfit + 5,
            leverage.takeProfit
          );
          // sellCondition = markPrice >= leverage.takeProfit;
        } else if (leverage.side === "Sell") {
          sellCondition = inRange(
            markPrice,
            leverage.takeProfit - 5,
            leverage.takeProfit
          );
          // sellCondition = markPrice <= leverage.takeProfit;
        }
        // console.log(sellCondition);
        if (sellCondition) {
          // console.log(leverage);
          console.log(markPrice);
          const sellOrderParams = {
            id: leverage.user.toString(),
            coin: "BTCUSDT",
            // leverage,
          };
          console.log(sellOrderParams);
          await leverageMarketClose(sellOrderParams);
        }
      });
    }
  },
  3000,
  { maxWait: 2000, trailing: true }
);
const cb = _.debounce(
  async ({ currentPrice, coin, symbol }) => {
    try {
      // console.log("Hi");
      const bots = await Bot.aggregate([
        {
          $lookup: {
            from: "bot_settings",
            localField: "setting",
            foreignField: "_id",
            as: "setting",
          },
        },
        { $unwind: "$setting" },
        {
          $match: {
            $or: [
              { "setting.low": currentPrice },
              { "setting.up": { $gte: currentPrice } },
              { stop_at: { $lte: currentPrice } },
            ],
            $and: [
              { "setting.isActive": true },
              { isActive: true },
              { status: true },
              { coin: coin },
              { exchange: EXCHANGES[0] },
            ],
          },
        },
      ]);
      console.log("Total Orders Open", bots.length, symbol);
      bots.length > 0
        ? await Promise.all(
            bots.map(async (bot) => {
              const { setting, stop_at, _id, user } = bot;
              const {
                low,
                up,
                hasPurchasedCoins,
                investment,
                _id: setting_id,
                operation,
                takeProfit,
                indicator,
                time,
                raw,
              } = setting;
              global.a = global.a + 1;

              const stopCondition = currentPrice <= stop_at;
              // console.log(stopCondition, stop_at);
              const sellCondition = currentPrice >= up;
              //NOTE:: Automatic Bot Operations block
              if (operation === "AUTO") {
                // NOTE:: INDICATORS[1] = 'TRAILING'
                // return;
                if (indicator === INDICATORS[1]) {
                  // NOTE:: TRAILING LOGGER
                  console.log(
                    {
                      u: up,
                      l: low,
                      c: currentPrice,
                      s: stop_at,
                      r: bots.length,
                    },
                    "T"
                  );

                  //NOTE:: Order Sell Block (TRAILING)
                  if (hasPurchasedCoins) {
                    if (sellCondition) {
                      const sellOrderParams = {
                        symbol,
                        bot_id: _id,
                        setting_id,
                        user_id: user,
                        quantity: raw?.qty,
                        currentPrice,
                      };
                      await sellOrder(sellOrderParams, { raw, investment });
                    } else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                  //NOTE:: Buy & Stop loss Logic Block (TRAILING)
                  else {
                    const min = symbol === "ETHUSDT" ? low - 3 : low - 3;
                    const max = symbol === "ETHUSDT" ? low + 3 : low + 3;

                    const buyCondition = inRange(currentPrice, min, max);
                    // const buyCondition = low === currentPrice;

                    //NOTE:: Buy Logic Block (TRAILING)
                    if (buyCondition) {
                      const buyOrderParams = {
                        symbol,
                        investment,
                        setting_id,
                        bot_id: _id,
                        user_id: user,
                        currentPrice,
                      };
                      await buyOrder(buyOrderParams);
                    }
                    //NOTE::Stop loss Logic Block
                    else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                } else if (indicator === INDICATORS[0]) {
                  // NOTE:: INDICATORS[0] = 'RSI' Block
                  // return;
                  const params = {
                    exchange: EXCHANGES[0], // binance
                    symbol: symbol.replace("USDT", "/USDT"),
                    interval: time,
                  };

                  const rsi = await fetchRSIValues(params);

                  console.log(
                    {
                      u: up,
                      l: low,
                      rsi: _.floor(rsi?.value),
                      c: currentPrice,
                      s: stop_at,
                      r: bots?.length,
                    },
                    "R"
                  );
                  // console.log("RSI ->", _.round(rsi?.value), "BTCUSDT ->", currentPrice);

                  const sellConditionRSI = _.floor(rsi.value) >= up; //NOTE:: RSI overbought condition
                  if (hasPurchasedCoins) {
                    if (sellConditionRSI) {
                      const sellOrderParams = {
                        symbol,
                        bot_id: _id,
                        setting_id,
                        user_id: user,
                        quantity: raw?.qty,
                        currentPrice,
                      };
                      await sellOrder(sellOrderParams, { raw, investment });
                    } else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                  //NOTE:: Buy & Stop loss Logic Block (RSI)
                  else {
                    // const stopCondition = currentPrice <= stop_at;
                    const min = low - 5;
                    console.log(min, low);
                    const buyCondition = inRange(_.round(rsi?.value), min, low); //NOTE:: RSI oversold condition

                    if (buyCondition) {
                      const buyOrderParams = {
                        symbol,
                        investment,
                        setting_id,
                        bot_id: _id,
                        user_id: user,
                        currentPrice,
                      };
                      await buyOrder(buyOrderParams);
                    }
                    //NOTE::Stop loss Logic Block
                    else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                }
              } // Manual Bot Block
              else {
                // NOTE:: MANUAL LOGGER
                // return;

                console.log(
                  {
                    u: up,
                    l: low,
                    c: currentPrice,
                    s: stop_at,
                    r: bots.length,
                  },
                  "M"
                );

                const min = symbol === "ETHUSDT" ? low - 2 : low - 5;
                const max = symbol === "ETHUSDT" ? low : low;
                const buyCondition = inRange(currentPrice, min, max);
                if (hasPurchasedCoins) {
                  const takePriceCondition =
                    currentPrice === takeProfit && takeProfit !== 0;

                  const sellOrderParams = {
                    symbol,
                    bot_id: _id,
                    setting_id,
                    user_id: user,
                    quantity: raw?.qty,
                    currentPrice,
                  };

                  if (takePriceCondition) {
                    await sellOrder(sellOrderParams, {
                      raw,
                      investment,
                      isManual: true,
                    });
                    await BotSetting.findByIdAndUpdate(setting_id, {
                      isActive: false,
                      investment: 0,
                    });
                  } else if (currentPrice >= up) {
                    await sellOrder(sellOrderParams, {
                      raw,
                      investment,
                      isManual: true,
                    });
                    await BotSetting.findByIdAndUpdate(setting_id, {
                      isActive: false,
                      investment: 0,
                    });
                  } else if (stopCondition) {
                    // await stopBot({ setting_id, currentPrice });
                  }
                } else if (buyCondition) {
                  const buyOrderParams = {
                    symbol,
                    investment,
                    setting_id,
                    bot_id: _id,
                    user_id: user,
                    currentPrice,
                  };
                  await buyOrder(buyOrderParams);
                } else if (stopCondition) {
                  // await stopBot({ setting_id, currentPrice });
                }
              }
            })
          )
        : 0;
    } catch (error) {
      console.log(error);
    }
  },
  1200,
  { maxWait: 2000, trailing: true }
);
