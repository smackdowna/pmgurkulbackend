import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { type } from "os";

const schema = new mongoose.Schema({
  // userId: {
  //   type: String,
  // },
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
  password: {
    type: String,
    minlength: [8, "Password should be at least 8 characters long"],
    select: false,
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
  addline1: {
    type: String,
  },
  addline2: {
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
    doctype: {
      type: String,
    },
    documentNumber: {
      type: String,
    },
    docFrontImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    docBackImage: {
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
  passbookImage: {
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
    enum: ["Pending", "Approved", "Rejected"],
  },
  gstNumber: {
    type: String,
    default: "",
  },
  gstCompanyName: {
    type: String,
    default: "",
  },
  otp: {
    type: String,
  },
  otp_expiry: {
    type: Date,
  },
  purchasedCourses: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
      isAttendedOnExam: {
        type: Boolean,
        default: false,
      },
      isPassed: {
        type: Boolean,
        default: false,
      },
      examLimitLeft: {
        type: Number,
        default: 3,
      },
    },
  ],
  status: {
    type: String,
    required: false,
    enum: {
      values: ["suspended", "active"],
    },
  },
  suspensionReason : {
    type: String,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//hashing the password
schema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

//JWT TOKEN
schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

//compare password
schema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generating password Reset Token
schema.methods.getResetPasswordToken = function () {
  //Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hashing and adding resetPasswordToken to user schema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

schema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", schema);
