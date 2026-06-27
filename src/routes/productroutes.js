const express = require("express");
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require("../controllers/productController");

const router = express.Router();

const protect = require("../middleware/authmiddleware");
const adminProtect = require("../middleware/admin_protection_middleware");

router.post("/create", protect, adminProtect, createProduct);

router.get("/get", getProducts);

router.get("/:id", getProductById);

router.put("/:id", protect, adminProtect, updateProduct);

router.delete("/:id", protect, adminProtect, deleteProduct);


module.exports = router;