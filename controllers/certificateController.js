import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Certificate } from "../models/Certificate.js";
import ErrorHandler from "../utils/errorHandler.js";

// Generate custom certificate id
// let currentId = 1;
// export const generateCertificateId = () => {
//   const formattedNumber = String(currentId).padStart(5, "0");
//   const newId = `PM-${formattedNumber}`;
//   currentId++;
//   return newId;
// };

// certificateService.js (new file or inside your controller file)

// Reusable core logic function



export const generateCertificateId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `PM-${randomNumber}`;
};

// Reusable function
export const createCertificate = async (userId, studentName, courseName) => {
  if (!studentName || !courseName) throw new Error("Student and course name are required");

  const certificateId = await generateCertificateId();

  const certificate = await Certificate.create({
    studentId: userId,
    studentName,
    courseName,
    certificateId,
  });

  return certificate;
};

export const generateCertificate = catchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { studentName, courseName } = req.body;

  if (!studentName) {
    return next(new ErrorHandler("Please provide student name and course name", 400));
  }

  const certificate = await createCertificate(userId, studentName, courseName);

  res.status(201).json({
    success: true,
    message: "Certificate generated successfully",
    certificate,
  });
});


// For students
export const getStudentCertificates = catchAsyncError(
  async (req, res, next) => {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not found", 401));
    }

    const certificates = await Certificate.find({ studentId: userId });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  }
);

// For students
export const getAllCertificates = catchAsyncError(async (req, res, next) => {
  const certificates = await Certificate.find();

  res.status(200).json({
    success: true,
    count: certificates.length,
    certificates,
  });
});
