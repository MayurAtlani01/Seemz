const express = require("express");
const router = express.Router();

const { registerUser,loginUser,logoutUser,forgotPassword,resetPassword} = require("../controllers/user.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword",resetPassword);
module.exports = router;