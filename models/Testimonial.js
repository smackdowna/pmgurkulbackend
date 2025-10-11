import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter the reviewer's name"],
  },
  designation: {
    type: String,
    required: [true, "Please enter the reviewer's designation"],
  },
  testimonialType: {
  type: String,
  required: [true, "Please select a testimonial type"],
  enum: {
    values: ["Video", "Text"],
    message: "Testimonial type must be either 'Video' or 'Text'",
  },
},

  review: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    required: [true, "Please provide a rating"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot be more than 5"],
  },
  poster: {
    public_id: {
      type: String,
      required: false,
      default: "",
    },
    url: {
      type: String,
      required: false,
      default: "",
    },
  },
  video: {
    public_id: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Testimonial = mongoose.model("Testimonial", schema);
