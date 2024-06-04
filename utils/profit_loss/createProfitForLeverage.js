import { Bot } from "#models/bot.model";
import { Profit } from "#models/ProfitModel";

export default async function createProfitForLeverage(user_id, coin, pnl) {
  const userBot = await Bot.findOne({
    user: user_id,
    role: "User",
    status: true,
  });
  if (userBot) {
    coin = coin.replace("USDT", "");
    const profit = await Profit.create({
      user: user_id,
      bot: userBot.id,
      exchange: "BYBIT",
      risk: "LOW",
      coin: coin,
      value: pnl,
    });
    console.log(profit);
  }
  console.log(userBot);
}
