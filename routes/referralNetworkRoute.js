import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { getFullReferralNetwork } from "../controllers/referralNetwork.js";

const router = express.Router();

router
  .route("/")
  .get(isAuthenticated, authorizeRoles("admin"), getFullReferralNetwork);

export default router;
