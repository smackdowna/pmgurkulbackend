import express from "express";
import { isAuthenticated} from "../middlewares/auth.js";
import { getReferralSummary } from "../controllers/transactionHistory.js";


const router = express.Router();

//create order
router.route("/refral/summary").get(isAuthenticated,getReferralSummary);





export default router;
