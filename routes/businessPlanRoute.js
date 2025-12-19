import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  addBusinessPlanDoc,
  getAllBusinessDocs,
  getSingleBusinessDocById,
  deleteBusinessPlanDoc,
  updateBusinessPlanDoc,
} from "../controllers/businessPlanController.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

// Upload Business Plan Document
router
  .route("/upload")
  .post(isAuthenticated, authorizeRoute(), addBusinessPlanDoc)
// Upload Business Plan Document

router
  .route("/")
  .post(isAuthenticated, authorizeRoute(), addBusinessPlanDoc)
  .get(isAuthenticated, authorizeRoute(), getAllBusinessDocs);

router
  .route("/:id")
  .get(isAuthenticated, authorizeRoute(), getSingleBusinessDocById)
  .put(isAuthenticated, authorizeRoute(), updateBusinessPlanDoc)
  .delete(isAuthenticated, authorizeRoute(), deleteBusinessPlanDoc);

export default router;