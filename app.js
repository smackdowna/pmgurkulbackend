import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorMiddleware from "./middlewares/Error.js";

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
    origin: ["*", "http://localhost:3000", "http://localhost:5173","https://pm-gurukul.vercel.app", "https://pmgurukkul.com"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  })
);

import user from "./routes/userRoutes.js";
import course from "./routes/courseRoute.js";
import order from "./routes/orderRoute.js";
import transaction from "./routes/transaction.js";
import earning from "./routes/earningRoute.js";

app.use("/api/v1", user);
app.use("/api/v1",course);
app.use("/api/v1",order);
app.use("/api/v1",transaction);
app.use("/api/v1",earning);


export default app;

app.get("/", (req, res) => res.send(`<h1>Welcome To PMGURUKKUL</h1>`));

app.get("/api/v1/getKey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

app.use(ErrorMiddleware);
