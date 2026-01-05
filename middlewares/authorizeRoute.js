import jwt from "jsonwebtoken";
import { routeAccessMap } from "../constants/routeAccessMap.constants.js";
import ErrorHandler from "./../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncErrors.js";
import { User } from "../models/userModel.js";

export const authorizeRoute = () => {
  return catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
      return next(new ErrorHandler("You are not authorized to proceed!", 401));
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ErrorHandler("Invalid or expired token.", 401));
    }

    // Fetch user to get assignedPages and role
    const user = await User.findById(decoded?._id).select("assignedPages role");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Attach user info to request
    req.user = decoded;

    // 👇 Construct and normalize current route
    let currentRoute =
      req.baseUrl + (req.route && req.route.path ? req.route.path : "");
    currentRoute = currentRoute
      .replace(/^\/api\/v[0-9]+/, "")
      .replace(/\/$/, "");

    const normalize = (path = "") =>
      path.replace(/\/+$/, "").replace(/\/:[^/]+/g, "");

    const allowedRoutes = user.assignedPages
      .map((frontendPath) => routeAccessMap[frontendPath] || [])
      .flat();

    const isAllowed = allowedRoutes.some((route) =>
      normalize(currentRoute).startsWith(normalize(route))
    );

    if (!isAllowed) {
      return next(new ErrorHandler("Access denied to this route.", 403));
    }

    next();
  });
};
