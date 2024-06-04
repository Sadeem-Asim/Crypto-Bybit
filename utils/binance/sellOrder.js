import _ from "lodash";

import { Bot } from "#models/bot.model";
import { myLogger } from "#utils/logger";
import binanceApi from "#services/binance";
import { UserModel } from "#models/user.model";
import { BotSetting } from "#models/bot_setting.model";
import { Transaction } from "#models/transactions.model";
import extractApiKeys from "#utils/common/extractApiKeys";
import handleBotStatus from "#utils/common/handleBotStatus";
import createOrderParams from "#utils/binance/createOrderParams";
import { Profit } from "#models/ProfitModel";
import { BOT_STATUS, EXCHANGES } from "#constants/index";
import cache from "#utils/common/Cache";
import { RestClientV5 } from "bybit-api";

const sellOrder = async (
  { symbol, quantity, bot_id, user_id, setting_id, currentPrice },
  { raw, investment, risk = "LOW", isManual = false }
) => {
  const { api } = await UserModel.findById(user_id, { "api.bybit": 1 });
  const { apiKey, secret } = extractApiKeys(api);
  // Order Sell Params
  console.log("in Sell Order", apiKey, secret);
  const client = new RestClientV5({
    enableRateLimit: true,
    testnet: false,
    key: apiKey,
    secret: secret,
    options: {
      defaultType: "spot",
      adjustForTimeDifference: true,
      verbose: true,
    },
  });

  cache.set(_.toString(setting_id), BOT_STATUS.COIN_SOLD);

  // Order Sell API
  client
    .submitOrder({
      category: "spot",
      symbol: "BTCUSDT",
      side: "Sell",
      orderType: "Market",
      qty: `${quantity}`, //investment
    })
    // Block Run if Order Successfully Sold
    .then(async (res) => {
      // Save res in kucoin log file
      myLogger.binance.info(JSON.stringify(res));
      //Destructuring Transaction Data
      console.log(res);
      const orderId = res["result"].orderId;
      console.log(orderId);
      const order = await client.getActiveOrders({
        category: "spot",
        symbol: symbol,
        orderId: orderId,
      });
      console.log(order);
      const response = order["result"].list[0];
      const { avgPrice: price, cumExecQty, cumExecValue: size } = response;

      const profit = _.round(Number(size), 3) - _.round(raw.size, 3);
      const availableBalance = Number(investment) + Number(profit);

      await new Profit({
        bot: bot_id,
        user: user_id,
        risk,
        exchange: EXCHANGES[0],
        coin: symbol.replace("USDT", ""),
        value: profit,
      }).save();

      // Update Bot Setting that Order was Sold

      if (isManual) {
        //NOTE:: Updating BotSetting in Manual Configuration
        await BotSetting.findByIdAndUpdate(setting_id, {
          $inc: { profit: profit },
          $unset: { raw: 1 },
          $set: { isActive: false, investment: 0, hasPurchasedCoins: false },
          $push: { "stats.sell": Number(price) },
        });
        //NOTE:: Updating Bot in Manual Configuration
        await Bot.findByIdAndUpdate(bot_id, {
          $inc: { availableBalance: availableBalance },
        });
      } else {
        //NOTE:: Updating BotSetting in RSI and Trailing Configuration
        await BotSetting.findByIdAndUpdate(setting_id, {
          $set: { hasPurchasedCoins: false },
          $inc: { profit: profit },
          $unset: { raw: 1 },
          $push: { "stats.sell": Number(price) },
        });
        //NOTE:: Updating Bot in RSI and Trailing Configuration
        await Bot.findByIdAndUpdate(bot_id, {
          $inc: { availableBalance: profit },
        });
      }

      /*TODO:: Remove this testing Logger*/
      // Create the Transaction of Order
      // await new Transaction({ ...doc, setting_id }).save();
      await handleBotStatus(bot_id);
      console.log("SOLD");
    })
    // Block Run if Order has been failed with some issue
    .catch(async (error) => {
      const _error = _.get(error, "response.data.msg", error);
      myLogger.binanceError.error("Sell Order Failed");
      myLogger.binanceError.error(JSON.stringify(error));
      console.log(
        _error,
        "Sell Order Failed",
        symbol,
        quantity,
        bot_id,
        user_id,
        setting_id
      );
    });
};

export default sellOrder;
