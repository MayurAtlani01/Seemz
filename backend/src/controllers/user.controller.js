const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

// HELPER: Resilient Mail Delivery with Cloud Fallbacks & Safe Diagnostics
const sendMailHelper = async ({ to, subject, text, actionName = "OTP" }) => {
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

  console.log(`[OTP] Request received for: ${to} (Action: ${actionName})`);
  console.log(`[OTP] Email configuration present: ${Boolean(smtpUser && smtpPass)} (USER length: ${smtpUser.length}, PASS length: ${smtpPass.length})`);

  if (!smtpUser || !smtpPass) {
    const missingVarMsg = "Missing EMAIL_USER or EMAIL_PASS in server environment variables.";
    console.error(`[OTP] CRITICAL ERROR: ${missingVarMsg}`);
    throw new Error(missingVarMsg);
  }

  // Multi-tier transports:
  // Tier 1: Gmail service predefined configuration
  // Tier 2: Direct SSL Port 465
  // Tier 3: Direct TLS Port 587
  const transportConfigs = [
    {
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
  ];

  let lastError = null;
  for (let i = 0; i < transportConfigs.length; i++) {
    try {
      console.log(`[OTP] Attempting email delivery (tier ${i + 1}/${transportConfigs.length})...`);
      const transporter = nodemailer.createTransport(transportConfigs[i]);
      await transporter.sendMail({
        from: `"Seemz Atelier" <${smtpUser}>`,
        to,
        subject,
        text,
      });
      console.log(`[OTP] Email delivery completed successfully to: ${to}`);
      return true;
    } catch (err) {
      console.warn(`[OTP] Transport tier ${i + 1} failed: ${err.name} - ${err.message}`);
      lastError = err;
    }
  }

  console.error(`[OTP] All email delivery tiers failed for ${to}:`, lastError?.message);
  throw lastError || new Error("Failed to deliver email through all SMTP transports.");
};

// HELPER: Send OTP Email
const sendVerificationEmail = async (email, name, otp) => {
  return sendMailHelper({
    to: email,
    subject: "Welcome to Seemz - Verify Your Account",
    text: `
Hello ${name},

Thank you for registering with Seemz Atelier.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes.

Regards,
Seemz Atelier
`,
    actionName: "register_verification",
  });
};

// REGISTER CONTROLLER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    // Generate secure 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      } else {
        // Reuse unverified user account: update details and send a new OTP
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.otp = hashedOtp;
        existingUser.otpExpire = Date.now() + 10 * 60 * 1000;
        existingUser.otpAttempts = 0;
        existingUser.otpLastSent = Date.now();

        // Attempt email send before saving
        try {
          await sendVerificationEmail(email, name, otp);
        } catch (mailErr) {
          console.error("Email delivery failed during unverified reuse:", mailErr);
          return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please check your email configuration.",
          });
        }

        await existingUser.save();

        return res.status(200).json({
          success: true,
          message: "Verification OTP sent to your email",
          email,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build the user model instance without saving yet
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp: hashedOtp,
      otpExpire: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      otpLastSent: Date.now(),
    });

    // Attempt email send first
    try {
      await sendVerificationEmail(email, name, otp);
    } catch (mailErr) {
      console.error("Email delivery failed for new user:", mailErr);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please check your email configuration.",
      });
    }

    // Save user to database only if email sends successfully
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for the verification code.",
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// VERIFY REGISTER OTP CONTROLLER
const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "No active verification code found. Please request a new OTP.",
      });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new OTP.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Verification code has been invalidated. Please request a new OTP.",
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      user.otpAttempts += 1;
      // Invalidate OTP on 5th failed attempt
      if (user.otpAttempts >= 5) {
        user.otp = null;
        user.otpExpire = null;
      }
      await user.save();

      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Invalid verification code. You have ${remaining} attempts remaining.`
          : "Too many failed attempts. Verification code has been invalidated. Please request a new OTP.",
      });
    }

    // Success: Verify user and clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// RESEND REGISTER OTP CONTROLLER
const resendRegisterOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    // Enforce 60-second cooldown on resends
    if (user.otpLastSent && Date.now() - user.otpLastSent.getTime() < 60 * 1000) {
      const timeRemaining = Math.ceil((60 * 1000 - (Date.now() - user.otpLastSent.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${timeRemaining} seconds before requesting another code.`,
      });
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpLastSent = Date.now();

    // Attempt email send before saving
    try {
      await sendVerificationEmail(email, user.name, otp);
    } catch (mailErr) {
      console.error("Email delivery failed on resend:", mailErr);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please check your email configuration.",
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Verification code resent successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    // Verify account activation status
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
    const token = jwt.sign(
      {
        id: user._id,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("vercel.app"));

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction ? true : false,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
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
    console.log(error);
    res.status(500).json({
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
      secure: isProduction ? true : false,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// PASSWORD RESET CONTROLLER - FORGOT
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendMailHelper({
        to: email,
        subject: "Seemz Password Reset OTP",
        text: `
Hello ${user.name},

We received a request to reset your Seemz account password.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Seemz Atelier
`,
        actionName: "forgot_password",
      });
    } catch (error) {
      console.error(`[OTP] Forgot password email error:`, error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please check server email configuration or try again.",
      });
    }

    console.log(`[OTP] Response sent: 200 OK for ${email}`);
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(`[OTP] Unhandled error in forgotPassword:`, error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// VERIFY AND RESET CONTROLLER
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or session expired",
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
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