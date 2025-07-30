// models/Exam.js
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [optionSchema],
    validate: (val) => val.length >= 2,
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
  },
});

const examSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  questions: {
    type: [questionSchema],
    required: true,
  },
  duration: {
    type: Number,
  },
  passingMark: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

examSchema.pre('save', function (next) {
  const totalQuestions = this.questions.length;
  this.duration = totalQuestions;
  this.passingMark = Math.ceil(totalQuestions * 0.5);
  next();
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
