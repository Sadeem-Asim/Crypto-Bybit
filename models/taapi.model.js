/*****  Packages  *****/
import mongoose from "mongoose";
import Joi from "joi";

/*****  Modules  *****/
import { BINANCE_INTERVAL, TAAPI_SYMBOLS } from "#constants/index";

const taapiSchema = new mongoose.Schema({
  exchange: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  interval: {
    type: String,
    required: true,
  },
  value: Number,
  createdAt: {
    type: Date,
    expires: "30s",
    index: true,
    default: Date.now,
  },
});

const validation = (data) => {
  const schema = Joi.object({
    exchange: Joi.string().valid().required(),
    symbol: Joi.string().when("exchange", {
      is: "bybit",
      then: Joi.string()
        .valid(...TAAPI_SYMBOLS)
        .required(),
    }),
    interval: Joi.string().when("exchange", {
      is: "bybit",
      then: Joi.string()
        .valid(...BINANCE_INTERVAL)
        .required(),
    }),
  });

  return schema.validate(data);
};

const candlesValidation = (data) => {
  const schema = Joi.object({
    candles: Joi.array().items(
      Joi.object({
        timestamp: Joi.date().timestamp(),
        open: Joi.number().required(),
        high: Joi.number().required(),
        low: Joi.number().required(),
        close: Joi.number().required(),
        volume: Joi.number().required(),
      })
    ),
  });

  return schema.validate(data);
};

const Taapi = mongoose.model("rsi_value", taapiSchema);

export { Taapi, validation as validate, candlesValidation as validateCandles };
