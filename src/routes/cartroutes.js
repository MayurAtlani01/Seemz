const express = require("express");
const { addToCart,getCart,updateCart,removeFromCart,clearCart} = require("../controllers/cartcontroller");
const  protect  = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/add",protect ,addToCart);
router.get("/get", protect, getCart);
router.put("/update", protect, updateCart);
router.delete("/remove/:productId", protect, removeFromCart);
router.delete("/clear", protect, clearCart);


module.exports = router;