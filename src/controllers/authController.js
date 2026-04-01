const { validationResult } = require("express-validator");
const authService = require("../services/authService");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    // Validation errors check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: result,
    });
  } catch (error) {
    next(error); // Call Global error handler
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { register, login };