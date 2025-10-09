import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createTalent,
  getAllTalents,
  getMyTalents,
  getSingleTalent,
} from "../controllers/talentController.js";
import { singleUploadS3 } from "../controllers/s3multer.js";

const router = express.Router();

router
  .route("/talent")
  .get(getAllTalents)
  .post(isAuthenticated, singleUploadS3, createTalent);

router.route("/talent/my-talents").get(getMyTalents);

router.route("/talent/:id").get(getSingleTalent);

export default router;