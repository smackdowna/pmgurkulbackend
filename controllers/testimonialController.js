import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Testimonial } from "../models/Testimonial.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import s3 from "../utils/s3.js";
import getDataUri from "./../utils/dataUri.js";

export const addTestimonial = catchAsyncError(async (req, res, next) => {
  const { name, designation, testimonialType, review, rating } = req.body;

  // Base validation
  if (!name || !designation || !testimonialType || !rating) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (!["Text", "Video"].includes(testimonialType)) {
    return next(new ErrorHandler("Invalid testimonial type", 400));
  }

  if (testimonialType === "Text" && !review) {
    return next(
      new ErrorHandler("Please provide review text for text testimonial", 400)
    );
  }

  let video = null;
  let poster = null;

  // Upload poster to Cloudinary (if provided)
  if (req.files?.poster?.[0]) {
    const posterFile = req.files.poster[0];
    const fileUri = getDataUri(posterFile);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    poster = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  // Upload video to S3 (if testimonialType is Video)
  if (testimonialType === "Video") {
    const videoFile = req.files?.video?.[0];

    if (!videoFile) {
      return next(
        new ErrorHandler(
          "Please upload a video file for video testimonial",
          400
        )
      );
    }

    const videoExt = path.extname(videoFile.originalname);
    const videoKey = `testimonials/videos/${uuidv4()}${videoExt}`;

    const videoUpload = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: videoKey,
        Body: videoFile.buffer,
        ContentType: videoFile.mimetype,
      })
      .promise();

    video = {
      public_id: videoKey,
      url: videoUpload.Location,
    };
  }

  // Create testimonial
  const testimonial = await Testimonial.create({
    name,
    designation,
    testimonialType,
    review: testimonialType === "Text" ? review : "",
    rating,
    poster,
    video,
  });

  res.status(201).json({
    success: true,
    message: "Testimonial added successfully",
    testimonial,
  });
});

// Get All Testimonials
export const getAllTestimonials = catchAsyncError(async (req, res, next) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: testimonials.length,
    testimonials,
  });
});

// Get Single Testimonial by ID
export const getSingleTestimonialById = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return next(new ErrorHandler("Testimonial not found", 404));
    }

    res.status(200).json({
      success: true,
      testimonial,
    });
  }
);

// Delete Testimonial
export const deleteTestimonial = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    return next(new ErrorHandler("Testimonial not found", 404));
  }

  // If there’s a poster, delete from Cloudinary
  if (testimonial.poster && testimonial.poster.public_id) {
    await cloudinary.v2.uploader.destroy(testimonial.poster.public_id);
  }

  await testimonial.deleteOne();

  res.status(200).json({
    success: true,
    message: "Testimonial deleted successfully",
  });
});
