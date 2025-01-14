import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  createOrder,
  getAllOrders,
  getSingleOrder,
  myOrders,
} from "../controllers/orderController.js";
import {
  checkout,
  paymentVerification,
} from "../controllers/paymentController.js";

const router = express.Router();

//create order
router.route("/createorder").post(isAuthenticated, createOrder);

//get my orders
router.route("/myorder").get(isAuthenticated, myOrders);

//get all order-Admin
router
  .route("/allorders")
  .get(isAuthenticated, authorizeRoles("admin"), getAllOrders);

//get single order
router.route("/order/:id").get(isAuthenticated, getSingleOrder);

//checkout
router.route("/checkout").post(isAuthenticated, checkout);

//payment verification
router.route("/paymentverification").post(isAuthenticated, paymentVerification);

export default router;
