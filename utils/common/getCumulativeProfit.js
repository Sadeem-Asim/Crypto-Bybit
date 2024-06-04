import { Profit } from "#models/ProfitModel";
import _ from "lodash";
export default async function getCumulativeProfits(filter = {}) {
  let cumulativeProfit = 0;
  // const cumulativeProfitsArray = [];
  try {
    const cumulativeProfitsArray = await Profit.aggregate([
      {
        $group: {
          _id: {
            y: { $year: "$created_at" },
            m: { $month: "$created_at" },
            d: { $dayOfMonth: "$created_at" },
          },
          amount: { $sum: "$value" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(" Cumulative Profits Array:", cumulativeProfitsArray);
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
}
