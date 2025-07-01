import jwt from "jsonwebtoken";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new ErrorHandler("Please Login to access this", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded._id);

  next();
});

//authorize roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }
    next();
  };
};

//has purchased the course
export const hasPurchasedCourse = catchAsyncError(async (req, res, next) => {
  const courseId = req.params.id; // Extract course ID from route parameter
  if (!courseId) {
    return next(new ErrorHandler("Course ID is required.", 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!user.purchasedCourses.includes(courseId)) {
    return next(
      new ErrorHandler(
        "You have not purchased this course. Please purchase it to access this resource.",
        403
      )
    );
  }

  next();
});
