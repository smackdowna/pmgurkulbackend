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
    basePrice: {
      type: Number,
      required: [true, "Please enter bundle base price"],
    },
    discountedPrice: {
      type: Number,
      required: [true, "Please enter bundle base price"],
    },
    duration : {
      type: String,
      required: [true, "Please enter bundle duration"],
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
    referBonus: {
      type: Number,
      required: [true, "Please enter bundle refer bonus"],
    },
  },
  {
    timestamps: true,
  }
);

export const CourseBundle = mongoose.model("CourseBundle", courseBundleSchema);
