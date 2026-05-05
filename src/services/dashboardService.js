const dashboardRepository = require("../repositories/dashboardRepository");

const getSummary = async (userId, filters = {}) => {
  const totalSpent = await dashboardRepository.getTotalSpent(userId, filters);
  const spendingByCategory = await dashboardRepository.getSpendingByCategory(userId, filters);
  const recentTransactions = await dashboardRepository.getRecentTransactions(userId, filters);

  return {
    totalSpent,
    spendingByCategory,
    recentTransactions,
  };
};

const getTrend = async (userId, filters = {}) => {
  return dashboardRepository.getSpendingTrend(userId, filters);
};

module.exports = {
  getSummary,
  getTrend,
};
