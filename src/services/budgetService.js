const budgetRepository = require("../repositories/budgetRepository");

const createBudget = async (userId, payload) => {
  return budgetRepository.createBudget(userId, payload);
};

const getBudgets = async (userId) => {
  return budgetRepository.getBudgetsWithTracking(userId);
};

const updateBudget = async (userId, budgetId, payload) => {
  return budgetRepository.updateBudget(userId, budgetId, payload);
};

const deleteBudget = async (userId, budgetId) => {
  return budgetRepository.deleteBudget(userId, budgetId);
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
