const dashboardService = require("../services/dashboardService");

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };
    const summary = await dashboardService.getSummary(userId, filters);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };
    const trend = await dashboardService.getTrend(userId, filters);
    res.json(trend);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getTrend,
};
