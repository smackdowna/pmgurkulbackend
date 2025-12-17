import mongoose from "mongoose";

const courseBundleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Please enter bundle description"],
    },
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    ],
    price: {
      type: Number,
      required: [true, "Please enter bundle price"],
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const CourseBundle = mongoose.model("CourseBundle", courseBundleSchema);
