import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import { config } from "dotenv";

config({
  path: "./config/config.env",
});

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

//check out
export const checkout = catchAsyncError(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount) return next(new ErrorHandler("Please enter  amount", 400));

  const options = {
    amount: Number(amount * 100),
    currency: "INR",
  };
  try {
    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Razorpay error:", err);
    return next(new ErrorHandler("Payment order creation failed", 500));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

//payment verification
export const paymentVerification = async (req, res) => {
  const { razorpay_payment_id } = req.body;
  // const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
  //   req.body;

  // const body = razorpay_order_id + "|" + razorpay_payment_id;

  // const expectedSignature = crypto
  //   .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
  //   .update(body.toString())
  //   .digest("hex");

  // const isAuthentic = expectedSignature === razorpay_signature;

  if (razorpay_payment_id) {
    // Database comes here

    // await Payment.create({
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    // });

    res.redirect(
      `${process.env.FRONTEND_URL}/payment-successful/${razorpay_payment_id}`
    );
  } else {
    res.status(400).json({
      success: false,
    });
  }
};
