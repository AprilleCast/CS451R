const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userRepository = require("../repositories/userRepository");
const { sendPasswordResetEmail } = require("../config/emailService");
const logger = require("../config/logger");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register
const register = async ({ name, email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = await userRepository.create({ name, email, hashedPassword });
  const token = generateToken(userId);

  logger.info("New user registered", { userId, email });
  return { token, user: { id: userId, name, email } };
};

// Login
const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    logger.warn("Login failed — email not found", { email });
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn("Login failed — wrong password", { email });
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }
  const token = generateToken(user.id);
  logger.info("User logged in", { userId: user.id, email });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
};

// Forgot Password — will send an email.
const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);

  // Security: return the same message even if the user does not exist (prevents email enumeration)
  if (!user) {
    logger.warn("Forgot password — email not found", { email });
    return;
  }

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Expires after 15 minutes
  await userRepository.saveResetToken(user.id, resetToken);
  const resetLink = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${resetToken}`;
  await sendPasswordResetEmail(email, resetLink);
  logger.info("Password reset email sent", { userId: user.id, email });
};

const resetPassword = async ({ token, newPassword }) => {
  const record = await userRepository.findResetToken(token);
  if (!record) {
    const error = new Error("Invalid or expired reset link.");
    error.statusCode = 400;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await userRepository.updatePassword(record.user_id, hashedPassword);
  await userRepository.deleteResetToken(token);
  logger.info("Password reset successful", { userId: record.user_id });
};

module.exports = { register, login, forgotPassword, resetPassword };