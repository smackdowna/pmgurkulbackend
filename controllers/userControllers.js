import { User } from "../models/userModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/sendToken.js";
import imagekit from "../config/imagekit.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";

//generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

//send OTP
export const sendOTP = catchAsyncError(async (req, res, next) => {
  const { mobileNumber, email } = req.body;

  if (!mobileNumber || !email)
    return next(new ErrorHandler("Please enter all fields", 400));

  const hardcodedOtpEnabled = process.env.HARDCODED_OTP === "true";
  const otp = hardcodedOtpEnabled ? "000000" : generateOTP();

  let user = await User.findOne({ mobileNumber });

  if (!user) {
    user = await User.create({
      mobileNumber,
      email,
      otp: otp,
      otp_expiry: Date.now() + 60 * 1000,
    });
  } else {
    user.otp = otp;
    user.otp_expiry = Date.now() + 60 * 1000;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `OTP ${
      hardcodedOtpEnabled ? "hardcoded" : "random"
    } sent successfully to registered mobile number`,
  });
});

//verifyOTP
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp)
    return next(new ErrorHandler("Please Enter mobile number and OTP"));

  const user = await User.findOne({ mobileNumber });

  if (!user) return next(new ErrorHandler("User not found", 400));

  if (user.otp !== otp || user.otp_expiry < Date.now())
    return next(new ErrorHandler("Invalid OTP or OTP Expired", 400));

  user.otp = null;
  user.otp_expiry = null;
  await user.save();

  if (!user.full_name) {
    // New user, redirect to registration step
    return res.status(200).json({
      message: "OTP verified, proceed to registration",
      newUser: true,
    });
  }

  sendToken(res, user, `Welcome Back ${user.full_name}`, 200);
});

