import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { allEarnings, allEarningsApproved, allEarningsPending, approvePayout, approvePayoutByUserId, getWeeklyEarnings } from "../controllers/earningsController.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";


const router = express.Router();


//get all pending payout
router.route("/pendingpayout").get(isAuthenticated,authorizeRoute(),allEarningsPending);
// get weekly earnings
router.route("/weekly-earnings").get(isAuthenticated,authorizeRoute(), getWeeklyEarnings);
// Approve weekly payout
router.patch("/approve-payout/:userId", approvePayoutByUserId);

//approved payout
router.route("/approvedpayout").get(isAuthenticated,authorizeRoute(),allEarningsApproved)

//all payout
router.route("/earnings").get(isAuthenticated,authorizeRoute(),allEarnings)


//approve payout
router.route("/approve/payout/:id").put(isAuthenticated,authorizeRoute(),approvePayout);


export default router;
