import multer from "multer";

const storage = multer.memoryStorage();

const multipleUpload = multer({ storage }).fields([
  { name: "video", maxCount: 1 },   // For video file (S3)
  { name: "poster", maxCount: 1 }, // For image/poster (Cloudinary)
]);

export default multipleUpload;
