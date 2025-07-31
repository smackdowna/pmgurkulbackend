import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { attendExam, getExamById } from "../controllers/examAnswerController.js";

const router = express.Router(); 

router
  .route("/exam/attend-exam")
  .post(isAuthenticated, attendExam);

router
  .route("/exam/result/:examId")
  .get(isAuthenticated, getExamById);


export default router;