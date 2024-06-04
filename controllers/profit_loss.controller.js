import _ from "lodash";

import { Bot } from "#models/bot.model";
import { LeverageHistory } from "#models/leverageHistoryModel";
import assignProfit from "#utils/common/assignProfit";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import {
  calculateTotalProfit,
  calculateTotalRunningAssets,
  round3Precision,
} from "#utils/common/calculations";
import _totalProfitChartAggregate from "#utils/common/_totalProfitChartAggregate";
import _dailyProfitChartAggregate from "#utils/common/_dailyProfitChartAggregate";
import todayProfit from "#utils/aggregates/todayProfit";
import getWinrate from "#utils/profit_loss/getWinrate";
import getProfitDistribution from "#utils/profit_loss/getProfitDistribution";
import getBills from "#utils/profit_loss/getBills";
import mongoose from "mongoose";
import getCumulativeProfits from "#utils/common/getCumulativeProfit";
/**
 @desc     Profit Loss Account
 @route    GET /api/profit_loss/account
 @access   Private
 */

const getProfitLossAccountDetails = asyncHandlerMiddleware(async (req, res) => {
  const filter = {};
  const { _id: id, role } = req?.user || {};
  console.log(req.user);
  const { currency, coin_type } = req?.query || {};
  // console.log(id);
  // console.log(role);
  // console.log(currency);
  if (currency) filter["coin"] = currency;
  if (coin_type) filter["coin_type"] = coin_type;
  if (id && role === "USER") {
    console.log("Hi");
    filter["user"] = mongoose.Types.ObjectId(id);
    // filter["role"] = "User";
  }

  const bots = await Bot.find(filter, {
    createdAt: 1,
    profit: 1,
    setting: 1,
    investment: 1,
    coin: 1,
  });
  let coin = `${currency}USDT`;
  let leverages;
  if (id && role === "USER") {
    leverages = await LeverageHistory.find({
      user: id,
      coin: coin,
    });
  } else {
    leverages = await LeverageHistory.find({
      coin: coin,
    });
  }

  // console.log(leverages);

  let leverageProfit = leverages.reduce(calculateTotalProfit, 0);
  console.log("Leverages Profit : ", leverageProfit);
  let runningOrders = await Bot.countDocuments({ ...filter, isActive: true });
  if (runningOrders >= 1 && role === "USER") {
    runningOrders = 1;
  }
  const _bots = await assignProfit(bots);

  //  NOTE::  Winrate Calculation Portion
  const winrateData = getWinrate(_bots, leverages); //NOTE::Winrate

  //  NOTE::  Profit Distribution Calculation
  // let cumulativeProfitsArray = await getCumulativeProfits({ coin: currency });
  //  NOTE::  Total Profit Price Calculation
  let totalProfitPrice = _bots.reduce(calculateTotalProfit, 0);
  totalProfitPrice = totalProfitPrice + leverageProfit;
  const totalRunningAssets = _bots.reduce(calculateTotalRunningAssets, 0);

  /*******    NOTE::      Daily PROFIT CHART      *********/
  const _week = await _dailyProfitChartAggregate(7, filter); //  NOTE::Week Calculation
  const _fortnight = await _dailyProfitChartAggregate(15, filter); //  NOTE::Fortnight Calculation
  const _month = await _dailyProfitChartAggregate(7, filter); //   NOTE::One Month Calculation
  // console.log(_week);
  let globalAmount = 0;
  let cumulativeProfitsArray = _week.map((doc) => {
    globalAmount += doc.profit;
    return Object.assign({ x: doc.startDate, y: globalAmount });
  });
  const _weekTotalPrice = _week.reduce(calculateTotalProfit, 0);
  const _fortnightTotalPrice = _fortnight.reduce(calculateTotalProfit, 0);
  const _monthTotalPrice = _month.reduce(calculateTotalProfit, 0);
  const todayProfitPrice = await todayProfit(filter);

  const data = {
    runningOrders,
    runningAssets: totalRunningAssets,
    todayProfitPrice: _.round(todayProfitPrice, 3),
    totalProfitPrice: _.round(totalProfitPrice, 3),
    dailyProfitChart: {
      7: round3Precision(_weekTotalPrice),
      15: round3Precision(_fortnightTotalPrice),
      30: round3Precision(_monthTotalPrice),
    },
    dailyProfit: {
      7: _week,
      14: _fortnight,
      30: _month,
    },
    winrate: winrateData,
    lineChart: [
      {
        id: "Total Profit",
        color: "#247962",
        data: cumulativeProfitsArray,
      },
    ],
  };

  res.status(200).send(data);
});
/**
 @desc     Profit Loss Account
 @route    GET /api/profit_loss/account
 @access   Private
 */

