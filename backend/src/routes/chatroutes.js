const express = require("express");
const { handleChat } = require("../controllers/chatcontroller");

const router = express.Router();

router.post("/", handleChat);

module.exports = router;
