import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getFullReferralNetwork } from "../controllers/referralNetwork.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

router
  .route("/")
  .get(isAuthenticated, authorizeRoute(), getFullReferralNetwork);

export default router;
