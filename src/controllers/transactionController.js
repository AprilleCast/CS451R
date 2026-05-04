const { validationResult } = require("express-validator");
const transactionService = require("../services/transactionService");

const getAllTransactions = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const rows = await transactionService.getAllTransactions(userId);
    return res.status(200).json({ transactions: rows });
  } catch (error) {
    return next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const created = await transactionService.addTransaction(userId, req.body);
    return res.status(201).json({ success: true, id: created.id });
  } catch (error) {
    return next(error);
  }
};
const deleteTransaction = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const deleted = await transactionService.deleteTransaction(transactionId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const txnId = req.params.id;

    await transactionService.updateTransaction(userId, txnId, req.body);

    return res.status(200).json({
      success: true,
      message: "Transaction updated",
    });
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  getAllTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
};
