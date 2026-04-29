const express = require("express");
const { body, param } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const budgetController = require("../controllers/budgetController");

const router = express.Router();

const budgetValidation = [
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters."),
  body("limitAmount")
    .notEmpty()
    .withMessage("Spending limit is required.")
    .isFloat({ gt: 0 })
    .withMessage("Spending limit must be greater than 0."),
  body("timeframe")
    .trim()
    .isIn(["weekly", "monthly", "custom"])
    .withMessage("Timeframe must be weekly, monthly, or custom."),
  body("startDate").optional({ nullable: true }).isISO8601().withMessage("startDate must be a valid date."),
  body("endDate").optional({ nullable: true }).isISO8601().withMessage("endDate must be a valid date."),
];

router.use(authMiddleware);

router.post("/", budgetValidation, budgetController.createBudget);
router.get("/", budgetController.getBudgets);
router.put(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("Budget id must be a positive integer."), ...budgetValidation],
  budgetController.updateBudget
);
router.delete(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("Budget id must be a positive integer.")],
  budgetController.deleteBudget
);

module.exports = router;