//registration
export const registerUser = catchAsyncError(async (req, res, next) => {
  const {
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
    refralCode,
    bankInfo, // Array of objects
    panNumber, // PAN card number
    adNumber, // Aadhaar card number
  } = req.body;

  // Uploaded files
  const { panImageFile, adImageFile } = req.files;

  if (!mobileNumber)
    return next(new ErrorHandler("Mobile number is required", 400));

  if (!panImageFile || !adImageFile)
    return next(
      new ErrorHandler("Enter adhar card image or pan card image", 400)
    );

  // Check if the user already exists with the same mobile number and is verified
  let existingUser = await User.findOne({ mobileNumber, verified: true });

  if (existingUser) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  // Check if the user exists but is not verified
  let unverifiedUser = await User.findOne({ mobileNumber, verified: false });

  if (!refralCode)
    return next(
      new ErrorHandler("Refral Code is required for registration", 400)
    );

  // If an unverified user exists, update the user's details
  if (unverifiedUser) {
    // Generate a new referral code if not already assigned (for unverified users)
    if (!unverifiedUser.refralCode) {
      unverifiedUser.refralCode = `PM${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;
    }

    // Update the unverified user's details
    unverifiedUser.full_name = full_name || unverifiedUser.full_name;
    unverifiedUser.gender = gender || unverifiedUser.gender;
    unverifiedUser.language = language || unverifiedUser.language;
    unverifiedUser.dob = dob || unverifiedUser.dob;
    unverifiedUser.occupation = occupation || unverifiedUser.occupation;
    unverifiedUser.country = country || unverifiedUser.country;
    unverifiedUser.state = state || unverifiedUser.state;
    unverifiedUser.city = city || unverifiedUser.city;
    unverifiedUser.pinCode = pinCode || unverifiedUser.pinCode;
    unverifiedUser.verified = "true";

    // Handle referral code, similar to the previous logic
    if (refralCode) {
      const referredUser = await User.findOne({ refralCode });
      if (!referredUser)
        return next(new ErrorHandler("Invalid referral code", 400));

      unverifiedUser.referredBy = referredUser._id; // Update the referring user
    }

    // Upload PAN card image to ImageKit
    let panImage = null;
    if (panImageFile && panImageFile[0]) {
      const panUploadResponse = await imagekit.upload({
        file: panImageFile[0].buffer, // Buffer data
        fileName: `pan_${Date.now()}.jpg`, // Unique filename
      });
      panImage = {
        public_id: panUploadResponse.fileId,
        url: panUploadResponse.url,
      };
    }

    // Upload Aadhaar card image to ImageKit
    let adImage = null;
    if (adImageFile && adImageFile[0]) {
      const adUploadResponse = await imagekit.upload({
        file: adImageFile[0].buffer, // Buffer data
        fileName: `aadhaar_${Date.now()}.jpg`, // Unique filename
      });
      adImage = {
        public_id: adUploadResponse.fileId,
        url: adUploadResponse.url,
      };
    }

    // Ensure bank info is parsed correctly (if it is a string)
    let parsedBankInfo = Array.isArray(bankInfo)
      ? bankInfo
      : JSON.parse(bankInfo);
    // Update the user's bank information
    unverifiedUser.bankInfo = parsedBankInfo;

    unverifiedUser.panCard = {
      panNumber,
      panImage,
    };
    unverifiedUser.addharCard = {
      adNumber,
      adImage,
    };

    // Save the updated user
    await unverifiedUser.save();

    return sendToken(
      res,
      unverifiedUser,
      "User details updated successfully",
      200
    );
  }

  // If no unverified user exists, proceed to create a new user

  let referredBy = null;

  // Validate referral code
  if (refralCode) {
    const referredUser = await User.findOne({ refralCode });
    if (!referredUser)
      return next(new ErrorHandler("Invalid referral code", 400));

    referredBy = referredUser._id; // Store the ID of the user who referred
  } else {
    // Check if this is the first user
    const firstUserCheck = await User.countDocuments();
    if (firstUserCheck > 0)
      return next(
        new ErrorHandler("Referral code is required for registration", 400)
      );
  }

  // Generate a new referral code for new users
  const newReferralCode = `PM${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  let panImage = null;
  let adImage = null;
  // Upload PAN card image to ImageKit
  if (panImageFile && panImageFile[0]) {
    const panUploadResponse = await imagekit.upload({
      file: panImageFile[0].buffer, // Buffer data
      fileName: `pan_${Date.now()}.jpg`, // Unique filename
    });
    panImage = {
      public_id: panUploadResponse.fileId,
      url: panUploadResponse.url,
    };
  }

  if (adImageFile && adImageFile[0]) {
    const adUploadResponse = await imagekit.upload({
      file: adImageFile[0].buffer, // Buffer data
      fileName: `aadhaar_${Date.now()}.jpg`, // Unique filename
    });
    adImage = {
      public_id: adUploadResponse.fileId,
      url: adUploadResponse.url,
    };
  }

  const parsedBankInfo = Array.isArray(bankInfo)
    ? bankInfo
    : JSON.parse(bankInfo);

  // Create a new user
  const user = await User.create({
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
    refralCode: newReferralCode,
    referredBy,
    bankInfo: parsedBankInfo, // Convert the bankInfo array from JSON string
    panCard: {
      panNumber,
      panImage,
    },
    addharCard: {
      adNumber,
      adImage,
    },
  });

  sendToken(res, user, "Registered Successfully", 200);
});

//get my profile
export const getmyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//logout
export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
    httpOnly: true,
    secure: "true", // Set to true in production, false in development
    sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//update user details
export const updateUserDetails = catchAsyncError(async (req, res, next) => {
  const {
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
    bankInfo, // Array of objects
    panNumber, // PAN card number
    adNumber, // Aadhaar card number
  } = req.body;

  // Uploaded files
  const { panImageFile, adImageFile } = req.files || {};

  // Ensure the user is logged in
  const userId = req.user.id;

  // Fetch the user from the database
  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update basic details if provided
  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (gender) user.gender = gender;
  if (language) user.language = language;
  if (dob) user.dob = dob;
  if (mobileNumber) user.mobileNumber = mobileNumber;
  if (occupation) user.occupation = occupation;
  if (country) user.country = country;
  if (state) user.state = state;
  if (city) user.city = city;
  if (pinCode) user.pinCode = pinCode;

  // Update bank information if provided
  if (bankInfo) {
    const parsedBankInfo = Array.isArray(bankInfo)
      ? bankInfo
      : JSON.parse(bankInfo);
    user.bankInfo = parsedBankInfo; // Replace with the provided data
  }

  // Update PAN card details if provided
  if (panNumber) user.panCard.panNumber = panNumber;
  if (panImageFile && panImageFile[0]) {
    // Delete the old PAN image from ImageKit
    if (user.panCard.panImage?.public_id) {
      await imagekit.deleteFile(user.panCard.panImage.public_id);
    }

    // Upload the new PAN image
    const panUploadResponse = await imagekit.upload({
      file: panImageFile[0].buffer,
      fileName: `pan_${Date.now()}.jpg`,
    });

    user.panCard.panImage = {
      public_id: panUploadResponse.fileId,
      url: panUploadResponse.url,
    };
  }

  // Update Aadhaar card details if provided
  if (adNumber) user.addharCard.adNumber = adNumber;
  if (adImageFile && adImageFile[0]) {
    // Delete the old Aadhaar image from ImageKit
    if (user.addharCard.adImage?.public_id) {
      await imagekit.deleteFile(user.addharCard.adImage.public_id);
    }

    // Upload the new Aadhaar image
    const adUploadResponse = await imagekit.upload({
      file: adImageFile[0].buffer,
      fileName: `aadhaar_${Date.now()}.jpg`,
    });

    user.addharCard.adImage = {
      public_id: adUploadResponse.fileId,
      url: adUploadResponse.url,
    };
  }

  // Save the updated user
  await user.save();

  // Respond with success
  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    user,
  });
});

//add to playlist
export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });

  if (itemExist) return next(new ErrorHandler("Course ALready Added", 409));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Added to playlist",
  });
});

//remove from playlist
export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Removed From playlist",
  });
});

//get all registered user
export const getAllUser = catchAsyncError(async (req, res, next) => {
  const usersCount = await User.countDocuments();

  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    usersCount,
    users,
  });
});

//get single user
export const getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("user not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//get user whose kyc status is pending
export const getUsersWithPendingKYC = catchAsyncError(
  async (req, res, next) => {
    const usersCount = await User.countDocuments({ kyc_status: "Pending" });
    const users = await User.find({ kyc_status: "Pending" });

    if (!users || users.length === 0) {
      return next(new ErrorHandler("No users with pending KYC found", 404));
    }

    res.status(200).json({
      success: true,
      usersCount,
      users,
    });
  }
);

//approve KYC
export const approveKYCStatus = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found with this ID", 404));
  }

  // Update the KYC status to "Approved"
  user.kyc_status = "Approved";
  await user.save();

  res.status(200).json({
    success: true,
    message: "KYC status updated to Approved",
    user,
  });
});

//get all purchased courses
export const getUserPurchasedCourses = catchAsyncError(
  async (req, res, next) => {
    // Find the user by ID
    const user = await User.findById(req.user.id).populate(
      "Course",
      "title description poster numOfVideos category"
    );

    // If the user is not found
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Return the purchased courses
    res.status(200).json({
      success: true,
      purchasedCourses: user.purchasedCourses,
    });
  }
);
