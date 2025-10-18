import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
  addToPlaylist,
  approveKYCStatus,
  forgotPassword,
  getAllUser,
  getmyProfile,
  getSingleUser,
  getUserDashboardStats,
  getUserPurchasedCourses,
  getUsersWithPendingKYC,
  loginUser,
  logout,
  registerUser,
  rejectKYCStatus,
  removeFromPlaylist,
  resetPassword,
  sendOTP,
  suspendUser,
  updateUserDetails,
  updateUserDetailsAdmin,
  verifyOTP,
  withdrawSuspension,
} from "../controllers/userControllers.js";
import { multipleUpload } from "../middlewares/multiplemulter.js";

const router = express.Router();

//sendOTP
router.route("/send-otp").post(sendOTP);

//verifyOTP
router.route("/verify-otp").post(verifyOTP);

//register
router.route("/register").post(multipleUpload, registerUser);

//login
router.route("/login").post(loginUser);

//forgot password
router.route("/password/forgot").post(forgotPassword);

//reset password
router.route("/password/reset/:token").put(resetPassword);

//get my profile
router.route("/myprofile").get(isAuthenticated, getmyProfile);

// Gte dashboard stats
router.route("/user/stats").get(isAuthenticated, getUserDashboardStats); //yhyhuioyi9y

//logout
router.route("/logout").get(logout);

//user update details
router
  .route("/me/update")
  .put(isAuthenticated, multipleUpload, updateUserDetails);

//add to playlist
router.route("/addtoplaylist").put(isAuthenticated, addToPlaylist);

//remove from playlist
router.route("/removeplaylist").put(isAuthenticated, removeFromPlaylist);

//get all user--Admin
router
  .route("/all/user")
  .get(isAuthenticated, authorizeRoles("admin"), getAllUser);

// Suspend user
router
  .route("/user/suspend")
  .put(isAuthenticated, authorizeRoles("admin"), suspendUser);

// Withdraw suspension
router
  .route("/user/withdraw-suspension")
  .put(isAuthenticated, authorizeRoles("admin"), withdrawSuspension);


  
//get single user--Admin

router
  .route("/user/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getSingleUser)
  .put(
    isAuthenticated,
    authorizeRoles("admin"),
    multipleUpload,
    updateUserDetailsAdmin
  );

//get kyc status pending--Admin
router
  .route("/user/kyc/pending")
  .get(isAuthenticated, authorizeRoles("admin"), getUsersWithPendingKYC);

//chnage kyc status--Admin
router
  .route("/user/approve/:id")
  .put(isAuthenticated, authorizeRoles("admin"), approveKYCStatus);

router
  .route("/user/reject/:id")
  .put(isAuthenticated, authorizeRoles("admin"), rejectKYCStatus);

router.route("/purchased/course").get(isAuthenticated, getUserPurchasedCourses);

export default router;
