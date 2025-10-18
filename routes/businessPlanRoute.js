import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import { singleUploadS3 } from "../controllers/s3multer.js";
import {
  addBusinessPlanDoc,
  getAllBusinessDocs,
  getSingleBusinessDocById,
  deleteBusinessPlanDoc,
} from "../controllers/businessPlanController.js";

const router = express.Router();

// Upload Business Plan Document
router
  .route("/upload")
  .post(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addBusinessPlanDoc)
// Upload Business Plan Document

router
  .route("/")
  .post(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addBusinessPlanDoc)
  .get(isAuthenticated, authorizeRoles("admin"), getAllBusinessDocs);

// Get Single Business Plan by ID
router
  .route("/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getSingleBusinessDocById)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteBusinessPlanDoc);

export default router;