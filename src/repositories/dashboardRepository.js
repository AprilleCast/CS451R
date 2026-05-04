const pool = require("../db/pool");

const getTotalSpent = async (userId) => {
  const result = await pool.query(
    `SELECT COALESCE(ABS(SUM(t.amount)), 0) AS total_spent
     FROM public.transactions t
     LEFT JOIN public.categories c
       ON t.category = c.id
     WHERE t.user_id = $1
       AND t.amount < 0
       AND LOWER(c.name) <> 'income'`,
    [userId]
  );

  return Number(result.rows[0].total_spent);
};

const getSpendingByCategory = async (userId) => {
  const result = await pool.query(
    `SELECT c.name AS category, ABS(SUM(t.amount)) AS total
     FROM public.transactions t
     LEFT JOIN public.categories c
       ON t.category = c.id
     WHERE t.user_id = $1
       AND t.amount < 0
       AND LOWER(c.name) <> 'income'
     GROUP BY c.name
     ORDER BY ABS(SUM(t.amount)) DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    category: row.category || "Other",
    total: Number(row.total),
  }));
};

const getRecentTransactions = async (userId) => {
  const result = await pool.query(
    `SELECT t.id,
            t.amount,
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

  return result.rows.map(row => ({
    ...row,
    amount: Number(row.amount),
    category: row.category || "Other",
  }));
};

const getSpendingTrend = async (userId) => {
  const result = await pool.query(
    `SELECT to_char(t.txn_date, 'YYYY-MM-DD') AS day,
            ABS(SUM(t.amount)) AS total
     FROM public.transactions t
     LEFT JOIN public.categories c
       ON t.category = c.id
     WHERE t.user_id = $1
       AND t.amount < 0
       AND LOWER(c.name) <> 'income'
     GROUP BY t.txn_date
     ORDER BY t.txn_date`,
    [userId]
  );

  return result.rows.map(row => ({
    day: row.day,
    total: Number(row.total),
  }));
};

module.exports = {
  getTotalSpent,
  getSpendingByCategory,
  getRecentTransactions,
  getSpendingTrend,
};