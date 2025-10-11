import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { PhotoGallery } from "../models/PhotoGallery.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";

export const addPhoto = catchAsyncError(async (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    return next(new ErrorHandler("Please provide a title", 400));
  }

   const file = req.file;

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const poster = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  const photo = await PhotoGallery.create({
    title,
    poster,
  });

  res.status(201).json({
    success: true,
    message: "Photo added successfully",
    photo,
  });
});

export const getAllPhotos = catchAsyncError(async (req, res, next) => {
  const photos = await PhotoGallery.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: photos.length,
    photos,
  });
});

export const getSinglePhotoById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const photo = await PhotoGallery.findById(id);

  if (!photo) {
    return next(new ErrorHandler("Photo not found", 404));
  }

  res.status(200).json({
    success: true,
    photo,
  });
});

export const deletePhoto = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const photo = await PhotoGallery.findById(id);

  if (!photo) {
    return next(new ErrorHandler("Photo not found", 404));
  }

  if (photo.poster && photo.poster.public_id) {
    await cloudinary.v2.uploader.destroy(photo.poster.public_id);
  }

  await photo.deleteOne();

  res.status(200).json({
    success: true,
    message: "Photo deleted successfully",
  });
});
