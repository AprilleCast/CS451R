const dashboardService = require("../services/dashboardService");

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await dashboardService.getSummary(userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const trend = await dashboardService.getTrend(userId);
    res.json(trend);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getTrend,
};