const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const hasBearer = Boolean(authHeader && typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer "));

    if (!token && hasBearer) {
      token = authHeader.substring(7).trim();
    }

    // Safe diagnostic logging (no secrets or tokens exposed)
    console.log(`[AUTH] Path: ${req.method} ${req.originalUrl} | Cookie present: ${Boolean(req.cookies?.token)} | Auth header present: ${hasBearer}`);

    if (!token) {
      console.log("[AUTH] No token provided in cookie or Authorization header -> 401");
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Please log in.",
      });
    }

    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    if (!jwtSecret) {
      console.error("[AUTH] CRITICAL: JWT_SECRET environment variable is missing on server");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select("-password -otp -resetPasswordToken");

    if (!user) {
      console.log("[AUTH] Token valid but user record not found in database -> 401");
      return res.status(401).json({
        success: false,
        message: "User not found or session expired",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(`[AUTH] Token verification failed: ${error.name} - ${error.message}`);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
};

module.exports = protect;