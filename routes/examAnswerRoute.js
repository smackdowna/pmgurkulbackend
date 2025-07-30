import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { attendExam } from "../controllers/examAnswerController.js";

const router = express.Router(); 

router
  .route("/exam/attend-exam")
  .post(isAuthenticated, attendExam);

//   router
//   .route("/courses/:courseId/forum")
//   .get(getCourseLectures)
//   .put(isAuthenticated, authorizeRoles("admin"), singleUploadS3, addLectures)
//   .delete(isAuthenticated, authorizeRoles("admin"), deleteCourse);


export default router;
