const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const otpService = require("../services/otpService");
const { sendEmail, generateOtpEmailHtml, getEmailConfig } = require("../services/emailService");

// DIAGNOSTIC STATUS CONTROLLER (Safe environment verification)
const getDiagnosticStatus = async (req, res) => {
  const { provider, from, isConfigured } = getEmailConfig();
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV || "development",
    emailProvider: provider,
    emailReady: isConfigured,
    sender: from,
    envCheck: {
      MONGO_URI: Boolean(process.env.MONGO_URI),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      CLIENT_URL: Boolean(process.env.CLIENT_URL),
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      EMAIL_FROM: Boolean(process.env.EMAIL_FROM),
    },
  });
};

// SAFE DIAGNOSTIC TEST EMAIL DISPATCH
const testEmailDelivery = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  try {
    const result = await sendEmail({
      to: email.trim(),
      subject: "Seemz - Test Verification Dispatch",
      text: "This is a direct test verifying email delivery from Seemz Atelier via Resend HTTPS API.",
      html: generateOtpEmailHtml({ name: "Client", otp: "123456", purpose: "email service verification" }),
    });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// REGISTER CONTROLLER
const registerUser = async (req, res) => {
  try {
    const result = await otpService.sendRegistrationOtp(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// VERIFY REGISTER OTP CONTROLLER
const verifyRegisterOTP = async (req, res) => {
  try {
    const { user } = await otpService.verifyRegistrationOtp(req.body);

    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    const token = jwtSecret
      ? jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "7d" })
      : null;

    if (token) {
      const isProduction =
        process.env.NODE_ENV === "production" ||
        req.secure ||
        req.headers["x-forwarded-proto"] === "https" ||
        (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("vercel.app"));

      res.cookie("token", token, {
        httpOnly: true,
        secure: Boolean(isProduction),
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account verified successfully! You are now logged in.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// RESEND REGISTER OTP CONTROLLER
const resendRegisterOTP = async (req, res) => {
  try {
    const result = await otpService.resendRegistrationOtp(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// LOGIN CONTROLLER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        isVerified: false,
        message: "Your account is not verified. Please verify your OTP to log in.",
        email: user.email,
        name: user.name,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    if (!jwtSecret) {
      console.error("[AUTH] CRITICAL: JWT_SECRET environment variable is missing");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("vercel.app"));

    res.cookie("token", token, {
      httpOnly: true,
      secure: Boolean(isProduction),
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// LOG OUT CONTROLLER
const logoutUser = async (req, res) => {
  try {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("vercel.app"));

    res.clearCookie("token", {
      httpOnly: true,
      secure: Boolean(isProduction),
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// PASSWORD RESET CONTROLLER - FORGOT
const forgotPassword = async (req, res) => {
  try {
    const result = await otpService.sendForgotPasswordOtp(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// VERIFY AND RESET CONTROLLER
const resetPassword = async (req, res) => {
  try {
    const result = await otpService.verifyAndResetPassword(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

module.exports = {
  registerUser,
  verifyRegisterOTP,
  resendRegisterOTP,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getDiagnosticStatus,
  testEmailDelivery,
};