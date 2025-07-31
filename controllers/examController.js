import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import Exam from "../models/Exam.js";
import ErrorHandler from "../utils/errorHandler.js";

export const createExam = catchAsyncError(async (req, res, next) => {
  const { courseId, title, questions } = req.body;

  if (
    !courseId ||
    !title ||
    !questions ||
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    return next(
      new ErrorHandler(
        "Please provide course Id, title, and at least one question",
        400
      )
    );
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

export const getCourseQuestions = catchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;

  if (!courseId) {
    return next(new ErrorHandler("Course ID is required", 400));
  }

  const exam = await Exam.findOne({ courseId });

  if (!exam || !exam.questions.length) {
    return next(new ErrorHandler("No questions found for this course", 404));
  }

  res.status(200).json({
    success: true,
    exam,
  });
});

export const updateExam = catchAsyncError(async (req, res, next) => {
  const { examId } = req.params;
  const { title, questions } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return next(
      new ErrorHandler("Title and at least one question are required", 400)
    );
  }

  // Validate each question
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

  const exam = await Exam.findById(examId);
  if (!exam) {
    return next(new ErrorHandler("Exam not found", 404));
  }

  exam.title = title;
  exam.questions = questions;

  // Update duration and passing mark based on question count
  exam.duration = questions.length;
  exam.passingMark = Math.ceil(questions.length * 0.5);

  await exam.save();

  res.status(200).json({
    success: true,
    message: "Exam updated successfully",
    exam,
  });
});
