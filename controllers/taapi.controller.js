import axios from "axios";

import { getEnv } from "#utils/common/env";
import fetchRSIValues from "#utils/taapi/fetchRSIValues";
import { validate, validateCandles } from "#models/taapi.model";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";

/**
 @desc     GET RSI Indicator
 @route    GET /api/taapi/rsi
 @access   Private
 */
const getRSIIndicator = asyncHandlerMiddleware(async (req, res) => {
  const { error } = validate(req.query);
  if (error) return res.status(400).send(error.details[0].message);

  const response = await fetchRSIValues(req.query);
  console.log(response);
  if ("value" in response) return res.status(200).send(response);

  const { status, data } = response;
  return res.status(status).send({ ...data, value: 0 });
});

/**
 @desc     POST RSI Indicator Base on Candles
 @route    POST /api/taapi/rsi
 @access   Private
 */
const getRSI_IndicatorBasedOnCandles = asyncHandlerMiddleware(
  async (req, res) => {
    const { error } = validateCandles(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const candles = req.body.candles;
    const body = { candles, secret: getEnv("TAAPI_SECRET") };
    try {
      const { data, status } = await axios.post(
        `https://api.taapi.io/rsi`,
        body
      );
      res.status(status).send(data);
    } catch (error) {
      if (error?.isAxiosError) {
        const { status, data } = error.response;
        return res.status(status).send(data);
      }
      throw new Error(error);
    }
  }
);

export { getRSIIndicator, getRSI_IndicatorBasedOnCandles };
