import { User } from "../models/userModel.js";
import { Order } from "../models/OrderModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import moment from "moment";

//refral summary
export const getReferralSummary = catchAsyncError(async (req, res, next) => {
  const userId = req.user.id;

  // Fetch the current user
  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const referralCode = user.refralCode; // Get the user's referral code
  const userCreatedAt = moment(user.createdAt);

  // 1. Get all users referred by this user
  const referredUsers = await User.find({ referredBy: userId });

  // 2. Fetch orders placed by referred users
  const referredUserIds = referredUsers.map((u) => u._id);
  const orders = await Order.find({ user: { $in: referredUserIds } }).populate(
    "course",
    "title"
  );

  // 3. Calculate total earnings, daily, weekly, and monthly earnings
  let totalEarnings = 0;
  let dailyEarnings = 0;
  let weeklyEarnings = 0;
  let monthlyEarnings = 0;

  orders.forEach((order) => {
    const orderCreatedAt = moment(order.createdAt);
    const amountCredited = order.amountCredited;

    totalEarnings += amountCredited;

    if (orderCreatedAt.isSame(moment(), "day")) dailyEarnings += amountCredited;
    if (orderCreatedAt.isSame(moment(), "week"))
      weeklyEarnings += amountCredited;
    if (orderCreatedAt.isSame(moment(), "month"))
      monthlyEarnings += amountCredited;
  });

  // 4. Calculate duration on the platform
  const durationOnPlatform = moment().diff(userCreatedAt, "days");

  // Response
  res.status(200).json({
    success: true,
    data: {
      referredUsers: referredUsers.map((referredUser) => ({
        id: referredUser._id,
        name: referredUser.full_name,
        email: referredUser.email,
        mobileNumber: referredUser.mobileNumber,
        purchasedCourses: orders
          .filter(
            (order) => order.user.toString() === referredUser._id.toString()
          )
          .flatMap((order) =>
            order.course.map((course) => ({
              courseId: course._id,
              courseTitle: course.title,
              amountCredited: order.amountCredited,
              dateOfPurchase: moment(order.createdAt).format(
                "YYYY-MM-DD HH:mm:ss"
              ),
            }))
          ),
      })),
      totalEarnings,
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      durationOnPlatform: `${durationOnPlatform} days`,
      totalReferredUsers: referredUsers.length,
    },
  });
});

export const getReferralLeaderboard = catchAsyncError(
  async (req, res, next) => {
    // 1. Get all users
    const allUsers = await User.find(
      { role: { $ne: "admin" } },
      "full_name email mobileNumber refralCode createdAt referredBy role"
    );

    if (!allUsers || allUsers.length === 0) {
      return next(new ErrorHandler("No users found", 404));
    }

    // 2. Prepare a leaderboard array
    const leaderboardData = [];

    // 3. Loop through each user and calculate their total referral earnings
    for (const user of allUsers) {
      const referredUsers = await User.find({ referredBy: user._id });

      if (referredUsers.length === 0) {
        leaderboardData.push({
          userId: user._id,
          name: user.full_name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          totalEarnings: 0,
          totalReferredUsers: 0,
          durationOnPlatform:
            moment().diff(moment(user.createdAt), "days") + " days",
        });
        continue;
      }

      const referredUserIds = referredUsers.map((u) => u._id);
      const orders = await Order.find({ user: { $in: referredUserIds } });

      const totalEarnings = orders.reduce(
        (acc, order) => acc + (order.amountCredited || 0),
        0
      );

      leaderboardData.push({
        userId: user._id,
        name: user.full_name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        totalEarnings,
        totalReferredUsers: referredUsers.length,
        durationOnPlatform:
          moment().diff(moment(user.createdAt), "days") + " days",
      });
    }

    // 4. Sort by total earnings descending
    leaderboardData.sort((a, b) => b.totalEarnings - a.totalEarnings);

    // 5. Assign ranks
    leaderboardData.forEach((user, index) => {
      user.rank = index + 1;
    });

    // 6. Send response
    res.status(200).json({
      success: true,
      message: "Referral leaderboard fetched successfully",
      totalUsers: leaderboardData.length,
      leaderboard: leaderboardData,
    });
  }
);
