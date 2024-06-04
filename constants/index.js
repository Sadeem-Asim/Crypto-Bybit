/*****  USERS  *****/
export const USER_ROLES = ["ADMIN", "USER", "SUB_ADMIN"];
export const JWT_ERRORS = [""];
export const TOKEN_EXPIRE_TIME = "1d";
export const BOT_CONFIGURED_BY = ["ADMIN", "SUB_ADMIN", "AUTOMATIC"];
export const BOT_STATUS = { COINS_PURCHASED: true, COIN_SOLD: false };
// export const BOT_STATUS = {IN_PROCESS: false, COMPLETED: true}

/*****  BOT  *****/
export const INDICATORS = ["RSI", "TRAILING"];
export const RISKS = ["LOW", "MODERATE", "HIGH"];
export const STAGES = { LOW: "Q1", MODERATE: "Q2", HIGH: "Q3", DEFAULT: "?" };
export const EXCHANGES = ["BYBIT"];
export const COINS = ["BTC", "ETH"];
export const OPERATION = ["MANUAL", "AUTO"];

export const SOCKET_EVENTS = {
  hit_binance_api: "HIT_BINANCE_API",
  send_binance_api_data: "SEND_BINANCE_API_DATA",
  HIT_KUCOIN_API: "HIT_KUCOIN_API",
  SEND_KUCOIN_API_DATA: "SEND_KUCOIN_API_DATA",
  GET_BINANCE_STATS: "GET_BINANCE_STATS",
};

export const TAAPI_SYMBOLS = ["BTC/USDT", "ETH/USDT"];

export const BINANCE_INTERVAL = [
  "1s",
  "1min",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
];

// export const KUCOIN_SYMBOLS = ["BTC-USDT", "ETH-USDT"];

// export const KUCOIN_INTERVAL = [
//   "1min",
//   "3min",
//   "5min",
//   "15min",
//   "30min",
//   "1hour",
//   "2hour",
//   "4hour",
//   "6hour",
//   "8hour",
//   "12hour",
//   "1day",
//   "1week",
// ];

export const ORIGINS = ["http://localhost:3000", "http://206.189.19.197"];
export const SOCKET_ORIGINS = ["http://localhost:*", "http://206.189.19.197:*"];

export const BINANCE_API_BASE_URL = "https://api.binance.com";

export const PYTHON_SERVER_BASE_URL =
  "https://rsi-python-vjsbl.ondigitalocean.app";
export const DOMAIN = "http://167.99.196.198:5000/";
// export const PYTHON_SERVER_BASE_URL = 'http://127.0.0.1:3030/'

// KUCOINS CONSTANTS
// export const KUCOIN_API_BASE_URL = "https://api.kucoin.com";
export const ACCOUNT_INFORMATION_ENDPOINT = "/api/v1/accounts";
