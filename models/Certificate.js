import mongoose, { Schema } from "mongoose";

const certificateSchema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    certificateId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Certificate = mongoose.model("Certificate", certificateSchema);
