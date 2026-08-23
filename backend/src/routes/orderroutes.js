const express = require("express");

const protect = require("../middleware/authmiddleware");

const {
  placeOrder,
  getMyOrders,
  getSingleOrder,
} = require("../controllers/ordercontroller");

const router = express.Router();

router.post("/place", protect, placeOrder);

router.get("/get", protect, getMyOrders);

router.get("/:id", protect, getSingleOrder);

module.exports = router;