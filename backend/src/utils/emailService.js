const nodemailer = require("nodemailer");
const https = require("https");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

// Safe email address masking for logs (e.g., client@domain.com -> c****t@domain.com)
const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "unknown";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

// STRATEGY 1: Resend HTTPS REST API (Port 443 - Immune to cloud SMTP port blocks)
const sendViaResend = ({ apiKey, fromEmail, toEmail, subject, text, html }) => {
  return new Promise((resolve, reject) => {
    const sender = fromEmail || process.env.EMAIL_FROM || process.env.RESEND_FROM || "Seemz Atelier <onboarding@resend.dev>";
    const payload = JSON.stringify({
      from: sender,
      to: [toEmail],
      subject,
      text,
      html: html || undefined,
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
          resolve({ provider: "Resend HTTPS API", statusCode: res.statusCode });
        } else {
          let errorMsg = `HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(data);
            errorMsg = parsed.message || parsed.name || errorMsg;
          } catch {
            errorMsg = data.substring(0, 150) || errorMsg;
          }
          reject(new Error(`Resend API Error (${errorMsg})`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Resend HTTPS API request timed out (7000ms)"));
    });

    req.write(payload);
    req.end();
  });
};

// STRATEGY 2: Brevo / Sendinblue HTTPS REST API (Port 443 - 300 free emails/day)
const sendViaBrevo = ({ apiKey, fromEmail, toEmail, subject, text, html }) => {
  return new Promise((resolve, reject) => {
    const senderEmail = fromEmail || process.env.EMAIL_FROM || process.env.EMAIL_USER || "seemzatelier@gmail.com";
    const payload = JSON.stringify({
      sender: { name: "Seemz Atelier", email: senderEmail },
      to: [{ email: toEmail }],
      subject,
      textContent: text,
      htmlContent: html || undefined,
    });

    const options = {
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey.trim(),
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
          resolve({ provider: "Brevo HTTPS API", statusCode: res.statusCode });
        } else {
          let errorMsg = `HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(data);
            errorMsg = parsed.message || errorMsg;
          } catch {
            errorMsg = data.substring(0, 150) || errorMsg;
          }
          reject(new Error(`Brevo API Error (${errorMsg})`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Brevo HTTPS API request timed out (7000ms)"));
    });

    req.write(payload);
    req.end();
  });
};

// STRATEGY 3: Custom or Standard SMTP Transport (Nodemailer for localhost)
const sendViaNodemailer = async ({
  host,
  port,
  secure,
  service,
  user,
  pass,
  to,
  subject,
  text,
  html
}) => {
  const transportOpts = service
    ? {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        family: 4,
        auth: { user, pass },
        connectionTimeout: 6500,
        greetingTimeout: 6500,
        socketTimeout: 6500,
        tls: {
          rejectUnauthorized: false,
          servername: "smtp.gmail.com",
        },
      }
    : {
        host,
        port,
        secure,
        family: 4,
        auth: { user, pass },
        connectionTimeout: 6500,
        greetingTimeout: 6500,
        socketTimeout: 6500,
        tls: {
          rejectUnauthorized: false,
        },
      };

  const transporter = nodemailer.createTransport(transportOpts);

  const info = await transporter.sendMail({
    from: `"Seemz Atelier" <${user}>`,
    to,
    subject,
    text,
    html: html || undefined,
  });

  return {
    provider: service || `${host}:${port}`,
    messageId: info.messageId,
  };
};

// MAIN RESILIENT DISPATCHER
const sendEmail = async ({ to, subject, text, html, actionName = "OTP" }) => {
  const maskedTo = maskEmail(to);

  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "").trim();
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

  // Diagnostic check
  const hasHttpProvider = Boolean(resendApiKey || brevoApiKey);
  const hasSmtpProvider = Boolean((smtpHost && smtpUser && smtpPass) || (smtpUser && smtpPass));

  if (!hasHttpProvider && !hasSmtpProvider) {
    const errorMsg = "No email configuration found on server. Configure RESEND_API_KEY, BREVO_API_KEY, or EMAIL_USER/EMAIL_PASS.";
    console.error(`[OTP] Email delivery failed: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Delivery function executing configured strategies
  const executeDelivery = async () => {
    // 1. Resend REST API (HTTPS port 443 - highest priority for cloud environments)
    if (resendApiKey) {
      console.log(`[OTP] Email delivery started (Provider: Resend HTTPS API, Recipient: ${maskedTo})`);
      const result = await sendViaResend({ apiKey: resendApiKey, toEmail: to, subject, text, html });
      console.log(`[OTP] Email delivery completed successfully via ${result.provider}`);
      return result;
    }

    // 2. Brevo REST API (HTTPS port 443)
    if (brevoApiKey) {
      console.log(`[OTP] Email delivery started (Provider: Brevo HTTPS API, Recipient: ${maskedTo})`);
      const result = await sendViaBrevo({ apiKey: brevoApiKey, toEmail: to, subject, text, html });
      console.log(`[OTP] Email delivery completed successfully via ${result.provider}`);
      return result;
    }

    // 3. Custom SMTP Server (if configured)
    if (smtpHost && smtpUser && smtpPass) {
      console.log(`[OTP] Email delivery started (Provider: Custom SMTP ${smtpHost}:${smtpPort}, Recipient: ${maskedTo})`);
      const result = await sendViaNodemailer({ host: smtpHost, port: smtpPort, secure: smtpSecure, user: smtpUser, pass: smtpPass, to, subject, text, html });
      console.log(`[OTP] Email delivery completed successfully via Custom SMTP`);
      return result;
    }

    // 4. Standard Gmail SMTP (localhost fallback)
    if (smtpUser && smtpPass) {
      console.log(`[OTP] Email delivery started (Provider: Gmail SMTP, Recipient: ${maskedTo})`);
      const result = await sendViaNodemailer({ service: "gmail", user: smtpUser, pass: smtpPass, to, subject, text, html });
      console.log(`[OTP] Email delivery completed successfully via Gmail SMTP`);
      return result;
    }

    throw new Error("No configured email transports available.");
  };

  // Hard timeout guard (8000ms max) ensuring request NEVER hangs
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Email delivery timed out after 8000ms."));
    }, 8000);
  });

  return await Promise.race([executeDelivery(), timeoutPromise]);
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
