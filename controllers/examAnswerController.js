import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import Exam from "../models/Exam.js";
import Answer from "../models/examAnswer.js";
import ErrorHandler from "../utils/errorHandler.js";


export const attendExam = catchAsyncError(async (req, res, next) => {
  const { examId, answers } = req.body;
  const userId = req.user._id;

  const alreadyGiven = await Answer.findOne({ examId, studentId:userId });

    if (alreadyGiven) {
      return res.status(400).json({
        success: false,
        message: "You have already attended on this exam.",
      });
    }
  
  if (!examId || !Array.isArray(answers) || answers.length === 0) {
    return next(new ErrorHandler("Please provide examId and answers", 400));
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    return next(new ErrorHandler("Exam not found", 404));
  }

  let score = 0;
  const questionMap = new Map();
  exam.questions.forEach((q) => questionMap.set(q._id.toString(), q));

  for (const ans of answers) {
    const question = questionMap.get(ans.questionId);
    if (question && question.correctAnswerIndex === ans.selectedOptionIndex) {
      score++;
    }
  }

  const passed = score >= exam.passingMark;

  const newAnswer = await Answer.create({
    studentId:userId,
    examId,
    answers,
    score,
    passed,
  });

  res.status(201).json({
    success: true,
    message: "Exam submitted successfully",
    result: {
      score,
      passed,
    },
    data: newAnswer,
  });
});
