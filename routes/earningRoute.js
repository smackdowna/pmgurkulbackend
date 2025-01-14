import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import { allEarnings, allEarningsApproved, allEarningsPending, approvePayout } from "../controllers/earningsController.js";


const router = express.Router();


//get all pending payout
router.route("/pendingpayout").get(isAuthenticated,authorizeRoles("admin"),allEarningsPending);

//approved payout
router.route("/approvedpayout").get(isAuthenticated,authorizeRoles("admin"),allEarningsApproved)

//all payout
router.route("/earnings").get(isAuthenticated,authorizeRoles("admin"),allEarnings)


//approve payout
router.route("/approve/payout/:id").put(isAuthenticated,authorizeRoles("admin"),approvePayout);


export default router;
