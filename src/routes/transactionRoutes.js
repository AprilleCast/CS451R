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
    body("txn_date").notEmpty().isISO8601(),
    body("category").trim().notEmpty(),
    body("amount").notEmpty().isFloat(),
  ],
  transactionController.createTransaction
);

// 🔥 MUST EXIST
router.put(
  "/update/:id",
  [
    body("txn_date").notEmpty().isISO8601(),
    body("category").trim().notEmpty(),
    body("amount").notEmpty().isFloat(),
  ],
  transactionController.updateTransaction
);

router.delete("/:id", transactionController.deleteTransaction);

module.exports = router;