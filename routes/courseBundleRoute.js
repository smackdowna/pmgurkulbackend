import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  createCourseBundle,
  getAllCourseBundles,
  getSingleCourseBundleById,
  updateCourseBundle,
  deleteCourseBundle,
} from "../controllers/courseBundleController.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

// Create course bundle
router
  .route("/create")
  .post(
    isAuthenticated,
    authorizeRoles("admin"),
    singleUpload,
    createCourseBundle
  );

// Update course bundle
router
  .route("/update/:id")
  .put(
    isAuthenticated,
    authorizeRoles("admin"),
    singleUpload,
    updateCourseBundle
  );

// Delete course bundle
router
  .route("/delete/:id")
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCourseBundle);

// Get all course bundles
router.route("/").get(getAllCourseBundles);

// Get single course bundle by ID
router.route("/:id").get(getSingleCourseBundleById);

export default router;
