const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyRegisterOTP,
  resendRegisterOTP,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getDiagnosticStatus,
} = require("../controllers/user.controller");

router.get("/diagnostic-status", getDiagnosticStatus);
router.post("/register", registerUser);
router.post("/verify-register-otp", verifyRegisterOTP);
router.post("/resend-register-otp", resendRegisterOTP);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;