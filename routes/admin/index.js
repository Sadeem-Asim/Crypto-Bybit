import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import admin from "#middlewares/admin.middleware";
import {
  getAllIndicator,
  getAllsubAdminUser,
} from "#controllers/admin/admin_bot_setting";
import validateMongooseIdMiddleware from "#middlewares/validateMongooseId.middleware";
import {
  getProfitLoss,
  getProfitLossDashboard,
  getProfitLossStatistics,
  getUsersPortfolio,
} from "#controllers/admin/profit_loss.controller";
import {
  createBotSetting,
  updateBotSetting,
} from "#controllers/admin/bot_setting.controller";
import {
  clearData,
  deleteUser,
  deleteUserOrders,
  getUser,
  updateUser,
  updateUserApiSetting,
  userApiSetting,
} from "#controllers/admin/user.controller";
import {
  assignUsers,
  getAllSubAdmin,
  deleteSubAdmin,
} from "#controllers/admin/sub_admin.controller";
import {
  createBilling,
  getBilling,
  updateUserPaidStatus,
  deleteUserBill,
  updateUserBillRecipt,
} from "#controllers/admin/billing.controller";
import {
  botsActivity,
  deleteBot,
} from "#controllers/admin/bot_admin.controller";
import { exportBotData } from "#controllers/admin/export_data.controller";

const adminRouter = express.Router();

// TODO:: User Portfolio Routes
adminRouter.get("/user_portfolio", [authMiddleware, admin], getUsersPortfolio);

adminRouter
  .route("/user_api_keys/:id")
  .get([authMiddleware, admin], userApiSetting)
  .put([authMiddleware, admin], updateUserApiSetting);

// NOTE:: User Management from admin
adminRouter
  .route("/user/:id")
  .get([validateMongooseIdMiddleware, authMiddleware, admin], getUser)
  .put([validateMongooseIdMiddleware, authMiddleware, admin], updateUser)
  .delete([validateMongooseIdMiddleware, authMiddleware, admin], deleteUser);

adminRouter.delete(
  "/user/delete_user_orders/:id",
  [validateMongooseIdMiddleware, authMiddleware, admin],
  deleteUserOrders
);

// TODO:: Admin Setting Bot Routes
adminRouter.post("/setup_bot", [authMiddleware, admin], createBotSetting);
adminRouter.put(
  "/setup_bot/:id",
  [validateMongooseIdMiddleware, authMiddleware, admin],
  updateBotSetting
);

// TODO:: Sub Admin User Create Routes

// TODO:: Sub Admin User Get Routes
adminRouter.get("/sub_admin_user/:id", getAllsubAdminUser);

// TODO:: Admin Indicator Bot Routes
adminRouter.get("/bot_indicator", [authMiddleware, admin], getAllIndicator);

// TODO:: Profit Loss Admin Routes
adminRouter.get(
  "/profit_loss/dashboard",
  [authMiddleware, admin],
  getProfitLossDashboard
);
adminRouter.get(
  "/profit_loss/statistics",
  [authMiddleware, admin],
  getProfitLossStatistics
);
adminRouter.get("/profit_loss/details", [authMiddleware, admin], getProfitLoss);

// NOTE:: Sub Admins Routes
// TODO:: Get All Sub Admin Routes
adminRouter
  .route("/sub_admin")
  .get([authMiddleware, admin], getAllSubAdmin) // GET All SubAdmins
  .put([authMiddleware, admin], assignUsers); // AssignUsers to Sub_Admin
adminRouter.route("/sub_admin/:id").delete([authMiddleware], deleteSubAdmin);

// TODO:: User billing Routes
adminRouter.post("/bill", [authMiddleware], createBilling);
adminRouter.get(
  "/bill/:id",
  [validateMongooseIdMiddleware, authMiddleware],
  getBilling
);
adminRouter.put(
  "/bill/update/:id",
  [validateMongooseIdMiddleware, authMiddleware],
  updateUserPaidStatus
);
adminRouter.delete(
  "/bill/:id",
  [validateMongooseIdMiddleware, authMiddleware],
  deleteUserBill
);

adminRouter.put("/bill/recipt", [authMiddleware], updateUserBillRecipt);

adminRouter.get("/clear_data", [authMiddleware, admin], clearData);

//NOTE:: Bot Routes
adminRouter.delete(
  "/bot/:id",
  [validateMongooseIdMiddleware, authMiddleware, admin],
  deleteBot
);

/*NOTE:: Export Data Routes*/
adminRouter.get(
  "/export/bot/:startDate/:endDate/:id",
  [authMiddleware, admin],
  exportBotData
);

adminRouter.get("/activity", authMiddleware, botsActivity);

const adminRoutes = (app) => {
  app.use("/api/admin", adminRouter);
};

export default adminRoutes;
