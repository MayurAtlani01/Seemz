const express = require("express");
const protect = require("../middleware/authmiddleware");
const upload = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} = require("../controllers/profilecontroller");

const router = express.Router();

// Get profile routes
router.get("/", protect, getProfile);
router.get("/profile", protect, getProfile);
router.get("/me", protect, getProfile);

// Update profile routes
router.put("/", protect, updateProfile);
router.put("/update", protect, updateProfile);
router.put("/profile", protect, updateProfile);

// Avatar upload routes
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);
router.post("/profile/avatar", protect, upload.single("avatar"), uploadAvatar);

// Avatar delete routes
router.delete("/avatar", protect, removeAvatar);
router.delete("/remove-avatar", protect, removeAvatar);
router.delete("/profile/avatar", protect, removeAvatar);

module.exports = router;
