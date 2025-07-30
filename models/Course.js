import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const forumMessageSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema]
});



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
  courseOverview: {
    type: String,
    required: [true, "Please enter course title"],
  },
  courseObjective: {
    type: String,
    required: [true, "Please enter course title"],
  },
  author: {
    type: String,
    required: [true, "Please enter course author"],
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
      videoDuration: {
        type: String,
        required: true,
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
  totalEnrolled: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: String,
    required: true,
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
  forum: [forumMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export const Course = mongoose.model("Course", schema);
