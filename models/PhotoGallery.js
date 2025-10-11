import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the reviewer's name"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const PhotoGallery = mongoose.model("PhotoGallery", schema);
