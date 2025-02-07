import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { type } from "os";

const schema = new mongoose.Schema({
  full_name: {
    type: String,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  gender: {
    type: String,
  },
  language: {
    type: String,
  },
  dob: {
    type: Date,
  },
  mobileNumber: {
    type: String,
    required: [true, "Please Enter your mobileNumber"],
    maxLength: [10, "Number cannot exceed 10 Number"],
  },
  occupation: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  addline1:{
    type: String,
  },
  addline2:{
    type: String,
  },
  panCard: {
    panNumber: {
      type: String,
    },
    panImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  document: {
    doctype:{
      type: String,
    },
    documentNumber: {
      type: String,
    },
    docImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  bankInfo: [
    {
      accholderName: {
        type: String,
      },
      accNumber: {
        type: String,
      },
      accType: {
        type: String,
      },
      ifscCode: {
        type: String,
      },
      bankName: {
        type: String,
      },
      bankBranch: {
        type: String,
      },
      nominName: {
        type: String,
      },
      nomiRelation: {
        type: String,
      },
    },
  ],
  passbookImage:{
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  refralCode: {
    type: String,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  earnings: {
    total: {
      type: Number,
      default: 0,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  kyc_status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Approved","Rejected"],
  },
  otp: {
    type: String,
  },
  otp_expiry: {
    type: Date,
  },
  purchasedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

schema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", schema);
