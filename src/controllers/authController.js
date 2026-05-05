const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const logger = require("../config/logger");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: "Validation failed.", errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    return res.status(201).json({ success: true, message: "Registration successful.", data: result });
  } catch (error) {
    logger.error("Register controller error", { error: error.message });
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: "Validation failed.", errors: errors.array() });
    }
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.status(200).json({ success: true, message: "Login successful.", data: result });
  } catch (error) {
    logger.error("Login controller error", { error: error.message });
    next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: "Validation failed.", errors: errors.array() });
    }
    await authService.forgotPassword({ email: req.body.email });
    // Always return the same message — a security best practice
    return res.status(200).json({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    });
  } catch (error) {
    logger.error("Forgot password controller error", { error: error.message });
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: "Validation failed.", errors: errors.array() });
    }
    const { token, newPassword } = req.body;
    await authService.resetPassword({ token, newPassword });
    return res.status(200).json({ success: true, message: "Password reset successful. Please login." });
  } catch (error) {
    logger.error("Reset password controller error", { error: error.message });
    next(error);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };