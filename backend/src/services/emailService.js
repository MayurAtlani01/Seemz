const nodemailer = require("nodemailer");

// Safe email address masking for logs (e.g., client@domain.com -> c***t@domain.com)
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
    .replace(/re_[a-zA-Z0-9_-]{20,}/g, "[REDACTED_KEY]")
    .replace(/[a-zA-Z0-9_-]{28,}/g, "[REDACTED_SECRET]");
};

// Standardized email configuration from environment variables
const getEmailConfig = () => {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.EMAIL_PORT) || 465;
  const user = (process.env.EMAIL_USER || "").trim();
  // Strip any accidental whitespace copied from Google App Password (e.g. "abcd efgh ijkl mnop")
  const pass = (process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");
  const from = (process.env.EMAIL_FROM || (user ? `SEEMZ <${user}>` : "SEEMZ <no-reply@seemz.com>")).trim();

  return {
    host,
    port,
    user,
    pass,
    from,
    provider: "Nodemailer SMTP",
    isConfigured: Boolean(user && pass),
  };
};

// Transporter singleton instance
let transporterInstance = null;

const createTransporterInstance = () => {
  const { host, port, user, pass, isConfigured } = getEmailConfig();

  if (!isConfigured) {
    throw new Error("EMAIL_USER and EMAIL_PASS are not configured on the server. Please check your environment variables in your deployment dashboard.");
  }

  const isGmail = host.includes("gmail.com") || (!process.env.EMAIL_HOST && user.includes("@gmail.com"));

  if (isGmail) {
    // Cloud-optimized Gmail transport
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10s connection timeout guard
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  // Generic SMTP transport with direct SSL or STARTTLS
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const getTransporter = () => {
  if (!transporterInstance) {
    transporterInstance = createTransporterInstance();
  }
  return transporterInstance;
};

// Non-blocking Transporter Verification at Server Startup
const verifyEmailConfig = async () => {
  const { isConfigured, host, port, user, from, provider } = getEmailConfig();

  if (!isConfigured) {
    console.warn(`[EMAIL] WARNING: EMAIL_USER or EMAIL_PASS is not configured in environment variables. Email delivery will fail until SMTP credentials are provided.`);
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`[EMAIL] ${provider} initialized (Host: ${host}:${port}, User: "${maskEmail(user)}", Sender: "${from}", Status: READY)`);
    return true;
  } catch (err) {
    const safeError = sanitizeErrorMessage(err.message || "Transporter verification failed");
    console.error(`[EMAIL] WARNING: SMTP Transporter verification failed at startup: ${safeError}`);
    // Reset transporter instance so next attempt creates fresh connection
    transporterInstance = null;
    return false;
  }
};

// Central Send Function using Nodemailer
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || typeof to !== "string") {
    throw new Error("Recipient email is required");
  }

  const { from, isConfigured, provider } = getEmailConfig();
  if (!isConfigured) {
    throw new Error("Email service is not configured on the server. Please verify EMAIL_USER and EMAIL_PASS.");
  }

  const normalizedTo = to.trim();
  const maskedRecipient = maskEmail(normalizedTo);

  console.log(`[EMAIL] Dispatching email to ${maskedRecipient} via ${provider} (Subject: "${subject}")`);

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: normalizedTo,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    console.log(`[EMAIL] Email delivered successfully to ${maskedRecipient} (Message ID: ${info.messageId || "N/A"})`);
    return {
      success: true,
      messageId: info.messageId,
      provider,
    };
  } catch (err) {
    // Reset transporter on error to clear any dead socket
    transporterInstance = null;
    const safeError = sanitizeErrorMessage(err.message || "Email delivery failed");
    console.error(`[EMAIL] Email dispatch failed to ${maskedRecipient}: ${safeError}`);
    throw new Error(safeError);
  }
};

// Helper: Context messages based on authentication action
const getEmailContext = (purpose = "") => {
  const normalized = (purpose || "").toLowerCase();

  if (normalized.includes("password") || normalized.includes("reset")) {
    return {
      subheading: "SECURITY VERIFICATION",
      lead: "We received a request to reset your SEEMZ account password.",
      instruction: "Use the verification code below to proceed.",
    };
  }

  if (normalized.includes("resend")) {
    return {
      subheading: "SECURITY VERIFICATION",
      lead: "We received a request for a new verification code for your SEEMZ account.",
      instruction: "Use the verification code below to continue.",
    };
  }

  if (normalized.includes("registration") || normalized.includes("register")) {
    return {
      subheading: "SECURITY VERIFICATION",
      lead: "We received a request to verify your SEEMZ account.",
      instruction: "Use the verification code below to complete your registration.",
    };
  }

  return {
    subheading: "SECURITY VERIFICATION",
    lead: "We received a request to verify your SEEMZ account.",
    instruction: "Use the verification code below to continue.",
  };
};

// Premium SEEMZ Atelier HTML OTP Template Generator
const generateOtpEmailHtml = ({ name, otp, purpose = "account verification" }) => {
  const recipientName = (name && typeof name === "string" && name.trim()) ? name.trim() : "Valued Client";
  const context = getEmailContext(purpose);
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>SEEMZ Atelier Verification</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .outer-container { padding: 20px 12px !important; }
      .card-table { padding: 32px 20px !important; }
      .brand-title { font-size: 19px !important; letter-spacing: 4px !important; }
      .otp-digits { font-size: 32px !important; letter-spacing: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text hidden in inbox previews -->
  <div style="display: none; font-size: 1px; color: #080808; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your SEEMZ verification code is ${otp}. Valid for 10 minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #080808; width: 100%;">
    <tr>
      <td align="center" class="outer-container" style="padding: 48px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="520">
        <tr>
        <td align="center" valign="top" width="520">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-table" role="presentation" style="max-width: 520px; background-color: #121212; border: 1px solid #242424; border-radius: 6px; margin: 0 auto; box-sizing: border-box;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 44px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center">
                    <div class="brand-title" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 21px; font-weight: 600; letter-spacing: 5px; color: #ffffff; text-transform: uppercase; line-height: 1.2; text-align: center;">
                      SEEMZ ATELIER
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 2.5px; color: #737373; text-transform: uppercase; margin-top: 8px; text-align: center;">
                      ${context.subheading}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding: 24px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #222222; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td align="center" style="padding: 28px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="font-size: 15px; font-weight: 500; color: #e5e5e5; margin-bottom: 12px; line-height: 1.4; text-align: center;">
                      Hello ${recipientName},
                    </div>
                    <div style="font-size: 14px; line-height: 1.6; color: #a3a3a3; max-width: 400px; margin: 0 auto; text-align: center;">
                      ${context.lead}<br />
                      ${context.instruction}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- OTP Container -->
          <tr>
            <td align="center" style="padding: 30px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 380px; background-color: #181818; border: 1px solid #2a2a2a; border-radius: 4px; margin: 0 auto;">
                <tr>
                  <td align="center" style="padding: 22px 16px;">
                    <div class="otp-digits" style="font-family: 'Courier New', Courier, Consolas, monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #ffffff; line-height: 1; text-align: center; padding-left: 10px;">
                      ${otp}
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11.5px; letter-spacing: 0.5px; color: #737373; margin-top: 10px; text-align: center;">
                      Valid for 10 minutes
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td align="center" style="padding: 22px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #666666; text-align: center;">
                    For your security, never share this code with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding: 28px 36px 0 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #222222; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 36px 40px 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="font-size: 11px; line-height: 1.6; color: #525252; margin-bottom: 6px; text-align: center;">
                      If you did not request this code, you can safely ignore this email.
                    </div>
                    <div style="font-size: 11px; color: #404040; text-align: center;">
                      &copy; ${currentYear} SEEMZ Atelier. All rights reserved.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  generateOtpEmailHtml,
  maskEmail,
  getEmailConfig,
};
