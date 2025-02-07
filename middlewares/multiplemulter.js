import multer from "multer";

const storage = multer.memoryStorage();

// Configure to handle multiple files
export const multipleUpload = multer({ storage }).fields([
  { name: "panImageFile", maxCount: 1 },
  { name: "docImageFile", maxCount: 1 },
  { name: "passbookImageFile", maxCount: 1 }, // Add this line for passbook image
]);