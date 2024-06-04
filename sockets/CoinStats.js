// import { DefaultLogger, WebsocketClient } from "binance";
import EventEmitter from "events";
import Binance from "node-binance-api";
import { DefaultLogger, WebsocketClient } from "bybit-api";
export const eventEmitter = new EventEmitter();

export function CoinStats() {
  const statistics = {
    BTC: { id: "bitcoin", name: "Bitcoin", symbol: "btc" },
    ETH: { id: "ethereum", name: "Ethereum", symbol: "eth" },
  };

  const API_KEY = "xxx";
  const API_SECRET = "yyy";

  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };

  const wsClient = new WebsocketClient(
    {
      api_key: API_KEY,
      api_secret: API_SECRET,
      market: "v5",
    },
    logger
  );

  eventEmitter.on("ready", (data) => {});

  // receive raw events
  /*wsClient.on('message', (data) => {
    console.log('raw message received ', JSON.stringify(data, null, 2));
  });*/

  // notification when a connection is opened
  wsClient.on("open", (data) => {
    console.log("connection opened open:");
  });

  wsClient.on("update", (res) => {
    // console.log(res);
    if (res.wsKey === "v5LinearPublic") {
      // console.log("Linear", res.topic);
      const key = res?.topic === "kline.1.BTCUSDT" ? "BTC" : "ETH";

      const stats = {
        symbol: key,
        futurePrice: res.data[0].close,
      };
      // console.log(stats);
      eventEmitter.emit("stats", stats);
    } else {
      const key = res?.topic === "kline.1.BTCUSDT" ? "BTC" : "ETH";
      statistics[key]["price"] = res.data[0].close;
      const { open, high, low } = res.data[0];
      statistics[key] = {
        ...statistics[key],
        open,
        high,
        low,
      };
      eventEmitter.emit("stats", statistics);
    }
  });
  wsClient.on("response", (response) => {});

  wsClient.on("error", (data) => {
    console.log("ws saw error ", data?.wsKey);
  });
  wsClient.subscribeV5("kline.1.BTCUSDT", "spot");
  wsClient.subscribeV5("kline.1.ETHUSDT", "spot");
  wsClient.subscribeV5("kline.1.BTCUSDT", "linear");
  wsClient.subscribeV5("kline.1.ETHUSDT", "linear");
}

export function FutureCoinStats() {
  const binance = new Binance().options({
    APIKEY: "<key>",
    APISECRET: "<secret>",
  });

  binance.futuresMarkPriceStream("BTCUSDT", (data) => {
    // statistics["BTC"]["futurePrice"] = data.markPrice;
    // console.log(data.markPrice);
    const stats = {
      symbol: "BTC",
      futurePrice: data.markPrice,
    };
    eventEmitter.emit("stats", stats);
    // console.log(data);
  });
  binance.futuresMarkPriceStream("ETHUSDT", (data) => {
    const stats = {
      symbol: "ETH",
      futurePrice: data.markPrice,
    };
    eventEmitter.emit("stats", stats);
  });
}
