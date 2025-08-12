import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
  generateCertificate,
  getAllCertificates,
  getStudentCertificates,
} from "../controllers/certificateController.js";

const router = express.Router();

//Add questions --Admin
router
  .route("/certificate/generate")
  .post(isAuthenticated, generateCertificate);

router.route("/certificate").get(isAuthenticated, getStudentCertificates);
router.route("/certificate/all").get(isAuthenticated, authorizeRoles("admin"), getAllCertificates);

export default router;
