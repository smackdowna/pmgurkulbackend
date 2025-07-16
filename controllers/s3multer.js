import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = "temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
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
    fileSize: 1024 * 1024 * 7000, // 500MB max file size
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

// 👉 This is what you'll import and use in the route
export const singleUploadS3 = upload.single("file");
