import _ from "lodash";
import winston from "winston";

import binanceApi from "#services/binance";
import { UserModel } from "#models/user.model";
import { BotSetting } from "#models/bot_setting.model";
import { Transaction } from "#models/transactions.model";
import extractApiKeys from "#utils/common/extractApiKeys";
import createOrderParams from "#utils/binance/createOrderParams";
import { myLogger } from "#utils/logger";
import cache from "#utils/common/Cache";
import { BOT_STATUS } from "#constants/index";
import { RestClientV5 } from "bybit-api";
const buyOrder = async ({
  symbol,
  investment,
  setting_id,
  bot_id,
  user_id,
  currentPrice,
}) => {
  const { api } = await UserModel.findById(user_id, { "api.bybit": 1 });
  const { apiKey, secret } = extractApiKeys(api);
  console.log("in Buy Order", apiKey, secret);
  // Order Buy Params

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

  cache.set(_.toString(setting_id), BOT_STATUS.COINS_PURCHASED);
  // Order Buy API
  client
    .submitOrder({
      category: "spot",
      symbol: symbol,
      side: "Buy",
      orderType: "Market",
      qty: `${investment}`, //investment
    })
    // Block Run if Order Successfully Bought
    .then(async (res) => {
      // Save Response in kucoin log file
      console.log(res);
      const orderId = res["result"].orderId;
      console.log(orderId);
      const order = await client.getActiveOrders({
        category: "spot",
        symbol: symbol,
        orderId: orderId,
      });
      const response = order["result"].list[0];
      myLogger.binance.info(JSON.stringify(response?.data));
      // // Update Bot Setting that Order was Bought
      await BotSetting.findByIdAndUpdate(setting_id, {
        $set: {
          hasPurchasedCoins: true,
          raw: {
            price: Number(response?.avgPrice),
            qty: Number(response?.cumExecQty),
            size: Number(response?.cumExecValue),
          },
        },
        $push: { "stats.buy": Number(response?.avgPrice) },
      });
      console.log("BOUGHT", symbol, investment, setting_id, bot_id, user_id);
    })
    // Block Run if Order has been failed with some issue
    .catch(async (error) => {
      const _error = _.get(error, "response.data", error);
      myLogger.binanceError.error("Buy Order Failed");
      myLogger.binanceError.error(JSON.stringify(error));
      console.log(_error, "Buy Order Failed");
    });
};

export default buyOrder;
