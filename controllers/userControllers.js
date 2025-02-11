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
    addline1, // New field
    addline2, // New field
  } = req.body;

  if (!mobileNumber)
    return next(new ErrorHandler("Mobile number is required", 400));

  let existingUser = await User.findOne({ mobileNumber, verified: true });
  if (existingUser) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  let unverifiedUser = await User.findOne({ mobileNumber, verified: false });
  // if (!refralCode)
  //   return next(
  //     new ErrorHandler("Refral Code is required for registration", 400)
  //   );

  if (unverifiedUser) {
    if (!unverifiedUser.refralCode) {
      unverifiedUser.refralCode = `PM${Math.floor(1000 + Math.random() * 9000)}`;
    }

    unverifiedUser.full_name = full_name || unverifiedUser.full_name;
    unverifiedUser.email = email || unverifiedUser.email;
    unverifiedUser.gender = gender || unverifiedUser.gender;
    unverifiedUser.language = language || unverifiedUser.language;
    unverifiedUser.dob = dob || unverifiedUser.dob;
    unverifiedUser.occupation = occupation || unverifiedUser.occupation;
    unverifiedUser.country = country || unverifiedUser.country;
    unverifiedUser.state = state || unverifiedUser.state;
    unverifiedUser.city = city || unverifiedUser.city;
    unverifiedUser.pinCode = pinCode || unverifiedUser.pinCode;
    unverifiedUser.verified = true;
    unverifiedUser.addline1 = addline1 || unverifiedUser.addline1;
    unverifiedUser.addline2 = addline2 || unverifiedUser.addline2;

    if (refralCode) {
      const referredUser = await User.findOne({ refralCode });
      if (!referredUser)
        return next(new ErrorHandler("Invalid referral code", 400));
      unverifiedUser.referredBy = referredUser._id;
    }

    await unverifiedUser.save();
    return sendToken(
      res,
      unverifiedUser,
      "User details updated successfully",
      200
    );
  }

  let referredBy = null;
  if (refralCode) {
    const referredUser = await User.findOne({ refralCode });
    if (!referredUser)
      return next(new ErrorHandler("Invalid referral code", 400));
    referredBy = referredUser._id;
  } else {
    const firstUserCheck = await User.countDocuments();
    // if (firstUserCheck > 0)
    //   return next(
    //     new ErrorHandler("Referral code is required for registration", 400)
    //   );
  }

  const newReferralCode = `PM${Math.floor(1000 + Math.random() * 9000)}`;

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
    addline1,
    addline2,
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
    doctype, // Document type
    documentNumber, // Document number
    addLine1, // Additional address line 1
    addLine2, // Additional address line 2
  } = req.body;

  // Uploaded files
  const { panImageFile, docImageFile, passbookImageFile } = req.files || {};

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
  if (addLine1) user.addLine1 = addLine1;
  if (addLine2) user.addLine2 = addLine2;

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

  // Update document details if provided
  if (doctype) user.document.doctype = doctype;
  if (documentNumber) user.document.documentNumber = documentNumber;
  if (docImageFile && docImageFile[0]) {
    // Delete the old document image from ImageKit
    if (user.document.docImage?.public_id) {
      await imagekit.deleteFile(user.document.docImage.public_id);
    }

    // Upload the new document image
    const docUploadResponse = await imagekit.upload({
      file: docImageFile[0].buffer,
      fileName: `document_${Date.now()}.jpg`,
    });

    user.document.docImage = {
      public_id: docUploadResponse.fileId,
      url: docUploadResponse.url,
    };
  }

  // Update passbook image if provided
  if (passbookImageFile && passbookImageFile[0]) {
    // Delete the old passbook image from ImageKit
    if (user.passbookImage?.public_id) {
      await imagekit.deleteFile(user.passbookImage.public_id);
    }

    // Upload the new passbook image
    const passbookUploadResponse = await imagekit.upload({
      file: passbookImageFile[0].buffer,
      fileName: `passbook_${Date.now()}.jpg`,
    });

    user.passbookImage = {
      public_id: passbookUploadResponse.fileId,
      url: passbookUploadResponse.url,
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


//Reject KYC
export const rejectKYCStatus = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found with this ID", 404));
  }

  // Update the KYC status to "Approved"
  user.kyc_status = "Rejected";
  await user.save();

  res.status(200).json({
    success: true,
    message: "KYC status updated to Reject",
    user,
  });
});


//get all purchased courses
export const getUserPurchasedCourses = catchAsyncError(
  async (req, res, next) => {
    // Find the user by ID
    const user = await User.findById(req.user.id).populate(
      "purchasedCourses",
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
