const express = require('express');
require("dotenv").config();

const pool = require("./src/db/pool");

const app = express();

// Pretty-print JSON in responses
app.set("json spaces", 2);

// Serve static files (your transactions.html, etc.)
app.use(express.static("public"));

// Simple routes
app.get('/', (req, res) => {
  res.send('Hello from express');
});

app.get('/about', (req, res) => {
  res.send('Hello from about page');
});

// Health check for database
app.get("/health/db", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Dashboard summary endpoint
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const total = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_spent FROM transactions.transactions"
    );

    const byCategory = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM transactions.transactions
       GROUP BY category
       ORDER BY total DESC`
    );

    const recent = await pool.query(
      `SELECT id, amount, category,
              to_char(txn_date, 'YYYY-MM-DD') AS txn_date,
              description
       FROM transactions.transactions
       ORDER BY txn_date DESC, id DESC
       LIMIT 5`
    );

    const totalSpent = Number(total.rows[0].total_spent);

    const spendingByCategory = byCategory.rows.map(r => ({
      category: r.category,
      total: Number(r.total),
    }));

    const recentTransactions = recent.rows.map(r => ({
      ...r,
      amount: Number(r.amount),
    }));

    res.json({
      totalSpent,
      spendingByCategory,
      recentTransactions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Fetch all transactions endpoint
app.get("/api/transactions/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, amount, category,
              to_char(txn_date, 'YYYY-MM-DD') AS txn_date,
              description
       FROM transactions.transactions
       ORDER BY txn_date DESC, id DESC`
    );

    // Return in the structure your frontend expects
    res.json({ transactions: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});