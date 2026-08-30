const express = require("express");

const protect = require("../middleware/authmiddleware");
const adminProtect = require("../middleware/admin_protection_middleware");

const {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  getAllOrdersAdmin,
  cancelOrderAdmin,
  deliverOrderAdmin,
  cancelMyOrder,
} = require("../controllers/ordercontroller");

const router = express.Router();

router.post("/place", protect, placeOrder);
router.get("/get", protect, getMyOrders);
router.get("/admin/all", protect, adminProtect, getAllOrdersAdmin);
router.put("/admin/:id/cancel", protect, adminProtect, cancelOrderAdmin);
router.put("/admin/:id/deliver", protect, adminProtect, deliverOrderAdmin);
router.put("/my/:id/cancel", protect, cancelMyOrder);
router.get("/:id", protect, getSingleOrder);

module.exports = router;