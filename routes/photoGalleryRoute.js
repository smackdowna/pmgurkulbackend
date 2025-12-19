import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  addPhoto,
  getAllPhotos,
  getSinglePhotoById,
  deletePhoto,
} from "../controllers/photoGalleryController.js";
import singleUpload from "./../middlewares/multer.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

router
  .route("/add")
  .post(isAuthenticated, authorizeRoute(), singleUpload, addPhoto);

router.route("/").get(getAllPhotos);
router.route("/:id").get(getSinglePhotoById);
router
  .route("/delete/:id")
  .delete(isAuthenticated, authorizeRoute(), deletePhoto);

export default router;
