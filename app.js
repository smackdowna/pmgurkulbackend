import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorMiddleware from "./middlewares/Error.js";
import multer from "multer";

config({
  path: "./config/config.env",
});

const app = express();

//using middleware
app.use(express.json({ limit: "10gb" }));
app.use(express.urlencoded({ extended: true, limit: "10gb" }));

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "*",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://pm-gurukul.vercel.app",
      "https://pmgurukkul.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  })
);

import user from "./routes/userRoutes.js";
import course from "./routes/courseRoute.js";
import order from "./routes/orderRoute.js";
import transaction from "./routes/transaction.js";
import earning from "./routes/earningRoute.js";
import exam from "./routes/examRoute.js";
import examAnswer from "./routes/examAnswerRoute.js";
import certificate from "./routes/certificateRoute.js";
import admin from "./routes/adminRoute.js";
import talent from "./routes/talentRoute.js";
import testimonial from "./routes/testimonialRoute.js";
import photoGallery from "./routes/photoGalleryRoute.js";
import businessPlan from "./routes/businessPlanRoute.js";
import referralNetwork from "./routes/referralNetworkRoute.js";

app.use("/api/v1", user);
app.use("/api/v1", course);
app.use("/api/v1", order);
app.use("/api/v1", transaction);
app.use("/api/v1", earning);
app.use("/api/v1", exam);
app.use("/api/v1", examAnswer);
app.use("/api/v1", certificate);
app.use("/api/v1", admin);
app.use("/api/v1", talent);
app.use("/api/v1/testimonial", testimonial);
app.use("/api/v1/photoGallery", photoGallery);
app.use("/api/v1/businessPlan", businessPlan);
app.use("/api/v1/referralNetwork", referralNetwork);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    console.error("Unknown Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
  next();
});

export default app;

app.get("/", (req, res) => res.send(`<h1>Welcome To PMGURUKKUL</h1>`));

app.get("/api/v1/getKey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

app.use(ErrorMiddleware);
