const dashboardRepository = require("../repositories/dashboardRepository");

const checkDbHealth = async () => {
  return await dashboardRepository.checkDbHealth();
};

const getDashboardSummary = async () => {
  const total = await dashboardRepository.getTotalSpent();
  const byCategory = await dashboardRepository.getSpendingByCategory();
  const recent = await dashboardRepository.getRecentTransactions();

  const totalSpent = Number(total.total_spent);

  const spendingByCategory = byCategory.map((row) => ({
    category: row.category,
    total: Number(row.total),
  }));

  const recentTransactions = recent.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));

  return {
    totalSpent,
    spendingByCategory,
    recentTransactions,
  };
};

module.exports = {
  checkDbHealth,
  getDashboardSummary,
};