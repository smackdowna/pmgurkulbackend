import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { BusinessPlan } from "../models/BusinessPlan.js";

export const addBusinessPlanDoc = catchAsyncError(async (req, res, next) => {
  const { title, description, fileUrl } = req.body;

  if (!title || !description || !fileUrl) {
    return next(new ErrorHandler("Please enter all required fields", 400));
  }

  const businessPlan = await BusinessPlan.create({
    title,
    description,
    fileUrl,
  });

  res.status(201).json({
    success: true,
    message: "Business Plan uploaded successfully",
    businessPlan,
  });
});

// get all business docs
export const getAllBusinessDocs = catchAsyncError(async (req, res, next) => {
  const docs = await BusinessPlan.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    docs,
  });
});

// get single business doc by id
export const getSingleBusinessDocById = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const doc = await BusinessPlan.findById(id);
    if (!doc) return next(new ErrorHandler("Business Plan Not Found", 404));

    res.status(200).json({
      success: true,
      doc,
    });
  }
);

export const updateBusinessPlanDoc = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, fileUrl } = req.body;

  const doc = await BusinessPlan.findById(id);
  if (!doc) return next(new ErrorHandler("Business Plan Not Found", 404));

  // Update title and description
  if (title) doc.title = title;
  if (description) doc.description = description;
  if (fileUrl) doc.fileUrl = fileUrl;

  await doc.save();

  res.status(200).json({
    success: true,
    message: "Business Plan updated successfully",
    businessPlan: doc,
  });
});

// delete business doc
export const deleteBusinessPlanDoc = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const doc = await BusinessPlan.findById(id);
  if (!doc) return next(new ErrorHandler("Business Plan Not Found", 404));

  await BusinessPlan.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Business Plan deleted successfully",
  });
});
