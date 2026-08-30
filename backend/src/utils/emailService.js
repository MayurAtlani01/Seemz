const nodemailer = require("nodemailer");
const dns = require("dns");

// Explicitly prefer IPv4 to prevent IPv6 ENETUNREACH on cloud container networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore in environments where setDefaultResultOrder is unavailable
}

// Safe email address masking for logs (e.g., client@domain.com -> c****t@domain.com)
const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "unknown";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

// Safe error sanitizer (removes any sensitive values from error messages)
const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== "string") return "Unknown error";
  return msg
    .replace(/(password|pass|secret|key|token|auth)=[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/[a-zA-Z0-9_-]{24,}/g, "[REDACTED_SECRET]");
};

// CREATE CENTRALIZED GMAIL SMTP TRANSPORTER
const createGmailTransporter = () => {
  const user = (
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL ||
    ""
  ).trim();

  const pass = (
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    ""
  ).trim();

  if (!user || !pass) {
    throw new Error("Gmail SMTP credentials missing. Please set EMAIL_USER and EMAIL_PASS (Google App Password).");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4, // Explicitly force IPv4
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
      servername: "smtp.gmail.com",
    },
  });
};

// MAIN RESILIENT DISPATCHER (Nodemailer + Gmail SMTP)
const sendEmail = async ({ to, subject, text, html, actionName = "OTP" }) => {
  const maskedTo = maskEmail(to);
  const user = (
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL ||
    ""
  ).trim();

  console.log(`[OTP] Email delivery started (Nodemailer Gmail SMTP, Recipient: ${maskedTo})`);

  try {
    const transporter = createGmailTransporter();

    // Verify SMTP connection
    await transporter.verify();
    console.log("[OTP] Gmail SMTP connection established");

    // Send the email
    const info = await transporter.sendMail({
      from: `"Seemz Atelier" <${user}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });

    console.log(`[OTP] Email delivery completed successfully via Gmail SMTP (Message ID: ${info.messageId})`);
    return {
      provider: "Gmail SMTP (Nodemailer)",
      messageId: info.messageId,
    };
  } catch (err) {
    const isNetworkOrPortBlock =
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNREFUSED" ||
      err.code === "ESOCKETTIMEDOUT" ||
      err.code === "ENETUNREACH";

    const isAuthError = err.code === "EAUTH" || (err.response && err.response.includes("535"));

    let diagnosis = err.message || "Unknown SMTP Error";
    if (isNetworkOrPortBlock) {
      diagnosis = `Network socket error (${err.code}). Outbound SMTP port 587 or IPv4 route to Gmail failed.`;
    } else if (isAuthError) {
      diagnosis = `SMTP Authentication failed (EAUTH). Check EMAIL_USER & EMAIL_PASS (Google App Password).`;
    }

    const safeMessage = sanitizeErrorMessage(diagnosis);
    console.error(`[OTP] Gmail SMTP failed: ${safeMessage}`);
    throw new Error(safeMessage);
  }
};

// HELPER: Generate OTP HTML Template
const generateOtpEmailHtml = ({ name, otp, purpose = "account verification" }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 40px 20px; }
    .container { max-width: 500px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 8px; padding: 40px 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #ffffff; margin-bottom: 30px; text-transform: uppercase; }
    .title { font-size: 20px; font-weight: 400; color: #e5e5e5; margin-bottom: 12px; }
    .greeting { font-size: 14px; color: #888888; margin-bottom: 25px; }
    .otp-card { background-color: #1c1c1c; border: 1px solid #333333; border-radius: 6px; padding: 20px; margin: 25px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
    .expire-text { font-size: 12px; color: #888888; margin-top: 8px; }
    .footer { font-size: 11px; color: #555555; margin-top: 35px; border-top: 1px solid #222222; padding-top: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">SEEMZ ATELIER</div>
    <div class="title">Security Verification</div>
    <div class="greeting">Hello ${name || "Valued Client"}, here is your one-time code for ${purpose}:</div>
    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="expire-text">Valid for 10 minutes</div>
    </div>
    <div class="footer">
      If you did not request this verification code, please disregard this communication.<br>
      © ${new Date().getFullYear()} Seemz Atelier. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  sendEmail,
  generateOtpEmailHtml,
  maskEmail,
};
