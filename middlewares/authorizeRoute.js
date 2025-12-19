const jwt = require("jsonwebtoken");
import ErrorHandler from "./../utils/errorHandler";
import { catchAsyncError } from "./catchAsyncErrors";
const routeAccessMap = require("../constants/routeAccessMap");
const { User } = require("../models/userModel");

const authorizeRoute = () => {
  return catchAsyncError(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new ErrorHandler("You are not authorized to proceed!", 401));
    }

    // Extract token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ErrorHandler("Invalid or expired token.", 401));
    }

    // Fetch user to get assignedPages and role
    const user = await User.findById(decoded.userId).select(
      "assignedPages role"
    );

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

    // Flatten allowed backend routes from assigned frontend pages
    const allowedRoutes = user.assignedPages
      .map((frontendPath) => routeAccessMap[frontendPath] || [])
      .flat();

    if (!allowedRoutes.includes(currentRoute)) {
      return next(new ErrorHandler("Access denied to this route.", 403));
    }

    next();
  });
};

module.exports = authorizeRoute;
