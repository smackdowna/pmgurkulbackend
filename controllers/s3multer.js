import multer from "multer";
import path from "path";
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
    fileSize: 1024 * 1024 * 7000, // 7GB (check your actual limits)
  },
  fileFilter(req, file, cb) {
    if (
      file.mimetype === "video/mp4" ||
      file.mimetype === "video/mkv" ||
      file.mimetype === "video/webm"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"));
    }
  },
});

export const singleUploadS3 = upload.single("file");