import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import { getReferralSummary } from "../controllers/transactionHistory.js";


const router = express.Router();

//create order
router.route("/user/summary").get(isAuthenticated,getReferralSummary);





export default router;