const getProfitLossAccountDetailsByUser = asyncHandlerMiddleware(
  async (req, res) => {
    const filter = {};
    const { id } = req?.params;
    const { currency, coin_type } = req?.query || {};
    console.log(id);
    if (currency) filter["coin"] = currency;
    if (coin_type) filter["coin_type"] = coin_type;
    if (id) {
      filter["user"] = mongoose.Types.ObjectId(id);
    }

    const bots = await Bot.find(filter, {
      createdAt: 1,
      profit: 1,
      setting: 1,
      investment: 1,
      coin: 1,
    });
    let coin = `${currency}USDT`;

    let leverages = await LeverageHistory.find({
      user: id,
      coin: coin,
    });

    // console.log(leverages);

    let leverageProfit = leverages.reduce(calculateTotalProfit, 0);
    console.log("Leverages Profit : ", leverageProfit);
    const runningOrders = await Bot.countDocuments({
      ...filter,
      isActive: true,
    });
    const _bots = await assignProfit(bots);

    //  NOTE::  Winrate Calculation Portion
    const winrateData = getWinrate(_bots, leverages); //NOTE::Winrate

    //  NOTE::  Profit Distribution Calculation
    // const { profitDistributionData } = getProfitDistribution(bots, currency);

    //  NOTE::  Total Profit Price Calculation
    let totalProfitPrice = _bots.reduce(calculateTotalProfit, 0);
    totalProfitPrice = totalProfitPrice + leverageProfit;
    const totalRunningAssets = _bots.reduce(calculateTotalRunningAssets, 0);

    /*******    NOTE::      Daily PROFIT CHART      *********/
    const _week = await _dailyProfitChartAggregate(7, filter); //  NOTE::Week Calculation
    const _fortnight = await _dailyProfitChartAggregate(15, filter); //  NOTE::Fortnight Calculation
    const _month = await _dailyProfitChartAggregate(7, filter); //   NOTE::One Month Calculation
    let globalAmount = 0;
    let cumulativeProfitsArray = _week.map((doc) => {
      globalAmount += doc.profit;
      return Object.assign({ x: doc.startDate, y: globalAmount });
    });
    const _weekTotalPrice = _week.reduce(calculateTotalProfit, 0);
    const _fortnightTotalPrice = _fortnight.reduce(calculateTotalProfit, 0);
    const _monthTotalPrice = _month.reduce(calculateTotalProfit, 0);
    const todayProfitPrice = await todayProfit(filter);

    const data = {
      runningOrders,
      runningAssets: totalRunningAssets,
      todayProfitPrice: _.round(todayProfitPrice, 3),
      totalProfitPrice: _.round(totalProfitPrice, 3),

      dailyProfitChart: {
        7: round3Precision(_weekTotalPrice),
        15: round3Precision(_fortnightTotalPrice),
        30: round3Precision(_monthTotalPrice),
      },
      dailyProfit: {
        7: _week,
        14: _fortnight,
        30: _month,
      },
      winrate: winrateData,
      lineChart: [
        {
          id: "Total Profit",
          color: "#247962",
          data: cumulativeProfitsArray,
        },
      ],
    };

    res.status(200).send(data);
  }
);

/**
 @desc     User Dashboard
 @route    GET /api/profit_loss/user_dashboard
 @access   Private
 */
