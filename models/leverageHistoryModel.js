import mongoose, { Schema } from "mongoose";

const LeverageHistorySchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    coin: {
      type: String,
      required: true,
    },
    side: {
      type: String,
      enum: ["Buy", "Sell"],
    },
    balance: { type: Number },
    type: {
      type: String,
      enum: ["Market", "Limit", "Qtf Leverage"],
      default: "Market",
    },
    hasPurchasedCoins: {
      type: Boolean,
      default: true,
    },
    leverage: {
      type: Number,
    },
    price: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    buy: {
      type: Number,
      default: 0,
    },
    sell: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    tpsl: {
      type: Boolean,
      default: false,
    },
    takeProfit: {
      type: Number,
      default: 0,
    },

    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at" } }
);

const LeverageHistory = mongoose.model(
  "leverageHistory",
  LeverageHistorySchema
);

export { LeverageHistory };
