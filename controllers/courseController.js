import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";

//create course
export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, author,basePrice, discountedPrice } = req.body;

  if ((!title || !description || !category || !author || !basePrice || !discountedPrice))
    return next(new ErrorHandler("Please Enter all fields", 400));

  const file = req.file;

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    author,
    basePrice,
    discountedPrice,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course Created successfully.You can add lectures now",
  });
});

//get all course
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const { search, category } = req.query;

  // Define a query object
  const query = {};

  // Add search by course name (title)
  if (search) {
    query.title = { $regex: search, $options: "i" }; // Case-insensitive partial match
  }

  // Add filter by category
  if (category) {
    query.category = category;
  }

  // Fetch courses based on query
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

//delete lectures
export const addLectures = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const file = req.file;

  if (!title || !description || !file)
    return next(new ErrorHandler("Please Enter all details", 404));

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lectures added successfully",
  });
});

//delete course
export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    });
  }

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
  const course = await Course.findById(req.params.id);

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