const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const User = require("../models/user.model");
const { sendEmail, generateOtpEmailHtml, maskEmail } = require("../utils/emailService");

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// Generate 6-digit numeric OTP
const generateNumericOtp = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

/**
 * Send Registration OTP
 * Handles user validation, unverified record reuse, OTP generation, DB storage, and email dispatch.
 */
const sendRegistrationOtp = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw { status: 400, message: "All fields are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser && existingUser.isVerified) {
    throw { status: 400, message: "User already exists" };
  }

  const rawOtp = generateNumericOtp();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);
  const hashedPassword = await bcrypt.hash(password, 10);
  const otpExpire = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (existingUser && !existingUser.isVerified) {
    // Reuse existing unverified account record
    existingUser.name = name.trim();
    existingUser.password = hashedPassword;
    existingUser.otp = hashedOtp;
    existingUser.otpExpire = otpExpire;
    existingUser.otpAttempts = 0;
    existingUser.otpLastSent = new Date();
    await existingUser.save();
  } else {
    // Create new unverified user record
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      otp: hashedOtp,
      otpExpire,
      otpAttempts: 0,
      otpLastSent: new Date(),
    });
    await newUser.save();
  }

  // Dispatch OTP email via email service
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to Seemz - Verify Your Account",
      text: `Hello ${name.trim()},\n\nThank you for registering with Seemz Atelier.\n\nYour One-Time Password (OTP) is: ${rawOtp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\n\nRegards,\nSeemz Atelier`,
      html: generateOtpEmailHtml({
        name: name.trim(),
        otp: rawOtp,
        purpose: "account registration",
      }),
    });
  } catch (mailError) {
    console.error(`[OTP-SERVICE] Registration email dispatch failed for ${maskEmail(normalizedEmail)}: ${mailError.message}`);
    throw { status: 503, message: "Unable to send verification code. Please try again." };
  }

  return {
    success: true,
    message: "Verification code sent to your email.",
    email: normalizedEmail,
  };
};

/**
 * Verify Registration OTP
 * Validates active OTP, tracks attempts, verifies hash, activates user account.
 */
const verifyRegistrationOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    throw { status: 400, message: "Email and OTP are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw { status: 400, message: "User not found" };
  }

  if (user.isVerified) {
    throw { status: 400, message: "Account is already verified" };
  }

  if (!user.otp || !user.otpExpire) {
    throw { status: 400, message: "No active verification code found. Please request a new OTP." };
  }

  if (new Date(user.otpExpire).getTime() < Date.now()) {
    throw { status: 400, message: "Verification code has expired. Please request a new OTP." };
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw { status: 400, message: "Too many failed attempts. Verification code invalidated. Please request a new OTP." };
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.otp);

  if (!isMatch) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otp = null;
      user.otpExpire = null;
    }
    await user.save();

    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
    throw {
      status: 400,
      message: remaining > 0
        ? `Invalid verification code. You have ${remaining} attempts remaining.`
        : "Too many failed attempts. Verification code has been invalidated. Please request a new OTP.",
    };
  }

  // Activate account
  user.isVerified = true;
  user.otp = null;
  user.otpExpire = null;
  user.otpAttempts = 0;
  await user.save();

  return {
    success: true,
    message: "Account verified successfully! You are now logged in.",
    user,
  };
};

/**
 * Resend Registration OTP
 * Enforces cooldown timer, generates new OTP, updates DB, sends email.
 */
const resendRegistrationOtp = async ({ email }) => {
  if (!email) {
    throw { status: 400, message: "Email is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw { status: 400, message: "User not found" };
  }

  if (user.isVerified) {
    throw { status: 400, message: "Account is already verified" };
  }

  // Enforce 60-second cooldown
  if (user.otpLastSent && Date.now() - new Date(user.otpLastSent).getTime() < OTP_COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
    throw {
      status: 429,
      message: `Please wait ${remaining} seconds before requesting another code.`,
    };
  }

  const rawOtp = generateNumericOtp();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  user.otp = hashedOtp;
  user.otpExpire = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.otpAttempts = 0;
  user.otpLastSent = new Date();
  await user.save();

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Seemz - Your New Verification Code",
      text: `Hello ${user.name},\n\nYour new One-Time Password (OTP) is: ${rawOtp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\n\nRegards,\nSeemz Atelier`,
      html: generateOtpEmailHtml({
        name: user.name,
        otp: rawOtp,
        purpose: "account verification",
      }),
    });
  } catch (mailError) {
    console.error(`[OTP-SERVICE] Resend email dispatch failed for ${maskEmail(normalizedEmail)}: ${mailError.message}`);
    throw { status: 503, message: "Unable to send verification code. Please try again." };
  }

  return {
    success: true,
    message: "Verification code resent successfully.",
  };
};

/**
 * Send Forgot Password OTP
 * Validates user existence, generates OTP, saves in DB, dispatches email.
 */
const sendForgotPasswordOtp = async ({ email }) => {
  if (!email) {
    throw { status: 400, message: "Email is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw { status: 400, message: "User does not exist" };
  }

  const rawOtp = generateNumericOtp();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  user.otp = hashedOtp;
  user.otpExpire = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Seemz Password Reset OTP",
      text: `Hello ${user.name},\n\nWe received a request to reset your Seemz account password.\n\nYour One-Time Password (OTP) is: ${rawOtp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nSeemz Atelier`,
      html: generateOtpEmailHtml({
        name: user.name,
        otp: rawOtp,
        purpose: "password reset",
      }),
    });
  } catch (mailError) {
    console.error(`[OTP-SERVICE] Forgot password email dispatch failed for ${maskEmail(normalizedEmail)}: ${mailError.message}`);
    throw { status: 503, message: "Unable to send verification code. Please try again." };
  }

  return {
    success: true,
    message: "Verification code sent to your email.",
  };
};

/**
 * Verify OTP and Reset Password
 * Verifies reset OTP, hashes new password, updates DB.
 */
const verifyAndResetPassword = async ({ email, otp, newPassword }) => {
  if (!email || !otp || !newPassword) {
    throw { status: 400, message: "All fields are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw { status: 400, message: "User does not exist" };
  }

  if (!user.otp || !user.otpExpire) {
    throw { status: 400, message: "Invalid OTP or session expired" };
  }

  if (new Date(user.otpExpire).getTime() < Date.now()) {
    throw { status: 400, message: "Verification code has expired. Please request a new one." };
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.otp);
  if (!isMatch) {
    throw { status: 400, message: "Invalid verification code" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpire = null;
  await user.save();

  return {
    success: true,
    message: "Password Reset Successfully",
  };
};

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  sendForgotPasswordOtp,
  verifyAndResetPassword,
};
