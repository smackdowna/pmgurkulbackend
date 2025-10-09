import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
  createTalent,
  deleteTalentById,
  getAllTalents,
  getMyTalents,
  getSingleTalent,
} from "../controllers/talentController.js";
import { singleUploadS3 } from "../controllers/s3multer.js";

const router = express.Router();

router
  .route("/talent")
  .get(isAuthenticated, authorizeRoles("admin"), getAllTalents)
  .post(isAuthenticated, singleUploadS3, createTalent);

router.route("/talent/my-talents").get(isAuthenticated, getMyTalents);

router.route("/talent/:id").get(getSingleTalent);
router.route("/talent/delete/:id").delete(isAuthenticated, deleteTalentById);

export default router;
