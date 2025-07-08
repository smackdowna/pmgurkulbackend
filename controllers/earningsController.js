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

    // Uncomment if needed:
    // if (currentDay !== 2) {
    //   return res.status(403).json({ message: "Only available on Tuesdays." });
    // }

    // Optional time filter:
    // const { start, end } = getLastTuesdayToNowRange();

    const earnings = await Earnings.aggregate([
      {
        $match: {
          // createdAt: { $lte: end }, // add time filter if needed
          payout_status: { $ne: "Approved" },
        },
      },
      {
        $group: {
          _id: "$user", // group by user
          totalAmountCredited: { $sum: "$amountCredited" },
          totalOrders: { $sum: 1 },
          payoutStatuses: { $addToSet: "$payout_status" },
          entries: {
            $push: {
              earningId: "$_id", // 👈 Push earningId
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
          localField: "_id", // _id is userId
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: { $arrayElemAt: ["$entries.earningId", 0] }, // 👈 set _id as first earningId
          userId: "$_id",
          name: "$userInfo.full_name",
          email: "$userInfo.email",
          mobileNumber: "$userInfo.mobileNumber",
          totalAmountCredited: 1,
          totalOrders: 1,
          entries: 1,
          status: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $size: "$payoutStatuses" }, 1] },
                  {
                    $eq: [{ $arrayElemAt: ["$payoutStatuses", 0] }, "Approved"],
                  },
                ],
              },
              "Approved",
              "Pending",
            ],
          },
        },
      },
    ]);

    res.status(200).json({ data: earnings });
  } catch (error) {
    console.log("Error in getWeeklyEarnings:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};


export const approvePayoutByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const pendingEarnings = await Earnings.find({ user: userId, payout_status: { $ne: "Approved" } });
console.log("Pending earnings count:", pendingEarnings);


    const result = await Earnings.updateMany(
      { user: userId, payout_status: { $ne: "Approved" } },
      { $set: { payout_status: "Approved" } }
    );

    console.log(result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No earnings found to approve for this user" });
    }

    res.status(200).json({
      message: `Payout approved for user: ${userId}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in approvePayoutByUserId:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

