import express from "express";
import {
  addTestimonial,
  getAllTestimonials,
  getSingleTestimonialById,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import multipleUpload from './../middlewares/multipleUpload.js';

const router = express.Router();

// Add testimonial — Admin only
router.route("/add").post(
  isAuthenticated,
  authorizeRoles("admin"),
  multipleUpload,
  addTestimonial
);

// Get all testimonials — Public
router.route("").get(getAllTestimonials);

// Get single testimonial by ID — Public
router.route("/:id").get(getSingleTestimonialById);

// Delete testimonial — Admin only
router
  .route("/delete/:id")
  .delete(isAuthenticated, authorizeRoles("admin"), deleteTestimonial);

export default router;
