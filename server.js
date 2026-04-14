const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Database
const pool = require("./src/db/pool");

// Routes
const authRoutes = require("./src/routes/authRoutes");

// Middleware
const errorMiddleware = require("./src/middleware/errorMiddleware");

// App settings
app.set("json spaces", 2);

// Security
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Auth API
app.use("/api/auth", authRoutes);

// Simple routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

app.get("/about", (req, res) => {
  res.send("Hello from about page");
});

// Health check
app.get("/health/db", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Dashboard trend
app.get("/api/dashboard/trend", async (req, res) => {
  try {
    const trend = await pool.query(
      `SELECT to_char(txn_date, 'YYYY-MM-DD') AS day,
              ABS(SUM(amount)) AS total
       FROM public.transactions
       WHERE amount < 0
       GROUP BY txn_date
       ORDER BY txn_date`
    );

    res.json(
      trend.rows.map((r) => ({
        day: r.day,
        total: Number(r.total),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Trend query failed" });
  }
});

// Dashboard summary
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const total = await pool.query(
      `SELECT COALESCE(ABS(SUM(amount)), 0) AS total_spent
       FROM public.transactions
       WHERE amount < 0`
    );

    const byCategory = await pool.query(
      `SELECT c.name AS category, ABS(SUM(t.amount)) AS total
       FROM public.transactions t
       LEFT JOIN public.categories c
         ON t.category = c.id
       WHERE t.amount < 0
       GROUP BY c.name
       ORDER BY ABS(SUM(t.amount)) DESC`
    );

    const recent = await pool.query(
      `SELECT t.id,
              ABS(t.amount) AS amount,
              c.name AS category,
              to_char(t.txn_date, 'YYYY-MM-DD') AS txn_date,
              t.description
       FROM public.transactions t
       LEFT JOIN public.categories c
         ON t.category = c.id
       ORDER BY t.txn_date DESC, t.id DESC
       LIMIT 5`
    );

    const totalSpent = Number(total.rows[0].total_spent);

    const spendingByCategory = byCategory.rows.map((r) => ({
      category: r.category || "Other",
      total: Number(r.total),
    }));

    const recentTransactions = recent.rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      category: r.category || "Other",
    }));

    res.json({
      totalSpent,
      spendingByCategory,
      recentTransactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// All transactions
app.get("/api/transactions/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id,
              t.amount,
              c.name AS category,
              to_char(t.txn_date, 'YYYY-MM-DD') AS txn_date,
              t.description
       FROM public.transactions t
       LEFT JOIN public.categories c
         ON t.category = c.id
       ORDER BY t.txn_date DESC, t.id DESC`
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Profile routes
app.get("/api/profile", async (req, res) => {
  try {
    const userId = 1;

    const result = await pool.query(
      `SELECT id, name, email,
              to_char(created_at, 'YYYY-MM-DD') AS created_at
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const userId = 1;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const result = await pool.query(
      `UPDATE public.users
       SET name = $1, email = $2
       WHERE id = $3
       RETURNING id, name, email,
                 to_char(created_at, 'YYYY-MM-DD') AS created_at`,
      [name, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.put("/api/profile/password", async (req, res) => {
  try {
    const userId = 1;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const userResult = await pool.query(
      `SELECT password
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const storedPassword = userResult.rows[0].password;

    if (currentPassword !== storedPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    await pool.query(
      `UPDATE public.users
       SET password = $1
       WHERE id = $2`,
      [newPassword, userId]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Catch-all for frontend pages
app.get("/{*splat}", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
  } else {
    res.status(404).json({ success: false, message: "Route not found." });
  }
});

// Global error handler
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
