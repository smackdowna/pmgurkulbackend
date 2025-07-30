import express from "express";
import { createExam } from "../controllers/examController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router(); 

//create course --Admin
router
  .route("/exam/add-questions")
  .post(isAuthenticated, authorizeRoles("admin"), createExam);

//   router
//   .route("/courses/:courseId/forum")
//   .get(getCourseLectures)
//   .put(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addLectures)
//   .delete(isAuthenticated, authorizeRoles("admin"), deleteCourse);


export default router;
