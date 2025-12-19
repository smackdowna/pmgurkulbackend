import express from "express";
import { createExam, getCourseQuestions, updateExam } from "../controllers/examController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router(); 

//Add questions --Admin
router
  .route("/exam/add-questions")
  .post(isAuthenticated, authorizeRoute(), createExam);

router
  .route("/exam/questions/:courseId")
  .get(isAuthenticated, getCourseQuestions);

router
  .route("/exam/questions/:examId")
  .put(isAuthenticated, authorizeRoute(), updateExam);

//   router
//   .route("/courses/:courseId/forum")
//   .get(getCourseLectures)
//   .put(isAuthenticated, authorizeRoute(), singleUploadS3, addLectures)
//   .delete(isAuthenticated, authorizeRoute(), deleteCourse);


export default router;
