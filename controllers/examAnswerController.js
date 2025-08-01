import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import Exam from "../models/Exam.js";
import Answer from "../models/examAnswer.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";

export const attendExam = catchAsyncError(async (req, res, next) => {
  const { examId, answers } = req.body;
  const userId = req.user._id;

  if (!examId || !Array.isArray(answers) || answers.length === 0) {
    return next(new ErrorHandler("Please provide examId and answers", 400));
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    return next(new ErrorHandler("Exam not found", 404));
  }

  // Fetch user and check purchased course
  const user = await User.findOne({
    _id: userId,
    "purchasedCourses.courseId": exam.courseId,
  });

  if (!user) {
    return next(new ErrorHandler("User or course not found", 404));
  }

  const course = user.purchasedCourses.find(
    (c) => c.courseId.toString() === exam.courseId.toString()
  );

  if (!course) {
    return next(
      new ErrorHandler("Course not found in user's purchased courses", 404)
    );
  }

  if (course.examLimitLeft <= 0) {
    return res.status(400).json({
      success: false,
      message: "You have no remaining attempts for this exam.",
    });
  }

  // Score calculation
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

  // Save the answer
  const newAnswer = await Answer.create({
    studentId: userId,
    examId,
    answers,
    score,
    passed,
  });

  if (passed) {
    // Passed: mark as passed and reset attempts
    await User.updateOne(
      { _id: userId, "purchasedCourses.courseId": exam.courseId },
      {
        $set: {
          "purchasedCourses.$.isAttendedOnExam": true,
          "purchasedCourses.$.isPassed": true,
          "purchasedCourses.$.examLimitLeft": 0,
        },
      }
    );
  } else {
    // Failed: decrease limit
    const remainingAttempts = course.examLimitLeft - 1;
    await User.updateOne(
      { _id: userId, "purchasedCourses.courseId": exam.courseId },
      {
        $set: {
          "purchasedCourses.$.isAttendedOnExam": true,
          "purchasedCourses.$.examLimitLeft": remainingAttempts,
        },
      }
    );
  }

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

//Get single exam result
export const getExamById = catchAsyncError(async (req, res, next) => {
  console.log("object");
  const { examId } = req.params;
  console.log(examId);
  const examResult = await Answer.findById(examId);

  if (!examResult) {
    return next(new ErrorHandler("Result not found", 404));
  }

  res.status(200).json({
    success: true,
    examResult,
  });
});
