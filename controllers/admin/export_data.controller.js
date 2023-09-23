// import json2xls from "json2xls";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { Bot } from "#models/bot.model";
import { UserModel } from "#models/user.model";
import { LeverageHistory } from "#models/leverageHistoryModel";
import assignProfit from "#utils/common/assignProfit";
import getWinrate from "#utils/profit_loss/getWinrate";

import { calculateTotalProfit } from "#utils/common/calculations";
import XLSX from "xlsx";
/**
 @desc     Export Bot Data
 @route    GET /api/admin/export/bot
 @access   Private (Admin)
 */
const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const calculateTotalPositionsSpot = async (bots) => {
  const hasBots = bots.length > 0;

  if (hasBots) {
    const result = await Promise.all(
      bots.map(async (bot) => {
        const { setting } = bot;

        const result = await Bot.aggregate([
          { $match: { setting: { $in: setting } } },
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
            $project: {
              profit: { $size: "$setting.stats.buy" },
              runningAssets: "$setting.investment",
            },
          },
          {
            $group: {
              _id: "$id",
              total: { $sum: "$profit" },
            },
          },
          { $project: { _id: false } },
        ]);

        const total = result[0]?.total;
        return total;
      })
    );

    return result.reduce((a, b) => a + b, 0);
  } else return 0;
};

const returnUserData = async (user) => {
  const userBot = await Bot.findOne({ role: "User", user: user._id });
  // console.log(userBot);
  let startDate = new Date(userBot.createdAt);
  let endDate = new Date(Date.now());
  const timeDifferenceMs = endDate - startDate;
  const daysDifference = timeDifferenceMs / (1000 * 60 * 60 * 24);
  startDate = startDate.toDateString();
  endDate = endDate.toDateString();

  // for Eth
  const leveragesETH = await LeverageHistory.find({
    user: user._id,
    coin: "ETHUSDT",
  });
  let leverageProfitETH = leveragesETH.reduce(calculateTotalProfit, 0);
  const botsETH = await Bot.find({ user: user._id, coin: "ETH" });
  const _botsETH = await assignProfit(botsETH);
  let botsProfitETH = _botsETH.reduce(calculateTotalProfit, 0);
  let totalProfitETH = botsProfitETH + leverageProfitETH;

  // for BTC
  const leveragesBTC = await LeverageHistory.find({
    user: user._id,
    coin: "BTCUSDT",
  });
  let leverageProfitBTC = leveragesBTC.reduce(calculateTotalProfit, 0);
  const botsBTC = await Bot.find({ user: user._id, coin: "BTC" });
  const _botsBTC = await assignProfit(botsBTC);
  let botsProfitBTC = _botsBTC.reduce(calculateTotalProfit, 0);
  let totalProfitBTC = botsProfitBTC + leverageProfitBTC;
  const winrateData = getWinrate(
    _botsBTC.concat(_botsETH),
    leveragesBTC.concat(leveragesETH)
  ); //NOTE::Winrate
  const percentage = (
    (winrateData.series[0] /
      (winrateData.series[0] + winrateData.series[1] + winrateData.series[2])) *
    100
  ).toFixed(0);

  const totalPositionsSpot = await calculateTotalPositionsSpot(
    botsBTC.concat(botsETH)
  );
  let totalProfit = totalProfitETH + totalProfitBTC;
  // console.log(totalProfit);
  return [
    startDate,
    endDate,
    user.name,
    userBot.investment,
    totalProfit,
    daysDifference.toFixed(0),
    totalProfitETH,
    totalProfitBTC,
    percentage,
    totalPositionsSpot,
    leveragesBTC.length,
    leveragesETH.length,
    leveragesBTC.length + leveragesETH.length,
  ];
};

const exportBotData = asyncHandlerMiddleware(async (req, res) => {
  try {
    const d = new Date();
    const data = [
      [
        "QTF", // Red background color
        "Crypto",
        "Report",
        "",
        "",
        "",
        "Month",
        "Of",
        `${month[d.getMonth()]}`,
      ],
      [],
      [
        "Start Date",
        "End Date",
        "User",
        "Investment",
        "Profit",
        "No Of Days",
        "ETH",
        "BTC",
        "WinRate",
        "Positions Spot",
        "BTC Positions Leverage",
        "Eth Positions Leverage",
        "Total Positions Leverage",
      ],
    ];

    const users = await UserModel.find({ role: "User" }, [
      "name",
      "email",
      "api",
      "role",
      "leverage",
    ]).lean();

    for (let i = 0; i < users.length; i++) {
      const result = await returnUserData(users[i]);
      data.push(result);
    }
    data.push([
      "",
      "",
      "Total Users",
      "Total Investment",
      "Total Profit",
      "",
      "ETH",
      "BTC",
      "",
      "Total Positions Spot",
      "Total BTC Positions Leverage",
      "Total ETH Positions Leverage",
      "Total Positions Leverage",
    ]);
    let totalUsers = 0;
    let totalInvestment = 0;
    let totalProfit = 0;
    let ethProfit = 0;
    let btcProfit = 0;
    // let winrate = 0;
    let totalPositionsSpot = 0;
    let totalBtcPositionsLeverage = 0;
    let totalEthPositionsLeverage = 0;
    let totalPositions = 0;
    for (let i = 3; i < data.length - 1; i++) {
      console.log(data[i]);
      totalUsers += 1;
      totalInvestment += data[i][3];
      totalProfit += data[i][4];
      ethProfit += data[i][6];
      btcProfit += data[i][7];
      // winrate += Number(data[i][8]);
      totalPositionsSpot += data[i][9];
      totalBtcPositionsLeverage += data[i][10];
      totalEthPositionsLeverage += data[i][11];
      totalPositions += data[i][12];
    }

    console.log(winrate);
    data.push([
      "",
      "",
      totalUsers,
      totalInvestment,
      totalProfit,
      "",
      ethProfit,
      btcProfit,
      "",
      totalPositionsSpot,
      totalBtcPositionsLeverage,
      totalEthPositionsLeverage,
      totalPositions,
    ]);

    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // ws["!cols"] = [{ wpx: 20 * 256 }];
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, ws, "Sheet1");
    // Write the workbook to a buffer
    const fileName = `sample_excel.xlsx`;
    // const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    XLSX.writeFile(workbook, fileName);
    // Set the response headers to indicate a file download
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.download(fileName, (err) => {
      if (err) {
        console.error("Error sending the Excel file:", err);
        res.status(500).send("Error sending the Excel file");
      }

      // Delete the file after it has been sent
      // fs.unlinkSync(fileName);
    });
  } catch (error) {
    console.log(error);
  }
});

export { exportBotData };
