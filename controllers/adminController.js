import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Course } from "../models/Course.js";
import { User } from "../models/userModel.js";
import { Order } from "./../models/OrderModel.js";

export const getAdminStats = catchAsyncError(async (req, res, next) => {
  // Calculate the last 5 days ago
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const [
    totalUsers,
    pendingKyc,
    totalAffiliates,
    totalCourses,
    totalOrders,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ kyc_status: "Pending" }),
    User.countDocuments({ purchasedCourses: { $exists: true, $ne: [] } }),
    Course.countDocuments(),
    Order.countDocuments(),
    User.find({ createdAt: { $gte: fiveDaysAgo } })
      .sort({ createdAt: -1 }) // latest first
      .select("full_name email mobileNumber createdAt") // pick fields you want to send
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      pendingKyc,
      totalAffiliates,
      totalCourses,
      totalOrders,
    },
    recentUsers,
  });
});

export const assignPagesToUser = catchAsyncError(
  async (req, res, next) => {
    const { userId, pages } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.assignedPages = pages;

    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: "Pages assigned successfully",
      user,
    });
  }
);

export const makeUserEmployee = catchAsyncError(
  async (req, res, next) => {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.role = "employee";

    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: "User has been promoted to employee",
      user,
    });
  }
);