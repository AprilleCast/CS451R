const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required.")
      .isLength({ max: 100 }).withMessage("Name must be at most 100 characters."),
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required.")
      .isEmail().withMessage("Invalid email format.")
      .normalizeEmail(),

    body("password")
      .notEmpty().withMessage("Password is required.")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
      .matches(/[0-9]/).withMessage("Password must contain at least one number."),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required.")
      .isEmail().withMessage("Invalid email format.")
      .normalizeEmail(),

    body("password")
      .notEmpty().withMessage("Password is required."),
  ],
  authController.login
);

module.exports = router;