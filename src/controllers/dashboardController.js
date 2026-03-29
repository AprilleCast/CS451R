
const dashboardService = require("../services/dashboardService");

const checkDbHealth = async (req, res) => {
  try {
    const result = await dashboardService.checkDbHealth();
    res.json(result);
  } catch (error) {
    console.error("Controller error in checkDbHealth:", error);
    res.status(500).json({ error: "Database health check failed" });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error("Controller error in getDashboardSummary:", error);
    res.status(500).json({ error: "Database query failed" });
  }
};

module.exports = {
  checkDbHealth,
  getDashboardSummary,
};