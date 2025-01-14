import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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
    payout_status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved"],
    },
  },
  { timestamps: true }
);

export const Earnings = mongoose.model("Earnings", earningsSchema);
