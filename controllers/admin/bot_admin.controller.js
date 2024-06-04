import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { Bot } from "#models/bot.model";
import { EXCHANGES } from "#constants/index";
import binanceCloseOrder from "#utils/binance/binanceCloseOrder";
import { UserModel } from "#models/user.model";
import { subAdminUsers } from "#models/sub_admin_users";
import assignProfit from "#utils/common/assignProfit";
import extractApiKeys from "#utils/common/extractApiKeys";
import { RestClientV5 } from "bybit-api";

import _ from "lodash";
// import kuCoinApi from "#services/kucoin";

/**
 @desc     Delete User Bot
 @route    DELETE /api/admin/bot/:id
 @access   Private (Admin)
 */
const deleteBot = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;

  const bot = await Bot.findById(id, {
    setting: 1,
    exchange: 1,
    user: 1,
  }).populate("setting", "investment low up isActive hasPurchasedCoins profit");

  if (!bot) return res.status(200).send(`No Record Found`);

  const { exchange, user } = bot || {};

  exchange === EXCHANGES[0]
    ? await binanceCloseOrder({ bot_id: id, user_id: user }) //  BINANCE EXCHANGE
    : {}; //  KUCOIN EXCHANGE

  await Bot.findByIdAndUpdate(id, { $set: { isDeleted: true } });
  res.status(200).send("Bot Successfully Deleted");
});

/**
 @desc     Activity Record Bots
 @route    GET /api/admin/activity
 @access   Private (Admin)
 */
const botsActivity = asyncHandlerMiddleware(async (req, res) => {
  let filter = {
    role: "User",
  };
  console.log(req?.user);
  const { role } = req?.user;
  if (role === "SUB_ADMIN") {
    const subAdmin = await subAdminUsers.findOne({ sub_admin: req?.user?._id });
    filter["_id"] = { $in: subAdmin?.users };
  }
  const users = await UserModel.find(filter, [
    "name",
    "email",
    "api",
    "role",
    "leverage",
  ]).lean();
  // console.log(users);
  filter = {};
  const updatedRecord = await Promise.all(
    users.map(async (user) => {
      const { _id, role } = user;
      const balances = {};
      const futureBalances = {};

      if (role === "SUB_ADMIN") {
        const subAdmin = await subAdminUsers.findOne({ sub_admin: _id });
        filter["user"] = { $in: subAdmin?.users };
      } else {
        filter["user"] = _id;
      }
      const bots = await Bot.find(filter)
        .populate("user")
        .populate(
          "setting",
          "risk investment operation low up takeProfit indicator isActive time stats"
        );
      const _bots = await assignProfit(bots);

      try {
        const { apiKey, secret } = extractApiKeys(user?.api);
        // console.log(user?.name);
        console.log(apiKey, secret);
        // Binance Api Kets
        if (apiKey || secret) {
          const client = new RestClientV5({
            key: apiKey,
            secret: secret,
            testnet: false,
            options: {
              adjustForTimeDifference: true,
              verbose: true,
              defaultType: "spot",
            },
          });
          const data = await client.getWalletBalance({
            accountType: "UNIFIED",
            coin: "USDT",
          });
          const accountBalance = data.result.list[0].coin[0].walletBalance
            ? data.result.list[0].coin[0].walletBalance
            : 0;
          balances["usdt"] = _.round(accountBalance, 2);
          futureBalances["f_usdt"] = _.round(0, 2);
          // console.log(futureBalances);
        } else {
          throw new Error("Invalid api key provided");
        }
      } catch (e) {
        const error = e.response?.data || e;
        // console.log({ error });
        // balances["usdt"] = 0;
        balances["btc"] = 0;
        balances["eth"] = 0;
      }

      return { ...user, ...futureBalances, ...balances, bots: _bots };
    })
  );
  res.send(updatedRecord);
});

export { deleteBot, botsActivity };
