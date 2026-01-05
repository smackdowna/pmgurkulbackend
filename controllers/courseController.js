import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";

import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import util from "util";
import s3 from "../utils/s3.js";

//create course
export const createCourse = catchAsyncError(async (req, res, next) => {
  const {
    title,
    description,
    courseOverview,
    courseObjective,
    category,
    author,
    basePrice,
    discountedPrice,
    totalDuration,
    referBonus,
  } = req.body;

  if (
    !title ||
    !description ||
    !courseOverview ||
    !courseObjective ||
    !category ||
    !author ||
    !basePrice ||
    !discountedPrice ||
    !totalDuration ||
    !referBonus
  )
    return next(new ErrorHandler("Please Enter all fields", 400));

  const file = req.file;

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const referralBonus = Number(referBonus);
  const course = await Course.create({
    title,
    description,
    courseOverview,
    courseObjective,
    category,
    author,
    basePrice,
    discountedPrice,
    totalDuration,
    referBonus: referralBonus,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course Created successfully.You can add lectures now",
    course,
  });
});

//get all course
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const { keyword, category } = req.query; // Assuming 'keyword' is passed as a query param

  // Define the query object
  const query = {};

  // Add search by course name (title) using the 'keyword'
  if (keyword) {
    query.title = {
      $regex: keyword.trim(), // Ensure no extra spaces
      $options: "i", // Case-insensitive search
    };
  }

  // Add filter by category
  if (category) {
    query.category = category;
  }

  // Fetch courses based on the query
  const courses = await Course.find(query).select("-lectures");

  res.status(200).json({
    success: true,
    courses,
  });
});

//get course lectures
export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

export const updateCourse = catchAsyncError(async (req, res, next) => {
  const {
    title,
    description,
    courseOverview,
    courseObjective,
    category,
    author,
    basePrice,
    discountedPrice,
    totalDuration,
    referBonus,
  } = req.body;

  const { id } = req.params;

  let course = await Course.findById(id);
  if (!course) return next(new ErrorHandler("Course not found", 404));

  // If a new file is uploaded, replace the old one
  if (req.file) {
    // Delete old poster from cloudinary
    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    const fileUri = getDataUri(req.file);
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    course.poster = {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    };
  }

  const referralBonus = Number(referBonus);

  course.title = title || course.title;
  course.description = description || course.description;
  course.courseOverview = courseOverview || course.courseOverview;
  course.courseObjective = courseObjective || course.courseObjective;
  course.category = category || course.category;
  course.author = author || course.author;
  course.basePrice = basePrice || course.basePrice;
  course.discountedPrice = discountedPrice || course.discountedPrice;
  course.totalDuration = totalDuration || course.totalDuration;
  course.referBonus = referralBonus || course.referBonus;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    course,
  });
});

//delete lectures
// export const addLectures = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const { title, description, videoDuration } = req.body;

//   const file = req.file;

//   if (!title || !description || !videoDuration || !file)
//     return next(new ErrorHandler("Please Enter all details", 404));

//   const course = await Course.findById(id);

//   if (!course) return next(new ErrorHandler("Course Not Found", 404));

//   const fileUri = getDataUri(file);
//   const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
//     resource_type: "video",
//   });

//   course.lectures.push({
//     title,
//     description,
//     videoDuration,
//     video: {
//       public_id: mycloud.public_id,
//       url: mycloud.secure_url,
//     },
//   });

//   course.numOfVideos = course.lectures.length;

//   await course.save();

//   res.status(200).json({
//     success: true,
//     message: "Lectures added successfully",
//   });
// });

const unlinkFile = util.promisify(fs.unlink);

export const addLectures = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, videoDuration } = req.body;
  const file = req.file;

  if (!title || !description || !videoDuration || !file)
    return next(new ErrorHandler("Please Enter all details", 400));

  const course = await Course.findById(id);
  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  const fileContent = fs.readFileSync(file.path);

  const fileExtension = path.extname(file.originalname);
  const s3Key = `lectures/${uuidv4()}${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: file.mimetype,
    // ACL: "public-read",
  };

  const uploadResult = await s3.upload(params).promise();

  await unlinkFile(file.path); // delete local temp file

  course.lectures.push({
    title,
    description,
    videoDuration,
    video: {
      public_id: s3Key,
      url: uploadResult.Location,
    },
  });

  course.numOfVideos = course.lectures.length;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture added successfully",
  });
});

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  // ✅ Delete poster from Cloudinary
  if (course.poster?.public_id) {
    await cloudinary.v2.uploader.destroy(course.poster.public_id);
  }

  // ✅ Delete lecture videos from S3
  for (const lecture of course.lectures) {
    const videoKey = lecture.video?.public_id;
    if (videoKey) {
      try {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: videoKey,
          })
          .promise();
      } catch (error) {
        console.error(`Failed to delete S3 video: ${videoKey}`, error);
      }
    }
  }

  // ✅ Remove course from DB
  await Course.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

//delete lectures
export const deleteLectures = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });

  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture deleted successfully",
  });
});

//get course details
export const getCoursedetails = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "forum",
    populate: {
      path: "sender",
      select: "full_name email role",
    },
  });

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  res.status(200).json({
    success: true,
    course,
  });
});

//get categories
export const getAllCategories = catchAsyncError(async (req, res, next) => {
  // Use Mongoose `distinct` to get unique categories
  const categories = await Course.distinct("category");

  // If no categories found
  if (!categories || categories.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No categories found",
    });
  }

  // Send response
  res.status(200).json({
    success: true,
    categories,
  });
});

export const addForumThread = async (req, res) => {
  const { courseId } = req.params;
  const { title, content } = req.body;
  const userId = req.user._id;

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  course.forum.push({
    title,
    content,
    sender: userId,
  });

  await course.save();
  res.status(201).json({ success: true, message: "Forum thread added" });
};

export const deleteForumFromCourse = async (req, res) => {
  const { courseId, forumId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Corrected to match schema field name: "forum"
    course.forum = course.forum.filter(
      (forum) => forum._id.toString() !== forumId
    );

    await course.save();

    res.status(200).json({ message: "Forum deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// export const addReplyToForum = async (req, res) => {
//   const { courseId, messageId } = req.params;
//   const { message } = req.body;
//   const userId = req.user._id;

//   const course = await Course.findById(courseId);
//   if (!course) return res.status(404).json({ message: "Course not found" });

//   const thread = course.forum.id(messageId);
//   if (!thread) return res.status(404).json({ message: "Forum thread not found" });

//   thread.replies.push({
//     sender: userId,
//     message,
//   });

//   await course.save();
//   res.status(201).json({ success: true, message: "Reply added" });
// };
