import multer from "multer";
import fs from "fs";

// ✅ Use /tmp for temporary storage in serverless environments
const tempDir = "/tmp/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true }); // Add recursive to create full path
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 7000, // 7GB
  },
  fileFilter(req, file, cb) {
    const allowedMimeTypes = [
      "video/mp4",
      "video/mkv",
      "video/webm",
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only video, pdf, ppt, doc, and excel files are allowed!"));
    }
  },
});


export const singleUploadS3 = upload.single("file");