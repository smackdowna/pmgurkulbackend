import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { assignPagesToUser, getAdminStats, makeUserEmployee } from "../controllers/adminController.js";
import { authorizeRoute } from './../middlewares/authorizeRoute.js';

const router = express.Router();

router.route("/admin/stats").get(isAuthenticated, authorizeRoles("admin"), authorizeRoute(), getAdminStats);
router.route("/admin/make-employee").put(isAuthenticated, authorizeRoles("admin"), authorizeRoute(), makeUserEmployee);
router.route("/admin/assign-page").put(isAuthenticated, authorizeRoles("admin"), assignPagesToUser);


export default router;