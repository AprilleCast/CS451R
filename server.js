const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const dotenv = require("dotenv");

// Environment variables load
dotenv.config();

// DB connection initialize
require("./src/config/db");

// Routes
const authRoutes = require("./src/routes/authRoutes");

// Middleware
const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

// Security Middleware
// HTTP headers secure
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body Parser
app.use(express.json({ limit: "10kb" }));  // 10kb limit — large payload attack prevent
app.use(express.urlencoded({ extended: true }));

// Static Files (Frontend HTML)
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRoutes);

// Catch-all: SPA fallback
app.get("/{*splat}", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
  } else {
    res.status(404).json({ success: false, message: "Route not found." });
  }
});

// Global Error Handler
app.use(errorMiddleware);

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;