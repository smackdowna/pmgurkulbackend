import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  generateCertificate,
  getStudentCertificates,
} from "../controllers/certificateController.js";

const router = express.Router();

//Add questions --Admin
router
  .route("/certificate/generate")
  .post(isAuthenticated, generateCertificate);

router.route("/certificate").get(isAuthenticated, getStudentCertificates);

export default router;
