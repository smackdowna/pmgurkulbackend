import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  gst: {
    type: Number,
    default: 18, // GST percentage
  },
  totalPrice:{
    type: Number,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
  },
  tds: {
    type: Number,
    required: true,
  },
  amountCredited: {
    type: Number,
    required: true,
  },
  razorpay_payment_id: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Order = mongoose.model("Order", schema);
