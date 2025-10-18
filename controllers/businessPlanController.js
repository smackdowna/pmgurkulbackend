import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import s3 from "../utils/s3.js";
import { unlink as unlinkFile } from "fs/promises"; 
import { BusinessPlan } from "../models/BusinessPlan.js";

export const addBusinessPlanDoc = catchAsyncError(async (req, res, next) => {
  const { title, description } = req.body;
  const file = req.file;

  if (!title || !description || !file) {
    return next(new ErrorHandler("Please enter all required fields", 400));
  }

  const fileContent = fs.readFileSync(file.path);

  const fileExtension = path.extname(file.originalname);
  const s3Key = `businessPlans/${uuidv4()}${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();

  await unlinkFile(file.path); // Delete temp file

  const businessPlan = await BusinessPlan.create({
    title,
    description,
    file: {
      public_id: s3Key,
      url: uploadResult.Location,
    },
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

export const updateBusinessPlanDoc = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    const doc = await BusinessPlan.findById(id);
    if (!doc) return next(new ErrorHandler("Business Plan Not Found", 404));

    // Update title and description
    if (title) doc.title = title;
    if (description) doc.description = description;

    // If new file uploaded, replace the old one in S3
    if (file) {
      // Delete old file from S3
      const oldFileKey = doc.file?.public_id;
      if (oldFileKey) {
        try {
          await s3
            .deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldFileKey,
            })
            .promise();
        } catch (err) {
          console.error(`Failed to delete old S3 file: ${oldFileKey}`, err);
        }
      }

      // Upload new file to S3
      const fileContent = fs.readFileSync(file.path);
      const fileExtension = path.extname(file.originalname);
      const s3Key = `businessPlans/${uuidv4()}${fileExtension}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      const uploadResult = await s3.upload(params).promise();

      await unlinkFile(file.path); // Delete temp file

      doc.file = {
        public_id: s3Key,
        url: uploadResult.Location,
      };
    }

    await doc.save();

    res.status(200).json({
      success: true,
      message: "Business Plan updated successfully",
      businessPlan: doc,
    });
  }
);

// delete business doc
export const deleteBusinessPlanDoc = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const doc = await BusinessPlan.findById(id);
    if (!doc) return next(new ErrorHandler("Business Plan Not Found", 404));

    // ✅ Delete from S3
    const fileKey = doc.file?.public_id;
    if (fileKey) {
      try {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          })
          .promise();
      } catch (error) {
        console.error(`Failed to delete S3 object: ${fileKey}`, error);
      }
    }

    // ✅ Remove from DB
    await BusinessPlan.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Business Plan deleted successfully",
    });
  }
);
