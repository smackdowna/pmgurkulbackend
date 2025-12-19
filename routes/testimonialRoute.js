import express from "express";
import {
  addTestimonial,
  getAllTestimonials,
  getSingleTestimonialById,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import multipleUpload from './../middlewares/multipleUpload.js';
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

// Add testimonial — Admin only
router.route("/add").post(
  isAuthenticated,
  authorizeRoute(),
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
  .delete(isAuthenticated, authorizeRoute(), deleteTestimonial);

export default router;
