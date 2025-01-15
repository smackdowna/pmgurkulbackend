import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter course title"],
    minLength: [4, "Title should be at least 4 charachetr"],
    maxLength: [80, "Title should not be greater than 80 characheter"],
  },
  description: {
    type: String,
    required: [true, "Please enter course title"],
  },
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
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
  ],
  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: [true, "Please enter course basePrice"],
    default: 0,
  },
  discountedPrice: {
    type: Number,
    required: [true, "Please enter course discountedPrice"],
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export const Course = mongoose.model("Course", schema);
