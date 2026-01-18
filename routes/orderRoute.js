import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getSingleOrder,
  myOrders,
} from "../controllers/orderController.js";
import {
  checkout,
  paymentVerification,
} from "../controllers/paymentController.js";
import { authorizeRoute } from "../middlewares/authorizeRoute.js";

const router = express.Router();

//create order
router.route("/create-order").post(isAuthenticated, createOrder);

//get my orders
router.route("/my-orders").get(isAuthenticated, myOrders);

//get all order-Admin
router
  .route("/all-orders")
  .get(isAuthenticated, authorizeRoute(), getAllOrders);

//get single order
router.route("/order/:id").get(isAuthenticated, getSingleOrder);

//checkout
router.route("/checkout").post(isAuthenticated, checkout);

//payment verification
router.route("/paymentVerification").post(isAuthenticated, paymentVerification);
router.route("/order/cancel/:id").put(isAuthenticated, cancelOrder);

export default router;
