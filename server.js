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
const budgetRoutes = require("./src/routes/budgetRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");

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
app.use("/api/budgets", budgetRoutes);
app.use("/api/transactions", transactionRoutes);

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
app.get("/api/dashboard/trend", require("./src/middleware/authMiddleware"), async (req, res) => {
  try {
    const userId = req.user.id;
    const trend = await pool.query(
      `SELECT to_char(txn_date, 'YYYY-MM-DD') AS day,
              SUM(ABS(amount)) AS total
       FROM public.transactions
       WHERE user_id = $1
       GROUP BY txn_date
       ORDER BY txn_date`,
      [userId]
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
app.get("/api/dashboard/summary", require("./src/middleware/authMiddleware"), async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS total_spent
       FROM public.transactions
       WHERE user_id = $1`,
      [userId]
    );

    const byCategory = await pool.query(
      `SELECT c.name AS category, SUM(ABS(t.amount)) AS total
       FROM public.transactions t
       LEFT JOIN public.categories c
         ON t.category = c.id
       WHERE t.user_id = $1
       GROUP BY c.name
       ORDER BY SUM(ABS(t.amount)) DESC`,
      [userId]
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
       WHERE t.user_id = $1
       ORDER BY t.txn_date DESC, t.id DESC
       LIMIT 5`,
      [userId]
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

// Auto-create database tables on startup
async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        theme_preference VARCHAR(10) NOT NULL DEFAULT 'light',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Check if 'name' column exists (fix for old schema that used 'full_name')
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
    `);
    if (colCheck.rows.length === 0) {
      // Old schema detected — try to rename full_name -> name, password_hash -> password
      try { await pool.query(`ALTER TABLE public.users RENAME COLUMN full_name TO name`); } catch (_) {}
      try { await pool.query(`ALTER TABLE public.users RENAME COLUMN password_hash TO password`); } catch (_) {}
      // If columns still don't exist, add them
      try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT ''`); } catch (_) {}
      try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT ''`); } catch (_) {}
      try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) NOT NULL DEFAULT 'light'`); } catch (_) {}
      try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`); } catch (_) {}
    }

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.transactions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        category INT REFERENCES public.categories(id) ON DELETE SET NULL,
        amount NUMERIC(12,2) NOT NULL,
        txn_date DATE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create budgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.budgets (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
        timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('weekly', 'monthly', 'custom')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes (IF NOT EXISTS handles duplicates)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, txn_date)`);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_budgets_user_category_period') THEN
          CREATE UNIQUE INDEX uq_budgets_user_category_period ON public.budgets(user_id, LOWER(name), timeframe, start_date, end_date);
        END IF;
      END $$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, start_date, end_date)`);

    console.log("Database tables initialized successfully.");
  } catch (error) {
    console.error("Database initialization error:", error.message);
    console.error("Make sure PostgreSQL is running and .env is configured correctly.");
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
