import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Earnings } from "../models/Earning.js";
import { getLastTuesdayToNowRange } from "../utils/getLastTuesdayToNowRange.js";

//pending earning
export const allEarningsPending = catchAsyncError(async (req, res, next) => {
  const earningCount = await Earnings.countDocuments({
    payout_status: "Pending",
  });
  const earnings = await Earnings.find({ payout_status: "Pending" }).populate(
    "user",
    "full_name mobileNumber"
  );

  res.status(200).json({
    success: true,
    earningCount,
    earnings,
  });
});

//approved earning
export const allEarningsApproved = catchAsyncError(async (req, res, next) => {
  const earningCount = await Earnings.countDocuments({
    payout_status: "Approved",
  });
  const earnings = await Earnings.find({
    payout_status: "Approved",
  }).populate("user", "full_name mobileNumber");

  res.status(200).json({
    success: true,
    earningCount,
    earnings,
  });
});

//all earning
export const allEarnings = catchAsyncError(async (req, res, next) => {
  const earningCount = await Earnings.countDocuments();
  const earnings = await Earnings.find().populate(
    "user",
    "full_name mobileNumber"
  );

  res.status(200).json({
    success: true,
    earningCount,
    earnings,
  });
});

//approve payout
export const approvePayout = catchAsyncError(async (req, res, next) => {
  const earning = await Earnings.findById(req.params.id);

  if (!earning) {
    return next(new ErrorHandler("Earnings not found with this ID", 404));
  }

  // Update the KYC status to "Approved"
  earning.payout_status = "Approved";
  await earning.save();

  res.status(200).json({
    success: true,
    message: "Payout status updated to Approved",
  });
});

export const getWeeklyEarnings = async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday

    // if (currentDay !== 2) {
    //   return res.status(403).json({
    //     message: "Only available on Tuesdays.",
    //   });
    // }

    // const { start, end } = getLastTuesdayToNowRange();

    const earnings = await Earnings.aggregate([
      {
        $match: {
          // createdAt: { $lte: end },
          payout_status: { $ne: "Approved" },
        },
      },
      {
        $group: {
          _id: "$user",
          totalAmountCredited: { $sum: "$amountCredited" },
          totalOrders: { $sum: 1 },
          entries: {
            $push: {
              order: "$order",
              discountedPrice: "$discountedPrice",
              amountCredited: "$amountCredited",
              createdAt: "$createdAt",
              commission: "$commission",
              tds: "$tds",
              payout_status: "$payout_status",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          userId: "$_id",
          name: "$userInfo.full_name",
          email: "$userInfo.email",
          mobileNumber: "$userInfo.mobileNumber",
          totalAmountCredited: 1,
          totalOrders: 1,
          entries: 1,
        },
      },
    ]);

    res.status(200).json({ data: earnings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

export const approvePayoutByEarningId = async (req, res) => {
  try {
    const { earningId } = req.params;

    // Step 1: Find the earning document by ID
    const earning = await Earnings.findById(earningId);

    if (!earning) {
      return res.status(404).json({ message: "Earning not found" });
    }
    console.log(earning);

    const userId = earning.user;

    // Step 2: Update all earnings of that user where payout_status ≠ "Approved"
    const result = await Earnings.updateMany(
      { user: userId, payout_status: { $ne: "Approved" } },
      { $set: { payout_status: "Approved" } }
    );

    res.status(200).json({
      message: `Payout approved for user: ${userId}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in approvePayoutByEarningId:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
