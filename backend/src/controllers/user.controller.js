const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const https = require("https");

// HELPER: Send via Resend HTTPS REST API (Port 443 - zero cloud SMTP port blocks)
const sendViaResend = (apiKey, fromEmail, toEmail, subject, text) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: fromEmail || "Seemz Atelier <onboarding@resend.dev>",
      to: [toEmail],
      subject: subject,
      text: text,
    });

    const options = {
      hostname: "api.resend.com",
      port: 443,
      path: "/emails",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 7000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`Resend API HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Resend HTTPS API request timed out (7000ms)"));
    });

    req.write(payload);
    req.end();
  });
};

// HELPER: Resilient Mail Delivery with Hard Overall Timeout & Safe Diagnostics
const sendMailHelper = async ({ to, subject, text, actionName = "OTP" }) => {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  const smtpUser = (
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL ||
    ""
  ).trim();

  const smtpPass = (
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    ""
  ).trim();

  // Internal execution promise
  const executeDelivery = async () => {
    // Strategy 1: Resend HTTP API (if configured)
    if (resendApiKey) {
      const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM || "Seemz Atelier <onboarding@resend.dev>";
      return await sendViaResend(resendApiKey, fromEmail, to, subject, text);
    }

    // Strategy 2: Custom SMTP Server (if SMTP_HOST provided)
    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 7000,
        tls: { rejectUnauthorized: false },
      });

      return await transporter.sendMail({
        from: `"Seemz Atelier" <${smtpUser}>`,
        to,
        subject,
        text,
      });
    }

    // Strategy 3: Standard Direct Gmail SMTP
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 7000,
        tls: { rejectUnauthorized: false },
      });

      return await transporter.sendMail({
        from: `"Seemz Atelier" <${smtpUser}>`,
        to,
        subject,
        text,
      });
    }

    throw new Error("No valid email transport configuration found (EMAIL_USER/EMAIL_PASS or RESEND_API_KEY).");
  };

  // Hard overall timeout guard (8500ms max) to ensure requests never hang indefinitely
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Email delivery timed out after 8500ms"));
    }, 8500);
  });

  return await Promise.race([executeDelivery(), timeoutPromise]);
};

// HELPER: Send Registration Verification Email
const sendVerificationEmail = async (email, name, otp) => {
  return sendMailHelper({
    to: email,
    subject: "Welcome to Seemz - Verify Your Account",
    text: `Hello ${name},

Thank you for registering with Seemz Atelier.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes.

Regards,
Seemz Atelier`,
    actionName: "register_verification",
  });
};

// REGISTER CONTROLLER
const registerUser = async (req, res) => {
  console.log("[AUTH] Registration request received");
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    console.log("[OTP] Generation started");
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (existingUser) {
      if (existingUser.isVerified) {
        console.log("[AUTH] Verification failed: User already exists");
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      } else {
        // Reuse unverified user record
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.name = name.trim();
        existingUser.password = hashedPassword;
        existingUser.otp = hashedOtp;
        existingUser.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        existingUser.otpAttempts = 0;
        existingUser.otpLastSent = new Date();

        console.log("[OTP] Email delivery started");
        try {
          await sendVerificationEmail(normalizedEmail, name.trim(), otp);
          console.log("[OTP] Email delivery completed");
        } catch (mailErr) {
          console.error(`[OTP] Email delivery failed: ${mailErr.message}`);
          return res.status(503).json({
            success: false,
            message: "Unable to send verification code. Please try again.",
          });
        }

        await existingUser.save();
        console.log("[OTP] OTP storage completed");

        return res.status(200).json({
          success: true,
          message: "Verification code sent to your email.",
          email: normalizedEmail,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      otp: hashedOtp,
      otpExpire: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      otpLastSent: new Date(),
    });

    console.log("[OTP] Email delivery started");
    try {
      await sendVerificationEmail(normalizedEmail, name.trim(), otp);
      console.log("[OTP] Email delivery completed");
    } catch (mailErr) {
      console.error(`[OTP] Email delivery failed: ${mailErr.message}`);
      return res.status(503).json({
        success: false,
        message: "Unable to send verification code. Please try again.",
      });
    }

    await user.save();
    console.log("[OTP] OTP storage completed");

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for the verification code.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[AUTH] Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// VERIFY REGISTER OTP CONTROLLER
const verifyRegisterOTP = async (req, res) => {
  console.log("[OTP] Verification request received");
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      console.log("[AUTH] Verification failed: Missing email or OTP");
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("[AUTH] Verification failed: User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      console.log("[AUTH] Verification failed: Account already verified");
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    if (!user.otp || !user.otpExpire) {
      console.log("[AUTH] Verification failed: No active OTP record found");
      return res.status(400).json({
        success: false,
        message: "No active verification code found. Please request a new OTP.",
      });
    }

    if (new Date(user.otpExpire).getTime() < Date.now()) {
      console.log("[AUTH] Verification failed: Verification code expired");
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new OTP.",
      });
    }

    if (user.otpAttempts >= 5) {
      console.log("[AUTH] Verification failed: Too many failed attempts");
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Verification code has been invalidated. Please request a new OTP.",
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.otp);

    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otp = null;
        user.otpExpire = null;
      }
      await user.save();

      const remaining = 5 - user.otpAttempts;
      console.log(`[AUTH] Verification failed: Invalid OTP code (Attempts remaining: ${remaining})`);
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Invalid verification code. You have ${remaining} attempts remaining.`
          : "Too many failed attempts. Verification code has been invalidated. Please request a new OTP.",
      });
    }

    // Verification Success
    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    user.otpAttempts = 0;
    await user.save();

    console.log("[OTP] Verification completed");
    return res.status(200).json({
      success: true,
      message: "Account verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("[AUTH] OTP verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// RESEND REGISTER OTP CONTROLLER
const resendRegisterOTP = async (req, res) => {
  console.log("[AUTH] Resend OTP request received");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("[AUTH] Verification failed: User not found for resend");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      console.log("[AUTH] Verification failed: User already verified");
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    // 60-second cooldown enforcement
    if (user.otpLastSent && Date.now() - new Date(user.otpLastSent).getTime() < 60 * 1000) {
      const timeRemaining = Math.ceil((60 * 1000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${timeRemaining} seconds before requesting another code.`,
      });
    }

    console.log("[OTP] Generation started");
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = new Date();

    console.log("[OTP] Email delivery started");
    try {
      await sendVerificationEmail(normalizedEmail, user.name, otp);
      console.log("[OTP] Email delivery completed");
    } catch (mailErr) {
      console.error(`[OTP] Email delivery failed: ${mailErr.message}`);
      return res.status(503).json({
        success: false,
        message: "Unable to send verification code. Please try again.",
      });
    }

    await user.save();
    console.log("[OTP] OTP storage completed");

    return res.status(200).json({
      success: true,
      message: "Verification code resent successfully.",
    });
  } catch (error) {
    console.error("[AUTH] Resend OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// LOGIN CONTROLLER
const loginUser = async (req, res) => {
  console.log("[AUTH] Login request received");
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
      console.log("[AUTH] Login failed: User does not exist");
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.isVerified) {
      console.log("[AUTH] Login blocked: User account unverified");
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
      console.log("[AUTH] Login failed: Password mismatch");
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

    console.log("[AUTH] Login successful");
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
  console.log("[AUTH] Forgot password request received");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("[AUTH] Verification failed: User does not exist for password reset");
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    console.log("[OTP] Generation started");
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    console.log("[OTP] Email delivery started");
    try {
      await sendMailHelper({
        to: normalizedEmail,
        subject: "Seemz Password Reset OTP",
        text: `Hello ${user.name},

We received a request to reset your Seemz account password.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Seemz Atelier`,
        actionName: "forgot_password",
      });
      console.log("[OTP] Email delivery completed");
    } catch (mailErr) {
      console.error(`[OTP] Email delivery failed: ${mailErr.message}`);
      return res.status(503).json({
        success: false,
        message: "Unable to send verification code. Please try again.",
      });
    }

    await user.save();
    console.log("[OTP] OTP storage completed");

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("[AUTH] Forgot password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// VERIFY AND RESET CONTROLLER
const resetPassword = async (req, res) => {
  console.log("[AUTH] Password reset verification request received");
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("[AUTH] Verification failed: User not found during reset");
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    if (!user.otp || !user.otpExpire) {
      console.log("[AUTH] Verification failed: Invalid OTP or session expired");
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or session expired",
      });
    }

    if (new Date(user.otpExpire).getTime() < Date.now()) {
      console.log("[AUTH] Verification failed: Password reset OTP expired");
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.otp);
    if (!isMatch) {
      console.log("[AUTH] Verification failed: Invalid OTP for password reset");
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    console.log("[AUTH] Password reset completed successfully");
    return res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.error("[AUTH] Reset password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
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
};