const userDashboard = asyncHandlerMiddleware(async (req, res) => {
  const filter = {
    // role: "User",
  };
  const id = req?.user?._id;
  const exchange = req.query.exchange;

  if (id) {
    filter["user"] = mongoose.Types.ObjectId(id);
  }

  if (exchange) {
    filter.exchange = _.toUpper(exchange);
  }

  const bots = await Bot.find(filter, {
    createdAt: 1,
    profit: 1,
    setting: 1,
    investment: 1,
    coin: 1,
  });

  let leverages = await LeverageHistory.find({
    user: id,
  });

  // console.log(leverages);

  let leverageProfit = leverages.reduce(calculateTotalProfit, 0);
  console.log("Leverages Profit : ", leverageProfit);
  let totalRunningBots = await Bot.countDocuments({
    ...filter,
    isActive: true,
  });
  if (totalRunningBots >= 1) {
    totalRunningBots = 1;
  }
  const _bots = await assignProfit(bots);

  //  NOTE::  Profit Distribution && Asset Allocation Calculation
  const { profitDistributionData, assetAllocationData } =
    getProfitDistribution(_bots); // TODO:: May be pass bots

  const winrateData = getWinrate(_bots, leverages); //NOTE::Winrate

  let totalProfitPrice = _bots.reduce(calculateTotalProfit, 0);
  totalProfitPrice = totalProfitPrice + leverageProfit;
  //NOTE::Total Profit Price
  const totalRunningAssets = _bots.reduce(calculateTotalRunningAssets, 0); //NOTE::Total Running Assets
  const { billsData } = await getBills(id); //NOTE:: Bills Stats

  /*******    NOTE::      TOTAL PROFIT CHART      *********/

  const week = await _totalProfitChartAggregate(7, filter); //NOTE:: Week Chart Data
  const fortnight = await _totalProfitChartAggregate(15, filter); //NOTE:: Fortnight Chart Data
  const month = await _totalProfitChartAggregate(30, filter); //NOTE::One Month Calculation

  const weekTotalPrice = week.reduce(calculateTotalProfit, 0);
  const fortnightTotalPrice = fortnight.reduce(calculateTotalProfit, 0);
  const monthTotalPrice = month.reduce(calculateTotalProfit, 0);

  /*******    NOTE::      Daily PROFIT CHART      *********/

  const _week = await _dailyProfitChartAggregate(7, filter); //  NOTE::Week Calculation
  const _fortnight = await _dailyProfitChartAggregate(15, filter); //  NOTE::Fortnight Calculation
  const _month = await _dailyProfitChartAggregate(30, filter); //   NOTE::One Month Calculation

  const _weekTotalPrice = _week.reduce(calculateTotalProfit, 0);
  const _fortnightTotalPrice = _fortnight.reduce(calculateTotalProfit, 0);
  const _monthTotalPrice = _month.reduce(calculateTotalProfit, 0);
  const todayProfitPrice = await todayProfit(filter);

  const data = {
    runningAssets: totalRunningAssets,
    todayProfitPrice: round3Precision(todayProfitPrice),
    totalProfitPrice: round3Precision(totalProfitPrice),
    totalProfitChart: {
      7: round3Precision(weekTotalPrice),
      15: round3Precision(fortnightTotalPrice),
      30: round3Precision(monthTotalPrice),
    },
    totalProfit: {
      7: week,
      15: fortnight,
      30: month,
    },
    dailyProfitChart: {
      7: round3Precision(_weekTotalPrice),
      15: round3Precision(_fortnightTotalPrice),
      30: round3Precision(_monthTotalPrice),
    },
    dailyProfit: {
      7: _week,
      15: _fortnight,
      30: _month,
    },
    profitDistribution: profitDistributionData,
    winrate: winrateData,
    assetAllocation: assetAllocationData,
    botProfit: billsData,
    totalRunningBots,
  };

  res.status(200).send(data);
});

/**
 @desc     User Paid History
 @route    GET /api/profit_loss/paid_history
 @access   Private
 */

const paidHistory = asyncHandlerMiddleware(async (req, res) => {
  const filter = { isActive: false };
  const id = req.user?._id;
  const role = req?.user?.role;
  const coin = req.query.coin;

  const calculateId = role === "ADMIN" ? undefined : id;

  if (id && role === "USER") {
    filter["user"] = id;
    filter["role"] = "User";
  }
  // if (coin) filter["coin"] = coin;
  console.log(filter);
  const closeOrders = await Bot.countDocuments({ ...filter });
  console.log(closeOrders);
  //  NOTE::  Billing Calculation & Data Portion
  const { billsData, amountPaid, amountUnpaid } = await getBills(calculateId);

  const data = {
    chart: billsData,
    amountPaid,
    amountUnpaid,
    closeOrders,
  };

  res.status(200).send(data);
});

export {
  getProfitLossAccountDetails,
  userDashboard,
  paidHistory,
  getProfitLossAccountDetailsByUser,
};
