const express = require("express");
const  protect  = require("../middleware/authmiddleware");
const {getProfile,updateProfile} = require("../controllers/profilecontroller");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/update", protect, updateProfile);

module.exports = router;