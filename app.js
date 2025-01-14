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
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

app.use(
  cors({
    origin: ["*", "http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
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

app.get("/", (req, res) => res.send(`<h1>Welcome To PM Gurukul</h1>`));

app.use(ErrorMiddleware);
