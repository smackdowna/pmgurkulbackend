import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Earnings } from "../models/Earning.js";

//pending earning
export const allEarningsPending = catchAsyncError(async (req, res, next) => {
  const earningCount = await Earnings.countDocuments({
    payout_status: "Pending",
  });
  const earnings = await Earnings.find({ payout_status: "Pending" }).populate(
    "user", "full_name mobileNumber"
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
  const earnings = await Earnings.find().populate("user", "full_name mobileNumber");;

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
