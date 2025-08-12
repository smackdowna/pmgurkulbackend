import { User } from "../models/userModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/sendToken.js";
import imagekit from "../config/imagekit.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import sendEmail from "../utils/sendEmail.js";
import axios from "axios";

async function deleteUsersWithExpiredOTP() {
  try {
    const tenMinutesAgo = Date.now() - 15 * 60 * 1000;
    await User.deleteMany({
      verified: false,
      createdAt: { $lte: new Date(tenMinutesAgo) },
    });

    console.log("Users with expired OTP deleted successfully.");
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 15 * 60 * 1000);

//generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

//send OTP
export const sendOTP = catchAsyncError(async (req, res, next) => {
  const { mobileNumber, email } = req.body;

  if (!mobileNumber || !email)
    return next(new ErrorHandler("Please enter all fields", 400));

  let user = await User.findOne({ email: email });

  if (user)
    return next(
      new ErrorHandler("User already registered with same email", 400)
    );

  user = await User.findOne({ mobileNumber });

  if (user)
    return next(
      new ErrorHandler("User already registered with same mobile number", 400)
    );

  const hardcodedOtpEnabled = process.env.HARDCODED_OTP === "true";
  const otp = hardcodedOtpEnabled ? "000000" : generateOTP();

  user = await User.findOne({ mobileNumber });

  if (!user) {
    user = await User.create({
      mobileNumber,
      email,
      otp: otp,
      otp_expiry: Date.now() + 2 * 60 * 1000,
    });
  }
  const emailMessage = `Dear User,

  Thank you for choosing PMGURUKKUL! 🏆
  
  We're thrilled to have you onboard. To ensure the security of your account and expedite your registration process, please verify your account by entering the following One-Time Password (OTP):
  
  OTP: ${otp}
  
  This OTP is exclusively for you and will expire after a limited time. We encourage you to verify your account promptly to secure your spot at the event.
  
  Should you have any questions or concerns, our dedicated support team is here to assist you every step of the way.
  
  Thank you for your trust in PMGURUKKUL. We can't wait to see you in action!
  
  Best regards,
  
  PMGURUKKUL Team 🏅`;

  await sendEmail(email, "Verify your account", emailMessage);

  // Send OTP via SMS using 2Factor API
  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/b41581a6-f8df-11ef-8b17-0200cd936042/SMS/${mobileNumber}/${otp}/`
    );

    if (response.data.Status !== "Success") {
      return next(new ErrorHandler("Failed to send OTP via SMS", 500));
    }
  } catch (error) {
    return next(new ErrorHandler("Error sending OTP via SMS", 500));
  }

  res.status(200).json({
    success: true,
    message: `OTP ${
      hardcodedOtpEnabled ? "hardcoded" : ""
    } sent successfully to registered email and mobile number`,
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
      message:
        "OTP verified. Please complete your profile setup within 10 minutes.",
      newUser: true,
    });
  }

  return res.status(200).json({
    message: "Please Go To Login Page",
  });
});

//registration
export const registerUser = catchAsyncError(async (req, res, next) => {
  const {
    full_name,
    email,
    gender,
    password,
    confirm_password,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
    refralCode,
    addline1,
    addline2,
    gstNumber,
    gstCompanyName,
  } = req.body;

  if (!mobileNumber)
    return next(new ErrorHandler("Mobile number is required", 400));

  let existingUser = await User.findOne({ mobileNumber, verified: true });
  if (existingUser) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  if (password != confirm_password)
    return next(
      new ErrorHandler("Password and Confirm Password Doesn't Match", 400)
    );

  let unverifiedUser = await User.findOne({ mobileNumber, verified: false });
  if (!refralCode)
    return next(
      new ErrorHandler("Referral Code is required for registration", 400)
    );

  if (unverifiedUser) {
    if (!unverifiedUser.refralCode) {
      unverifiedUser.refralCode = `PM${Math.floor(
        1000 + Math.random() * 9000
      )}`;
    }

    unverifiedUser.full_name = full_name || unverifiedUser.full_name;
    unverifiedUser.email = email || unverifiedUser.email;
    unverifiedUser.gender = gender || unverifiedUser.gender;
    unverifiedUser.password = password || unverifiedUser.password;
    unverifiedUser.dob = dob || unverifiedUser.dob;
    unverifiedUser.occupation = occupation || unverifiedUser.occupation;
    unverifiedUser.country = country || unverifiedUser.country;
    unverifiedUser.state = state || unverifiedUser.state;
    unverifiedUser.city = city || unverifiedUser.city;
    unverifiedUser.pinCode = pinCode || unverifiedUser.pinCode;
    unverifiedUser.verified = true;
    unverifiedUser.addline1 = addline1 || unverifiedUser.addline1;
    unverifiedUser.addline2 = addline2 || unverifiedUser.addline2;
    unverifiedUser.gstNumber = gstNumber || unverifiedUser.gstNumber;
    unverifiedUser.gstCompanyName = gstCompanyName || unverifiedUser.gstCompanyName;
    unverifiedUser.verified = true;

    if (refralCode) {
      const referredUser = await User.findOne({ refralCode });
      if (!referredUser)
        return next(new ErrorHandler("Invalid referral code", 400));
      unverifiedUser.referredBy = referredUser._id;
    }

    await unverifiedUser.save();

    const emailMessage = `Dear ${unverifiedUser.full_name},
    
    Thank you very much for registering in PMGURUKKUL. Your referral code is ${unverifiedUser.refralCode}
  
  Best regards,
  
  PMGURUKKUL Team 🏅
  `;

    await sendEmail(email, "Welcome To PMGURUKKUL", emailMessage);

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
    if (firstUserCheck > 0)
      return next(
        new ErrorHandler("Referral code is required for registration", 400)
      );
  }

  const newReferralCode = `PM${Math.floor(1000 + Math.random() * 9000)}`;

  //  const currentYear = new Date().getFullYear();
  // const randomDigits = Math.floor(100 + Math.random() * 900);
  // const userId = `PM-${currentYear}${randomDigits}`;
  //  console.log(userId);

  const user = await User.create({
    full_name,
    email,
    gender,
    password,
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
    gstNumber,
    gstCompanyName,
    createdAt: new Date.now(),
    // userId,
  });

  sendToken(res, user, "Registered Successfully", 200);
});

//login
export const loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found!", 401));
  }

  // if (user.verified === false) {
  //   return next(
  //     new ErrorHandler(
  //       "You are not verified, please sign up again to complete the verification process",
  //       404
  //     )
  //   );
  // }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(res, user, `Welcome Back ${user.full_name} `, 200);
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please enter email", 404));
  }

  //Finding user
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.verified === false) {
    return next(
      new ErrorHandler(
        "You are not verified, please sign up again to complete the verification process",
        404
      )
    );
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/password/reset/${resetToken}`;

  const frontendurl = `https://pmgurukkul.com/auth/reset-password/${resetToken}`;

  const message = `Dear ${user.full_name},

  We hope this email finds you well. It appears that you've requested to reset your password for your PMGURUKKUL account. We're here to assist you in securely resetting your password and getting you back to enjoying our platform hassle-free.
  
  To reset your password, please click on the following link:
  
  ${frontendurl}
  
  This link will expire in 15 minutes for security reasons, so please make sure to use it promptly. If you didn't initiate this password reset request, please disregard this email, and your account will remain secure.
  
  If you encounter any issues or have any questions, feel free to reach out to our support team  for further assistance. We're here to help you every step of the way.
  
  Thank you for choosing PMGURUKKUL. We appreciate your continued support.
  
  Best regards,
  PMGURUKKUL Team`;

  try {
    await sendEmail(
      user.email,
      "Password Reset Link for PMGURUKKUL Account",
      message
    );

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (!req.body.password || !req.body.confirmPassword) {
    return next(new ErrorHandler("Please Enter Password", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully ",
  });
});

//get my profile
export const getmyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate(
    "referredBy",
    "full_name email refralCode"
  );

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
    addline1, // Additional address line 1
    addline2, // Additional address line 2
    gstNumber,
    gstCompanyName,
  } = req.body;

  // Uploaded files
  const {
    panImageFile,
    docFrontImageFile,
    docBackImageFile,
    passbookImageFile,
  } = req.files || {};

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
  if (addline1) user.addline1 = addline1;
  if (addline2) user.addline2 = addline2;
  if ("gstNumber" in req.body) user.gstNumber = gstNumber || "";
  if ("gstCompanyName" in req.body) user.gstCompanyName = gstCompanyName || "";

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

  // Update front document image if provided
  if (docFrontImageFile && docFrontImageFile[0]) {
    // Delete the old front document image from ImageKit
    if (user.document.docFrontImage?.public_id) {
      await imagekit.deleteFile(user.document.docFrontImage.public_id);
    }

    // Upload the new front document image
    const docFrontUploadResponse = await imagekit.upload({
      file: docFrontImageFile[0].buffer,
      fileName: `docFront_${Date.now()}.jpg`,
    });

    user.document.docFrontImage = {
      public_id: docFrontUploadResponse.fileId,
      url: docFrontUploadResponse.url,
    };
  }

  // Update back document image if provided
  if (docBackImageFile && docBackImageFile[0]) {
    // Delete the old back document image from ImageKit
    if (user.document.docBackImage?.public_id) {
      await imagekit.deleteFile(user.document.docBackImage.public_id);
    }

    // Upload the new back document image
    const docBackUploadResponse = await imagekit.upload({
      file: docBackImageFile[0].buffer,
      fileName: `docBack_${Date.now()}.jpg`,
    });

    user.document.docBackImage = {
      public_id: docBackUploadResponse.fileId,
      url: docBackUploadResponse.url,
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

//admin update user
export const updateUserDetailsAdmin = catchAsyncError(
  async (req, res, next) => {
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
      addline1, // Additional address line 1
      addline2, // Additional address line 2
    } = req.body;

    // Uploaded files
    const {
      panImageFile,
      docFrontImageFile,
      docBackImageFile,
      passbookImageFile,
    } = req.files || {};

    // Ensure the user is logged in
    const userId = req.params.id;

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
    if (addline1) user.addline1 = addline1;
    if (addline2) user.addline2 = addline2;

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

    // Update front document image if provided
    if (docFrontImageFile && docFrontImageFile[0]) {
      // Delete the old front document image from ImageKit
      if (user.document.docFrontImage?.public_id) {
        await imagekit.deleteFile(user.document.docFrontImage.public_id);
      }

      // Upload the new front document image
      const docFrontUploadResponse = await imagekit.upload({
        file: docFrontImageFile[0].buffer,
        fileName: `docFront_${Date.now()}.jpg`,
      });

      user.document.docFrontImage = {
        public_id: docFrontUploadResponse.fileId,
        url: docFrontUploadResponse.url,
      };
    }

    // Update back document image if provided
    if (docBackImageFile && docBackImageFile[0]) {
      // Delete the old back document image from ImageKit
      if (user.document.docBackImage?.public_id) {
        await imagekit.deleteFile(user.document.docBackImage.public_id);
      }

      // Upload the new back document image
      const docBackUploadResponse = await imagekit.upload({
        file: docBackImageFile[0].buffer,
        fileName: `docBack_${Date.now()}.jpg`,
      });

      user.document.docBackImage = {
        public_id: docBackUploadResponse.fileId,
        url: docBackUploadResponse.url,
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
  }
);

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
    const user = await User.findById(req.user.id).populate({
      path: "purchasedCourses.courseId",
      select: "title description poster numOfVideos category",
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Return both course details and attendance status
    res.status(200).json({
      success: true,
      purchasedCourses: user.purchasedCourses,
    });
  }
);

