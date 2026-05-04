const dashboardRepository = require("../repositories/dashboardRepository");

const getSummary = async (userId) => {
  const totalSpent = await dashboardRepository.getTotalSpent(userId);
  const spendingByCategory = await dashboardRepository.getSpendingByCategory(userId);
  const recentTransactions = await dashboardRepository.getRecentTransactions(userId);

  return {
    totalSpent,
    spendingByCategory,
    recentTransactions,
  };
};

const getTrend = async (userId) => {
  return dashboardRepository.getSpendingTrend(userId);
};

module.exports = {
  getSummary,
  getTrend,
};