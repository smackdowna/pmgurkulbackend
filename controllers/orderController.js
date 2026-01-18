import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Order } from "../models/OrderModel.js";
import { Course } from "../models/Course.js";
import { User } from "../models/userModel.js";
import { Earnings } from "../models/Earning.js";
import sendEmail from "../utils/sendEmail.js";
import { Counter } from "../models/CounterModel.js";

//create order
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { courseId, totalPrice:totalPaidAmount, orderType } = req.body;

  // Generate a new paymentId
  let paymentId = "001"; // default for first order
  const counter = await Counter.findOneAndUpdate(
    { name: "payment" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  // Pad the counter value with leading zeros (3 digits)
  if (counter?.value) {
    paymentId = counter.value.toString().padStart(3, "0"); // This ensures "001", "002", etc.
  }

  // Check if courseId is provided and is an array
  if (!courseId || !Array.isArray(courseId) || courseId.length === 0) {
    return next(new ErrorHandler("Enter valid Course IDs", 400));
  }

  const user = await User.findById(req.user.id);

  const orderCourses = [];
  let totalPrice = 0;

  // Process each course ID in the array
  for (const id of courseId) {
    const course = await Course.findById(id);
    if (!course)
      return next(new ErrorHandler(`Course with ID ${id} not found`, 404));

    orderCourses.push(course._id);
  }

  // Find the referrer (the user who referred the current user)
  const referrer = await User.findById(req.user.referredBy);
  if (!referrer) return next(new ErrorHandler("You cannot proceed", 404));

  // Get the referral code used by the current user
  const referralCodeUsed = referrer.refralCode;

  // Calculate GST (18% on total discounted price)
  const gstAmount = (totalPaidAmount * 18) / 100;
  totalPrice = totalPaidAmount + gstAmount;

  let totalCommission = 0;
  let totalTDS = 0;

  // Calculate commission per course
  for (const id of courseId) {
    const course = await Course.findById(id);
    const bonusPercentage = course.referBonus || 0; // default 0 if not set

    const courseCommission = (course.discountedPrice * bonusPercentage) / 100;
    const courseTDS = (courseCommission * 5) / 100; // 5% TDS
    totalCommission += courseCommission;
    totalTDS += courseTDS;
  }

  const amountCredited = totalCommission - totalTDS;

  const orderId = Math.floor(10000 + Math.random() * 90000);

  // Create the order
  const order = await Order.create({
    orderId,
    user: req.user.id,
    course: orderCourses,
    referralCodeUsed,
    totalPrice,
    discountedPrice: totalPaidAmount,
    gst: 18,
    commission: totalCommission,
    tds: totalTDS,
    amountCredited,
    paymentId,
    orderType
  });

  // ✅ Update the user’s purchasedCourses with the new structure
  const newlyPurchased = orderCourses.map((id) => ({
    courseId: id,
    isAttendedOnExam: false,
  }));

  user.purchasedCourses.push(...newlyPurchased);
  await user.save();

  // Update the referrer's earnings after commission and TDS deduction
  referrer.earnings.total += amountCredited; // Update total earnings
  await referrer.save();

  // Log the earnings into the Earnings table (for the referrer)
  await Earnings.create({
    user: referrer._id,
    order: order._id,
    totalPrice,
    discountedPrice: totalPaidAmount,
    gst: 18,
    commission: totalCommission,
    tds: totalTDS,
    amountCredited,
    paymentId,
  });

  // Increment totalEnrolled for each course
  for (const id of orderCourses) {
    const course = await Course.findById(id);
    course.totalEnrolled += 1;
    await course.save();
  }

  const courseTitles = orderCourses.map(async (id) => {
    const course = await Course.findById(id);
    return course.title;
  });

  const resolvedCourseTitles = await Promise.all(courseTitles);
  const courseTitleString = resolvedCourseTitles.join(", ");

  const emailMessage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: #051539;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            color: #051539;
            font-size: 20px;
            margin-bottom: 25px;
            font-weight: 600;
        }
        .invoice-box {
            background: #f8f9ff;
            border-left: 4px solid #0073DF;
            padding: 25px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .invoice-title {
            color: #051539;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        .invoice-title:before {
            content: "📋";
            margin-right: 10px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding-bottom: 12px;
            border-bottom: 1px dashed #e0e0e0;
        }
        .detail-label {
            color: #666;
            font-weight: 500;
        }
        .detail-value {
            color: #051539;
            font-weight: 600;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding: 20px;
            background: #051539;
            color: white;
            border-radius: 8px;
            font-size: 20px;
            font-weight: 600;
        }
        .note {
            background: #e8f4ff;
            border: 1px solid #0073DF;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
            text-align: center;
            color: #051539;
        }
        .note-icon {
            color: #0073DF;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #051539, #0073DF);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(5, 21, 57, 0.2);
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(5, 21, 57, 0.3);
        }
        .wishes {
            text-align: center;
            color: #051539;
            font-size: 18px;
            margin: 30px 0;
            padding: 20px;
            border-top: 2px solid #f0f0f0;
        }
        .wishes h3 {
            color: #0073DF;
            margin-bottom: 15px;
        }
        .footer {
            background: #051539;
            color: white;
            text-align: center;
            padding: 25px;
            font-size: 14px;
            opacity: 0.9;
        }
        .highlight {
            color: #0073DF;
            font-weight: 600;
        }
        .payment-id {
            background: #0073DF;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Enrollment Successful!</h1>
            <p>PMGURUKKUL - Your Learning Journey Begins</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear ${user.full_name},
            </div>
            
            <p>Thank you for choosing PMGURUKKUL! We're thrilled to welcome you to our learning community. Your enrollment has been successfully processed and you can now access your course materials immediately.</p>
            
            <div class="invoice-box">
                <div class="invoice-title">
                    Order Invoice
                    <span class="payment-id">Payment ID: ${paymentId}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Courses Purchased:</span>
                    <span class="detail-value">${courseTitleString}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Subtotal:</span>
                    <span class="detail-value">₹${totalPaidAmount.toFixed(
                      2
                    )}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">GST (18%):</span>
                    <span class="detail-value">₹${gstAmount.toFixed(2)}</span>
                </div>
                
                <div class="total-row">
                    <span>Total Amount Paid:</span>
                    <span>₹${totalPrice.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="note">
                <div class="note-icon">💡</div>
                <p><strong>Important Note:</strong> You can download your invoice anytime from your dashboard. All your invoices are securely stored for future reference.</p>
            </div>
            
            <div class="wishes">
                <h3>🎯 Start Your Learning Journey</h3>
                <p>Your courses are now available in your dashboard. We recommend starting as soon as possible to make the most of your learning experience.</p>
                <p>If you need any assistance, our support team is just a message away!</p>
            </div>
            
            <p style="color: #051539; font-weight: 600;">Access your courses here: <span class="highlight">Dashboard → My Courses</span></p>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Order Date: ${new Date().toLocaleDateString(
              "en-IN",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}</p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">Happy Learning! 🌟</p>
            <p style="margin: 10px 0 0 0; font-weight: 600;">Best Regards,<br>The PMGURUKKUL Team</p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">"Empowering Learners, Building Futures"</p>
        </div>
    </div>
</body>
</html>
`;

  await sendEmail(
    user.email,
    `Course Purchase Confirmation ${courseTitleString}`,
    `You have successfully purchased the course.`,
    emailMessage
  );

  // Send response with order details
  res.status(200).json({
    success: true,
    message: "Courses Purchased! You can start learning.",
    order,
  });
});

//get my order
export const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({
      createdAt: -1,
    })
    .populate("user", "full_name mobileNumber") // Populate user with specific fields
    .populate("course", "title description");
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
    .populate("user", "full_name mobileNumber") // Populate user with specific fields
    .populate("course", "title description"); // Populate course with specific fields

  res.status(200).json({
    success: true,
    ordersCount,
    orders,
  });
});

//get single order
export const getSingleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Cancel order by ID
export const cancelOrder = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  let order;

  if (user.role === "admin") {
    // Admin can cancel any order
    order = await Order.findById(id);
  } else {
    // Normal user can cancel only their own order
    order = await Order.findOne({ _id: id, userId: user._id });
  }

  if (!order) {
    return next(new ErrorHandler("Order not found or not authorized", 404));
  }

  order.status = "cancelled";
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});
