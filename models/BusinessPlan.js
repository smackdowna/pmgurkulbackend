import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter title"],
    },
    description: {
      type: String,
      required: [true, "Please enter a short overview of business plan"],
    },
    fileUrl: {
      type: String,
      required: [true, "Please enter file url"],
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessPlan = mongoose.model("BusinessPlan", schema);
