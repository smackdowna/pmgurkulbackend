import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { getAdminStats } from "../controllers/adminController.js";

const router = express.Router();

router.route("/admin/stats").get(isAuthenticated, authorizeRoles("admin"), getAdminStats);

export default router;
