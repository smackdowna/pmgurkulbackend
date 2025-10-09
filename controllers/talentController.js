import fs from "fs";
import util from "util";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Talent } from "../models/Talents.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import s3 from "../utils/s3.js";

const unlinkFile = util.promisify(fs.unlink);

//Create a new Talent submission
export const createTalent = catchAsyncError(async (req, res, next) => {
  const { title, name, email, talentType, description, skills } = req.body;
  const file = req.file;

  if (!title || !name || !email || !talentType || !description || !file) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Read video file
  const fileContent = fs.readFileSync(file.path);
  const fileExtension = path.extname(file.originalname);
  const s3Key = `talents/${uuidv4()}${fileExtension}`;

  // Upload to AWS S3
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();

  // Delete local temp file
  await unlinkFile(file.path);

  // Create Talent entry
  const talent = await Talent.create({
    userId: req?.user?._id,
    title,
    name,
    email,
    talentType,
    description,
    skills: skills ? (Array.isArray(skills) ? skills : skills.split(",")) : [],
    video: uploadResult.Location,
  });

  res.status(201).json({
    success: true,
    message: "Talent submitted successfully!",
    data: talent,
  });
});

// Get all talents with filters and search
export const getAllTalents = catchAsyncError(async (req, res) => {
  const { talentType, keyword } = req.query;

  const filter = {};

  if (talentType) {
    filter.talentType = talentType;
  }

  if (keyword) {
    const searchRegex = new RegExp(keyword, "i");
    filter.$or = [
      { title: searchRegex },
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  const talents = await Talent.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: talents.length,
    data: talents,
  });
});

// Get single talent by ID
export const getSingleTalent = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const talent = await Talent.findById(id);

  if (!talent) {
    return next(new ErrorHandler("Talent not found", 404));
  }

  res.status(200).json({
    success: true,
    data: talent,
  });
});

// Get my talents
export const getMyTalents = catchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { talentType } = req.query;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  // Build filter
  const filter = { userId };
  if (talentType) {
    filter.talentType = talentType;
  }

  const myTalents = await Talent.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: myTalents.length,
    data: myTalents,
  });
});


// Delete talent by ID
export const deleteTalentById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user; // Should contain _id and role

  if (!user) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  let talent;

  if (user.role === "admin") {
    talent = await Talent.findById(id);
  } else {
    talent = await Talent.findOne({ _id: id, userId: user._id });
  }

  if (!talent) {
    return next(new ErrorHandler("Talent not found or not authorized", 404));
  }

  await Talent.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Talent deleted successfully",
  });
});


