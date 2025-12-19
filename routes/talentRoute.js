import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createTalent,
  deleteTalentById,
  getAllTalents,
  getMyTalents,
  getSingleTalent,
} from "../controllers/talentController.js";
import { singleUploadS3 } from "../controllers/s3multer.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

router
  .route("/talent")
  .get(isAuthenticated, authorizeRoute(), getAllTalents)
  .post(isAuthenticated, singleUploadS3, createTalent);

router.route("/talent/my-talents").get(isAuthenticated, getMyTalents);

router.route("/talent/:id").get(getSingleTalent);
router.route("/talent/delete/:id").delete(isAuthenticated, deleteTalentById);

export default router;
