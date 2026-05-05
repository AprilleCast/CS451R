const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"BudgeIt Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Your BudgeIt Password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:2rem;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1e3a8a;margin-bottom:0.5rem;">Password Reset Request</h2>
        <p style="color:#374151;">We received a request to reset your BudgeIt account password.</p>
        <p style="color:#374151;">Click the button below to reset it. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetLink}"
          style="display:inline-block;margin:1.5rem 0;padding:0.75rem 1.5rem;
                 background:#1e3a8a;color:white;border-radius:8px;
                 text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:0.875rem;">
          If you didn't request this, please ignore this email. Your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
        <p style="color:#9ca3af;font-size:0.75rem;">BudgeIt — Personal Finance Manager</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  logger.info("Password reset email sent", { to: toEmail });
};

module.exports = { sendPasswordResetEmail };