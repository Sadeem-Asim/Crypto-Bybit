import { Profit } from "#models/ProfitModel";
import { RISKS } from "#constants/index";

const _RISK = { 7: RISKS[0], 15: RISKS[1], 30: RISKS[2] };

export default async function _dailyProfitChartAggregate(
  days = 7,
  filter = {}
) {
  const risk = _RISK[days];
  let $match;
  if (days !== 7) {
    $match = { ...filter, risk };
  } else {
    $match = { ...filter };
  }

  return Profit.aggregate([
    { $match },
    {
      $project: {
        createdAt: {
          $dateToString: { format: "%m/%d/%Y", date: "$created_at" },
        },
        profit: "$value",
      },
    },
    {
      $group: {
        _id: "$createdAt",
        profit: { $sum: "$profit" },
        dates: { $push: "$createdAt" },
      },
    },
    { $addFields: { startDate: { $min: "$dates" } } },
    { $sort: { _id: 1 } },
    { $unset: ["_id", "dates"] },
  ]);
}
