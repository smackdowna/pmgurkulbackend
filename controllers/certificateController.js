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

export const generateCertificateId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `PM-${randomNumber}`;
};

export const generateCertificate = catchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { studentName } = req.body;

  // Validate request
  if (!studentName) {
    return next(new ErrorHandler("Please provide student name", 400));
  }

  // Generate unique certificateId
  const certificateId = await generateCertificateId();

  // Create certificate
  const certificate = await Certificate.create({
    studentId: userId,
    studentName,
    certificateId,
  });

  res.status(201).json({
    success: true,
    message: "Certificate generated successfully",
    certificate,
  });
});

export const getStudentCertificates = catchAsyncError(
  async (req, res, next) => {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not found", 401));
    }

    const certificates = await Certificate.find({ studentId:userId });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  }
);
