import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createCourseBundle,
  getAllCourseBundles,
  getSingleCourseBundleById,
  updateCourseBundle,
  deleteCourseBundle,
} from "../controllers/courseBundleController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

// Create course bundle
router
  .route("/create")
  .post(
    isAuthenticated,
    authorizeRoute(),
    singleUpload,
    createCourseBundle
  );

// Update course bundle
router
  .route("/update/:id")
  .put(
    isAuthenticated,
    authorizeRoute(),
    singleUpload,
    updateCourseBundle
  );

// Delete course bundle
router
  .route("/delete/:id")
  .delete(isAuthenticated, authorizeRoute(), deleteCourseBundle);

// Get all course bundles
router.route("/").get(getAllCourseBundles);

// Get single course bundle by ID
router.route("/:id").get(getSingleCourseBundleById);

export default router;
