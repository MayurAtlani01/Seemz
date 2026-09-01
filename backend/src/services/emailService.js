const { Resend } = require("resend");

// Safe email address masking for logs (e.g., client@domain.com -> c****t@domain.com)
const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "unknown";
  const [local, domain] = email.trim().split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

// Safe error sanitizer (strips passwords, tokens, API keys from log/error output)
const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== "string") return "Unknown error";
  return msg
    .replace(/(password|pass|secret|key|token|auth|bearer)=[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/re_[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/[a-zA-Z0-9_-]{28,}/g, "[REDACTED_SECRET]");
};

// Get standardized email configuration
const getEmailConfig = () => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.EMAIL_FROM || "Seemz Atelier <onboarding@resend.dev>").trim();

  return {
    apiKey,
    from,
    provider: "Resend HTTPS API",
    isConfigured: Boolean(apiKey),
  };
};

// Resend client instance singleton
let resendClientInstance = null;

const getResendClient = () => {
  const { apiKey } = getEmailConfig();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured on the server. Please set RESEND_API_KEY.");
  }
  if (!resendClientInstance) {
    resendClientInstance = new Resend(apiKey);
  }
  return resendClientInstance;
};

// Startup email service configuration check
const verifyEmailConfig = async () => {
  const { isConfigured, from, provider } = getEmailConfig();
  if (isConfigured) {
    console.log(`[EMAIL] ${provider} initialized (Sender: "${from}", Status: READY)`);
    return true;
  } else {
    console.warn(`[EMAIL] WARNING: RESEND_API_KEY is not configured in environment variables. Email delivery will fail until RESEND_API_KEY is provided.`);
    return false;
  }
};

// Central Send Function using Resend HTTPS API (Port 443)
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || typeof to !== "string") {
    throw new Error("Recipient email is required");
  }

  const { from, provider } = getEmailConfig();
  const normalizedTo = to.trim();
  const maskedRecipient = maskEmail(normalizedTo);

  console.log(`[EMAIL] Sending email to ${maskedRecipient} via ${provider} (Subject: "${subject}")`);

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to: [normalizedTo],
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    if (error) {
      const sanitizedError = sanitizeErrorMessage(error.message || JSON.stringify(error));
      console.error(`[EMAIL] Resend delivery error for ${maskedRecipient}: ${sanitizedError}`);
      throw new Error(sanitizedError);
    }

    console.log(`[EMAIL] Email delivered successfully to ${maskedRecipient} (Message ID: ${data?.id || "N/A"})`);
    return {
      success: true,
      messageId: data?.id,
      provider,
    };
  } catch (err) {
    const safeError = sanitizeErrorMessage(err.message || "Email delivery failed");
    console.error(`[EMAIL] Email dispatch failed to ${maskedRecipient}: ${safeError}`);
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
  verifyEmailConfig,
  generateOtpEmailHtml,
  maskEmail,
  getEmailConfig,
};
