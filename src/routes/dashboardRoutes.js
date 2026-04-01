const express = require("express");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/health/db", dashboardController.checkDbHealth);
router.get("/api/dashboard/summary", dashboardController.getDashboardSummary);

module.exports = router;