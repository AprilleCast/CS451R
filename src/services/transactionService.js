const transactionRepository = require("../repositories/transactionRepository");

const getAllTransactions = async (userId) => {
  return transactionRepository.getAllByUser(userId);
};

const addTransaction = async (userId, payload) => {
  const txnDate = payload.txn_date;
  const category = String(payload.category || "").trim();
  const amount = Number(payload.amount);

  if (!txnDate || !category || !Number.isFinite(amount)) {
    const error = new Error("Date, category, and amount are required.");
    error.statusCode = 422;
    throw error;
  }
  if (category.length < 2 || category.length > 100) {
    const error = new Error("Category must be between 2 and 100 characters.");
    error.statusCode = 422;
    throw error;
  }

  return transactionRepository.addTransaction(userId, {
    txnDate,
    category,
    description: payload.description,
    amount,
  });
};
const deleteTransaction = async (transactionId, userId) => {
  return transactionRepository.deleteTransaction(transactionId, userId);
};
const updateTransaction = async (userId, txnId, data) => {
  return await transactionRepository.updateTransaction(userId, txnId, data);
};

module.exports = {
  getAllTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
};
