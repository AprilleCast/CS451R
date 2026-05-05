const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/register
router.post("/register", [
    body("name").trim()
      .notEmpty().withMessage("Name is required.")
      .isLength({ max: 100 }).withMessage("Name must be at most 100 characters."),
    body("email").trim()
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
router.post("/login",[
    body("email").trim()
      .notEmpty().withMessage("Email is required.")
      .isEmail().withMessage("Invalid email format.")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required."),
  ],
  authController.login
);

// POST /api/auth/forgot-password
router.post("/forgot-password", [
  body("email").trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email.")
    .normalizeEmail(),
], authController.forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", [
  body("token").notEmpty().withMessage("Token is required."),
  body("newPassword")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Min 8 characters.")
    .matches(/[A-Z]/).withMessage("Must contain uppercase.")
    .matches(/[0-9]/).withMessage("Must contain a number."),
], authController.resetPassword);

// DELETE /api/user/delete
router.delete("/delete", authMiddleware, async (req, res, next) => {
  try {
    const deleted = await userRepository.deleteUser(req.user.id);
    if (!deleted) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    next(err);
  }
});
module.exports = router;