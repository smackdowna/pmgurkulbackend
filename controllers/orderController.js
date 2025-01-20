import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Order } from "../models/OrderModel.js";
import { Course } from "../models/Course.js";
import { User } from "../models/userModel.js";
import { Earnings } from "../models/Earning.js";

//create order
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { courseId } = req.body;

  // Check if courseId is provided and is an array
  if (!courseId || !Array.isArray(courseId) || courseId.length === 0) {
    return next(new ErrorHandler("Enter valid Course IDs", 400));
  }

  const user = await User.findById(req.user.id);

  const orderCourses = [];
  let totalPrice = 0;
  let discountedPriceTotal = 0;

  // Process each course ID in the array
  for (const id of courseId) {
    const course = await Course.findById(id);
    if (!course) return next(new ErrorHandler(`Course with ID ${id} not found`, 404));

    // Check if the user has already purchased this course
    if (user.purchasedCourses.includes(id)) {
      return next(new ErrorHandler(`You have already purchased course with ID ${id}`, 400));
    }

    orderCourses.push(course._id);
    discountedPriceTotal += course.discountedPrice;
  }

  // Find the referrer (the user who referred the current user)
  const referrer = await User.findById(req.user.referredBy);
  if (!referrer) return next(new ErrorHandler("You cannot proceed", 404));

  // Get the referral code used by the current user
  const referralCodeUsed = referrer.refralCode;

  // Calculate GST (18% on total discounted price)
  const gstAmount = (discountedPriceTotal * 18) / 100;
  totalPrice = discountedPriceTotal + gstAmount;

  // Commission calculation (50% of the total discounted price)
  const commission = (discountedPriceTotal * 50) / 100;

  // TDS calculation (5% of commission)
  const tds = (commission * 5) / 100;

  // Amount credited to referrer (after TDS deduction)
  const amountCredited = commission - tds;

  // Create the order with all course IDs
  const order = await Order.create({
    user: req.user.id,
    course: orderCourses,
    referralCodeUsed,
    totalPrice,
    discountedPrice: discountedPriceTotal,
    gst: 18, // You can make this dynamic if necessary
    commission,
    tds,
    amountCredited, // Referrer's net amount after TDS
  });

  // Update the user (purchaser) details after course purchase
  user.purchasedCourses.push(...orderCourses);
  await user.save();

  // Update the referrer's earnings after commission and TDS deduction
  referrer.earnings.total += amountCredited; // Update total earnings
  await referrer.save();

  // Log the earnings into the Earnings table (for the referrer)
  await Earnings.create({
    user: referrer._id,
    order: order._id,
    totalPrice,
    discountedPrice: discountedPriceTotal,
    gst: 18,
    commission,
    tds,
    amountCredited,
  });

  // Increment totalEnrolled for each course
  for (const id of orderCourses) {
    const course = await Course.findById(id);
    course.totalEnrolled += 1;
    await course.save();
  }

  // Send response with order details
  res.status(200).json({
    success: true,
    message: "Courses Purchased! You can start learning.",
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