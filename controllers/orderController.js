import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Order } from "../models/OrderModel.js";
import { Course } from "../models/Course.js";
import { User } from "../models/userModel.js";
import { Earnings } from "../models/Earning.js";

//create order
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { courseId } = req.body;

  // Check if courseId is provided
  if (!courseId) return next(new ErrorHandler("Enter Course ID", 404));

  // Find course by courseId
  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  const user = await User.findById(req.user.id);
  if (user.purchasedCourses.includes(courseId)) {
    return next(
      new ErrorHandler("You have already purchased this course.", 400)
    );
  }

  // Find the referrer (the user who referred the current user)
  const referrer = await User.findById(req.user.referredBy);
  if (!referrer) return next(new ErrorHandler("You cannot proceed", 404));

  // Get the referral code used by the current user
  const referralCodeUsed = referrer.refralCode;

  // Get the discounted price from the course
  const discountedPrice = course.discountedPrice;

  let totalPrice = 0;
  // Calculate GST (18% on discounted price)
  const gstAmount = (discountedPrice * 18) / 100;
  totalPrice = discountedPrice + gstAmount;

  // Commission calculation (50% of the discounted price)
  const commission = (discountedPrice * 50) / 100;

  // TDS calculation (5% of commission)
  const tds = (commission * 5) / 100;

  // Amount credited to referrer (after TDS deduction)
  const amountCredited = commission - tds;

  // Create the order with initial details
  const order = await Order.create({
    user: req.user.id,
    course: courseId,
    referralCodeUsed,
    totalPrice,
    discountedPrice,
    gst: 18, // You can make this dynamic if necessary
    commission,
    tds,
    amountCredited, // Referrer's net amount after TDS
  });

  // Update the user (purchaser) details after course purchase

  if (user) {
    user.purchasedCourses.push(courseId);
    await user.save();
  }

  // Update the referrer's earnings after commission and TDS deduction
  if (referrer) {
    // Ensure earnings object is initialized
    if (!referrer.earnings || typeof referrer.earnings.total !== "number") {
      referrer.earnings = { total: 0 };
    }
    referrer.earnings.total += amountCredited; // Update total earnings
    await referrer.save(); // Save referrer's updated earnings
  }

  

  // Log the earnings into the Earnings table (for the referrer)
  await Earnings.create({
    user: referrer._id,
    order: order._id,
    totalPrice,
    discountedPrice,
    gst: 18, // You can make this dynamic if necessary
    commission,
    tds,
    amountCredited, // Referrer's net amount after TDS// Net amount credited to the referrer
  });

  course.totalEnrolled+=1;
  await course.save();

  // Send response with order details
  res.status(200).json({
    success: true,
    message: "Course Purchased! You can start learning.",
    order,
  });
});

//get my order
export const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    orders,
  });
});

//get all order--Admin
export const getAllOrders = catchAsyncError(async (req, res, next) => {
  const ordersCount = await Order.countDocuments();

  const orders = await Order.find()
  .sort({ createdAt: -1 })
  .populate("user", "full_name mobileNumber"); 

  res.status(200).json({
    success: true,
    ordersCount,
    orders,
  });
});


//get single order
export const getSingleOrder = catchAsyncError(async(req,res,next)=>{
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order
  });
})