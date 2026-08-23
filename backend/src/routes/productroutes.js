const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadImages,
} = require("../controllers/productcontroller");

const router = express.Router();

const protect = require("../middleware/authmiddleware");
const adminProtect = require("../middleware/admin_protection_middleware");
const upload = require("../middleware/upload");

router.post("/upload", protect, adminProtect, upload.array("images", 6), uploadImages);

router.post("/create", protect, adminProtect, createProduct);

router.get("/get", getProducts);

router.get("/:id", getProductById);

router.put("/:id", protect, adminProtect, updateProduct);

router.delete("/:id", protect, adminProtect, deleteProduct);

module.exports = router;