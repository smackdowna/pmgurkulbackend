import express from "express";
import { isAuthenticated, authorizeRoles, hasPurchasedCourse } from "../middlewares/auth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLectures,
  getAllCategories,
  getAllCourses,
  getCoursedetails,
  getCourseLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { singleUploadS3 } from "../controllers/s3multer.js";

const router = express.Router(); 

//create course --Admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizeRoles("admin"), singleUpload, createCourse);

//get all course without lectures
router.route("/courses").get(getAllCourses);

//Add lectures delete course ,
// get course details
router
  .route("/course/:id")
  .get(getCourseLectures)
  .put(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addLectures)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCourse);


//delete lectures
router.route("/lectures").delete(isAuthenticated, authorizeRoles("admin"),deleteLectures);  

//has purchased the course
router.route("/courses/:id").get(isAuthenticated,hasPurchasedCourse,getCoursedetails);

//get single course details
router.route("/course/single/:id").get(getCoursedetails);


//get category
router.route("/category").get(getAllCategories);


export default router;
