import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  addPhoto,
  getAllPhotos,
  getSinglePhotoById,
  deletePhoto,
} from "../controllers/photoGalleryController.js";
import singleUpload from "./../middlewares/multer.js";

const router = express.Router();

router
  .route("/add")
  .post(isAuthenticated, authorizeRoles("admin"), singleUpload, addPhoto);

router.route("/").get(getAllPhotos);
router.route("/:id").get(getSinglePhotoById);
router
  .route("/:id")
  .delete(isAuthenticated, authorizeRoles("admin"), deletePhoto);

export default router;
