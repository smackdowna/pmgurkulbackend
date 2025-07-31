import express from "express";
import { createExam, getCourseQuestions, updateExam } from "../controllers/examController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router(); 

//Add questions --Admin
router
  .route("/exam/add-questions")
  .post(isAuthenticated, authorizeRoles("admin"), createExam);

router
  .route("/exam/questions/:courseId")
  .get(isAuthenticated, getCourseQuestions);

router
  .route("/exam/questions/:examId")
  .put(isAuthenticated, authorizeRoles("admin"), updateExam);

//   router
//   .route("/courses/:courseId/forum")
//   .get(getCourseLectures)
//   .put(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addLectures)
//   .delete(isAuthenticated, authorizeRoles("admin"), deleteCourse);


export default router;
