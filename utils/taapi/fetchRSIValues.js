import _ from "lodash";
import axios from "axios";

import { getEnv } from "#utils/common/env";
import { Taapi } from "#models/taapi.model";
import { EXCHANGES, PYTHON_SERVER_BASE_URL } from "#constants/index";
import convertToQueryParams from "#utils/common/convertToQueryParams";

const fetchRSIValues = async (
  filters = { exchange: "", symbol: "", interval: "" }
) => {
  const record = await Taapi.findOne(filters, { value: 1 });
  /*Return Value from database*/
  if (record) return record;
  console.log(filters.exchange, EXCHANGES[0]);
  if (_.upperCase(filters.exchange) === EXCHANGES[0]) {
    // console.log("Pen nu lun");
    // Binance Exchange
    const params = convertToQueryParams({
      ...filters,
      secret: getEnv("TAAPI_SECRET"),
    });
    try {
      const { interval, symbol } = filters;
      // console.log('::::::::::     TAAPI API HIT     :::::::::::::::::::');
      // const {data} = await axios.get(`https://api.taapi.io/rsi?${params}`);

      const _symbol = symbol === "ETH/USDT" ? "ETHUSDT" : "BTCUSDT";

      const { data, status } = await axios.get(
        `${PYTHON_SERVER_BASE_URL}/api/v1/binance?symbol=${_symbol}&interval=${interval}`
      );

      if (status === 200) {
        await new Taapi({ ...filters, value: data }).save();
        return { value: data };
      } else {
        throw new Error(data);
      }
    } catch (error) {
      console.error(`Binance fetchRSIValue crashed`, error);
      return { value: 0 };

      // if (error?.isAxiosError) {
      //     return error.response;
      // }
      // throw new Error(error);
    }
  } else if (filters.exchange === _.lowerCase(EXCHANGES[1])) {
    // KUCOIN Exchange
    try {
      const { interval, symbol } = filters;

      const _symbol = symbol === "ETH/USDT" ? "ETH-USDT" : "BTC-USDT";

      const { data, status } = await axios.get(
        `${PYTHON_SERVER_BASE_URL}/api/v1/rsi?symbol=${_symbol}&interval=${interval}`
      );

      if (status === 200) {
        await new Taapi({ ...filters, value: data }).save();
        return { value: data };
      } else {
        console.error(`Kucoin fetchRSIValue failed:`, data?.message);
        // throw new Error(data)
      }
    } catch (error) {
      console.error(`Kucoin fetchRSIValue crashed`, error.response);
      return { value: 0 };
      /*if (error?.isAxiosError) {
                return error.response;
            }
            throw new Error(error);*/
    }
  }
};

export default fetchRSIValues;
