import mongoose from "mongoose";

const bundleCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter bundle title"],
    minLength: [4, "Title should be at least 4 characters"],
    maxLength: [80, "Title should not be greater than 80 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter bundle description"],
  },
  poster: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  ],
  basePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  discountedPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  referBonus: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const BundleCourse = mongoose.model("BundleCourse", bundleCourseSchema);