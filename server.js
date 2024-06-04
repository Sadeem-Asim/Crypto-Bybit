/*****  Packages  *****/
import cors from "cors";
import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
/*****  Modules  *****/
import logger, { myLogger } from "#utils/logger";
import routes from "#routes/index";
import { envConfig } from "#utils/common/env";
import { LeverageHistory } from "#models/leverageHistoryModel";
import connectDB from "#config/db.config";
import SocketServer from "#sockets/SocketServer";
import binanceBtcSockets from "#sockets/binanceBtcLib";
import binanceEthSockets from "#sockets/binanceEthLib";
// import deleteProfit from "./deleteProfits.js";
import { CoinStats, FutureCoinStats } from "#sockets/CoinStats";
import { SOCKET_ORIGINS } from "#constants/index";
// import { RestClientV5 } from "bybit-api";
// const API_KEY = "D7vaGJEMzIuJjpvZ9n";
// const API_SECRET = "IhTgYAuNI40PHI128tjqti8timenEGE7cJr4";
// const useTestnet = false;

// const client = new RestClientV5({
//   key: API_KEY,
//   secret: API_SECRET,
//   testnet: useTestnet,
//   options: {
//     adjustForTimeDifference: true,
//     verbose: true,
//     defaultType: "spot",
//   },
// });
// client
//   .getWalletBalance({ accountType: "UNIFIED", coin: "USDT" })
//   .then((data) => {
//     const { walletBalance } = data.result.list[0].coin[0];
//     // console.log("getAccountInfo data: ", walletBalance);
//   })
//   .catch((err) => {
//     console.error("getAccountInfo error: ", err);
//   });

envConfig();
connectDB();
logger();
// (async () => {
//   await LeverageHistory.updateMany({}, { $set: { type: "Market" } });
// })();
// deleteProfit();
const app = express();
// binanceBtcSockets();
// binanceEthSockets();
CoinStats();
// FutureCoinStats();
const PORT = 5001;

/*****  Middlewares  *****/
app.use(cors({ origin: true, credentials: true }));

app.use(cookieParser());
app.use(express.json());

const server = createServer(app);
const sockets = new SocketServer(server, {
  cors: SOCKET_ORIGINS,
  transports: ["websocket", "polling"],
});

routes(app);

export { sockets };

server.listen(PORT, () => console.log(`Server is Listening on port ${PORT}.`));
