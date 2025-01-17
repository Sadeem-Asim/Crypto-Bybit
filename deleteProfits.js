import { Profit } from "#models/ProfitModel";
import { Bot } from "#models/bot.model";
import { UserModel } from "#models/user.model";
import { LeverageHistory } from "#models/leverageHistoryModel";
import { BotSetting } from "#models/bot_setting.model";
export default async function deleteProfit() {
  let totalLeverageHistoriesInValid = 0;
  let users = await UserModel.find({ role: "USER" }).select("_id");
  users = users.map((obj) => {
    return obj._id.toString();
  });
  console.log(users);
  let leverageHistories = await BotSetting.find();
  leverageHistories.forEach(async function (history) {
    if (!users.includes(history.user.toString())) {
      await BotSetting.findByIdAndDelete(history._id);
      console.log("done");
    }
  });
  console.log("Hello world!");
}
