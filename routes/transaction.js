import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getReferralLeaderboard,
  getReferralSummary,
} from "../controllers/transactionHistory.js";

const router = express.Router();

//create order
router.route("/refral/summary").get(isAuthenticated, getReferralSummary);
router
  .route("/referral/leaderboard")
  .get(isAuthenticated, getReferralLeaderboard);

export default router;