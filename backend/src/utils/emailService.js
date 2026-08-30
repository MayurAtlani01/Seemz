const nodemailer = require("nodemailer");

// Safe email address masking for logs (e.g., client@domain.com -> c****t@domain.com)
const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "unknown";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

// Safe error sanitizer (strips passwords, tokens, API keys from log/error output)
const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== "string") return "Unknown error";
  return msg
    .replace(/(password|pass|secret|key|token|auth)=[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/[a-zA-Z0-9_-]{24,}/g, "[REDACTED_SECRET]");
};

// SMTP Configuration
const getSmtpConfig = () => {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const user = (
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL ||
    ""
  ).trim();

  const pass = (
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    ""
  ).trim();

  const from = (
    process.env.EMAIL_FROM ||
    `"Seemz Atelier" <${user || "noreply@seemz.com"}>`
  ).trim();

  return { host, port, secure, user, pass, from };
};

// Single Transporter instance initialized at module load
let transporterInstance = null;

const getTransporter = () => {
  if (!transporterInstance) {
    const { host, port, secure, user, pass } = getSmtpConfig();

    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
        servername: host,
      },
    });
  }
  return transporterInstance;
};

// Verify SMTP Connection (called on backend startup)
const verifySmtpConnection = async () => {
  const { host, port, user } = getSmtpConfig();
  console.log(`[EMAIL] SMTP transporter initialized (Host: ${host}:${port}, User: ${maskEmail(user)})`);

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[EMAIL] SMTP connection verified successfully");
    return true;
  } catch (err) {
    const safeError = sanitizeErrorMessage(err.message || err.code || "Connection failed");
    console.warn(`[EMAIL] SMTP connection check warning: ${safeError}`);
    return false;
  }
};

// Central Send Function
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || typeof to !== "string") {
    throw new Error("Recipient email is required");
  }

  const { from } = getSmtpConfig();
  const maskedRecipient = maskEmail(to.trim());
  const transporter = getTransporter();

  console.log(`[EMAIL] Sending email to ${maskedRecipient} (Subject: "${subject}")`);

  try {
    const info = await transporter.sendMail({
      from,
      to: to.trim(),
      subject,
      text,
      html: html || undefined,
    });

    console.log(`[EMAIL] Email delivered successfully to ${maskedRecipient} (Message ID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const safeError = sanitizeErrorMessage(err.message || err.code || "SMTP delivery error");
    console.error(`[EMAIL] Email delivery failed to ${maskedRecipient}: ${safeError}`);
    throw new Error(safeError);
  }
};

// HTML OTP Template Generator
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
  verifySmtpConnection,
  generateOtpEmailHtml,
  maskEmail,
  getSmtpConfig,
};
