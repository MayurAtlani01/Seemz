const express = require("express");
const protect = require("../middleware/authmiddleware");

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistcontroller");

const router = express.Router();

router.post("/add", protect, addToWishlist);

router.get("/get", protect, getWishlist);

router.delete("/remove/:productId", protect, removeFromWishlist);

module.exports = router;