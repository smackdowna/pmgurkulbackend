import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { assignPagesToUser, getAdminStats, makeUserEmployee } from "../controllers/adminController.js";

const router = express.Router();

router.route("/admin/stats").get(isAuthenticated, authorizeRoles("admin"), getAdminStats);
router.route("/admin/make-employee").put(isAuthenticated, authorizeRoles("admin"), makeUserEmployee);
router.route("/admin/assign-page").put(isAuthenticated, authorizeRoles("admin"), assignPagesToUser);


export default router;
