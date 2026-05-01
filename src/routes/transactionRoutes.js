const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const transactionController = require("../controllers/transactionController");

const router = express.Router();

router.use(authMiddleware);

router.get("/all", transactionController.getAllTransactions);
router.post(
  "/add",
  [
    body("txn_date").notEmpty().withMessage("Date is required.").isISO8601().withMessage("Date must be valid."),
    body("category").trim().notEmpty().withMessage("Category is required."),
    body("amount").notEmpty().withMessage("Amount is required.").isFloat().withMessage("Amount must be numeric."),
  ],
  transactionController.createTransaction
);
router.delete("/:id", transactionController.deleteTransaction);

module.exports = router;
