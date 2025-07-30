import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import Exam from "../models/Exam.js";
import ErrorHandler from "../utils/errorHandler.js";

export const createExam = catchAsyncError(async (req, res, next) => {
  const { courseId, title, questions } = req.body;

  if (!courseId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return next(new ErrorHandler("Please provide course Id, title, and at least one question", 400));
  }

  // Validate each question structure
  for (const question of questions) {
    if (
      !question.questionText ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      typeof question.correctAnswerIndex !== "number"
    ) {
      return next(new ErrorHandler("Invalid question format", 400));
    }
  }

  const exam = await Exam.create({
    courseId,
    title,
    questions,
  });

  res.status(201).json({
    success: true,
    message: "Exam created and linked to course successfully",
    exam,
  });
});