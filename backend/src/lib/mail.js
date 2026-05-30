import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const escapeHtml = (value = "") =>
  value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getBooleanEnv = (value) => ["true", "1", "yes"].includes(value);

const getMailConfig = () => {
  // const smtpHost = process.env.SMTP_HOST || "";
  // const smtpPort = Number(process.env.SMTP_PORT || 587);
  // const smtpUser = process.env.SMTP_USER || process.env.ADMIN_EMAIL;
  // const smtpPass = process.env.SMTP_PASS || process.env.ADMIN_EMAIL_SECRET_KEY;

  // if (smtpHost) {
  //   return {
  //     host: smtpHost,
  //     port: smtpPort,
  //     secure: getBooleanEnv(process.env.SMTP_SECURE || ""),
  //     auth: {
  //       user: smtpUser,
  //       pass: smtpPass,
  //     },
  //   };
  // }

  return {
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_SECRET_KEY,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };  
};

const getMailFrom = () => {
  return process.env.ADMIN_EMAIL;
};

const createTransporter = () => {
  const config = getMailConfig();

  if (!config.auth?.user || !config.auth?.pass) {
    throw new Error("Mail service is missing SMTP user or password");
  }

  return nodemailer.createTransport(config);
};

export const verifyMailConnection = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
};

export const sendMail = async ({ to, subject, html, text, from }) => {
  try {
    if (!to) throw new Error("Mail recipient is required");
    if (!subject) throw new Error("Mail subject is required");
    if (!html && !text) throw new Error("Mail content is required");

    const transporter = createTransporter();

    return transporter.sendMail({
      from: getMailFrom(),
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.log("Mail sending Error:", error);
    throw error;
  }
};

export const sendOtpMail = async ({
  to,
  otp,
  purpose = "signup_verify",
  expiresInMinutes = 5,
}) => {
  if (!to) throw new Error("OTP recipient is required");
  if (!otp) throw new Error("OTP is required");

  const label = purpose;
  const safeOtp = escapeHtml(otp);
  const safeLabel = escapeHtml(label);
  const safeMinutes = escapeHtml(expiresInMinutes);

  return sendMail({
    to,
    subject: `Kapota ${safeLabel} code`,
    text: `Your Kapota ${label} code is ${otp}. It expires in ${safeMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111827;">
        <h2 style="margin-bottom: 8px;">Kapota ${safeLabel}</h2>
        <p style="font-size: 15px; line-height: 1.6;">Use this code to continue:</p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; padding: 16px 18px; background: #f3f4f6; border-radius: 12px; display: inline-block;">
          ${safeOtp}
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
          This code expires in ${safeMinutes} minutes. If you did not request this, you can ignore this email.
        </p>
      </div>
    `,
  });
};
