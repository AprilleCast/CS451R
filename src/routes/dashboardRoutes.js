const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", authMiddleware, dashboardController.getSummary);
router.get("/trend", authMiddleware, dashboardController.getTrend);

module.exports = router;