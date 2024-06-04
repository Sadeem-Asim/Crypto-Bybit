import { envConfig } from "#utils/common/env";
import connectDB from "#config/db.config";
import { Bot } from "#models/bot.model";
import { UserModel } from "#models/user.model";
import { BotSetting } from "#models/bot_setting.model";
import { PredictionModel } from "#models/prediction.model";
import { Transaction } from "#models/transactions.model";
import bcrypt from "bcrypt";
import { BillingModel } from "#models/billing-modal";
import { Profit } from "#models/ProfitModel";
import { subAdminUsers } from "#models/sub_admin_users";

envConfig();
connectDB();

export const importData = async () => {
  try {
    const adminUser = await new UserModel({
      name: "Admin",
      email: "admin@gmail.com",
      password: bcrypt.hashSync("12345678", 10),
      role: "ADMIN",
      active: true,
    }).save();

    console.log("Data Imported!");
    process.exit();
  } catch (e) {
    console.log(`Error: ${e}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await BillingModel.deleteMany();
    await Bot.deleteMany();
    await BotSetting.deleteMany();
    await PredictionModel.deleteMany();
    await Profit.deleteMany();
    await subAdminUsers.deleteMany();
    await Transaction.deleteMany();
    await UserModel.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (e) {
    console.log(`Error: ${e}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") destroyData();
else importData();
