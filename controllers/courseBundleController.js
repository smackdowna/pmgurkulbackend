import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { CourseBundle } from "../models/CourseBundle.js";

export const createCourseBundle = catchAsyncError(async (req, res, next) => {
  let { title, description, price, courseIds } = req.body;

  // 👇 IMPORTANT: Parse courseIds if it comes as string
  if (typeof courseIds === "string") {
    try {
      courseIds = JSON.parse(courseIds);
    } catch (error) {
      return next(new ErrorHandler("Invalid courseIds format", 400));
    }
  }

  if (
    !title ||
    !description ||
    !price ||
    !Array.isArray(courseIds) ||
    !courseIds.length
  ) {
    return next(new ErrorHandler("Please enter all required fields", 400));
  }

  let thumbnail = null;

  if (req.file) {
    const fileUri = getDataUri(req.file);
    const uploadResult = await cloudinary.v2.uploader.upload(fileUri.content);

    thumbnail = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const bundle = await CourseBundle.create({
    title,
    description,
    price,
    courseIds,
    thumbnail,
  });

  res.status(201).json({
    success: true,
    message: "Course bundle created successfully",
    bundle,
  });
});

export const getAllCourseBundles = catchAsyncError(async (req, res, next) => {
  const { keyword } = req.query;

  const query = {};

  if (keyword) {
    query.title = {
      $regex: keyword.trim(),
      $options: "i",
    };
  }

  const bundles = await CourseBundle.find(query);

  res.status(200).json({
    success: true,
    bundles,
  });
});

export const getSingleCourseBundleById = catchAsyncError(
  async (req, res, next) => {
    const bundle = await CourseBundle.findById(req.params.id);

    if (!bundle) {
      return next(new ErrorHandler("Course bundle not found", 404));
    }

    res.status(200).json({
      success: true,
      bundle,
    });
  }
);

export const updateCourseBundle = catchAsyncError(async (req, res, next) => {
  const { title, description, price, courseIds } = req.body;
  const { id } = req.params;

  const bundle = await CourseBundle.findById(id);
  if (!bundle) {
    return next(new ErrorHandler("Course bundle not found", 404));
  }

  // Replace thumbnail if new file is uploaded
  if (req.file) {
    if (bundle.thumbnail?.public_id) {
      await cloudinary.v2.uploader.destroy(bundle.thumbnail.public_id);
    }

    const fileUri = getDataUri(req.file);
    const uploadResult = await cloudinary.v2.uploader.upload(fileUri.content);

    bundle.thumbnail = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  bundle.title = title ?? bundle.title;
  bundle.description = description ?? bundle.description;
  bundle.price = price ?? bundle.price;
  bundle.courseIds = courseIds ?? bundle.courseIds;

  await bundle.save();

  res.status(200).json({
    success: true,
    message: "Course bundle updated successfully",
    bundle,
  });
});

export const deleteCourseBundle = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const bundle = await CourseBundle.findById(id);
  if (!bundle) {
    return next(new ErrorHandler("Course bundle not found", 404));
  }

  // Delete thumbnail from Cloudinary
  if (bundle.thumbnail?.public_id) {
    await cloudinary.v2.uploader.destroy(bundle.thumbnail.public_id);
  }

  await CourseBundle.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Course bundle deleted successfully",
  });
});
