const pool = require("../db/pool");

const VALID_TIMEFRAMES = new Set(["weekly", "monthly", "custom"]);

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getRangeFromTimeframe = (timeframe, startDate, endDate) => {
  if (timeframe === "custom") {
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    if (!normalizedStart || !normalizedEnd) return null;
    if (normalizedStart > normalizedEnd) return null;
    return { startDate: normalizedStart, endDate: normalizedEnd };
  }

  const today = new Date();
  if (timeframe === "weekly") {
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const ensureBudgetTable = async () => {
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

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'uq_budgets_user_category_period'
      ) THEN
        CREATE UNIQUE INDEX uq_budgets_user_category_period
          ON public.budgets (user_id, LOWER(category), timeframe, start_date, end_date);
      END IF;
    END $$;
  `);
};

const validatePayload = ({ category, limitAmount, timeframe, startDate, endDate }) => {
  if (!category || typeof category !== "string" || category.trim().length < 2 || category.trim().length > 100) {
    const error = new Error("Category is required and must be between 2 and 100 characters.");
    error.statusCode = 422;
    throw error;
  }

  const amount = Number(limitAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Spending limit must be a number greater than 0.");
    error.statusCode = 422;
    throw error;
  }

  if (!VALID_TIMEFRAMES.has(timeframe)) {
    const error = new Error("Timeframe must be weekly, monthly, or custom.");
    error.statusCode = 422;
    throw error;
  }

  const period = getRangeFromTimeframe(timeframe, startDate, endDate);
  if (!period) {
    const error = new Error("Invalid date range. For custom timeframe, provide valid start and end dates.");
    error.statusCode = 422;
    throw error;
  }

  return {
    category: category.trim(),
    limitAmount: amount,
    timeframe,
    ...period,
  };
};

const createBudget = async (userId, payload) => {
  await ensureBudgetTable();
  const normalized = validatePayload(payload);

  try {
    const result = await pool.query(
      `INSERT INTO public.budgets (user_id, category, limit_amount, timeframe, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, category, limit_amount, timeframe, start_date, end_date, created_at, updated_at`,
      [userId, normalized.category, normalized.limitAmount, normalized.timeframe, normalized.startDate, normalized.endDate]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      const conflict = new Error("A budget for this category and timeframe already exists.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
};

const updateBudget = async (userId, budgetId, payload) => {
  await ensureBudgetTable();
  const normalized = validatePayload(payload);

  try {
    const result = await pool.query(
      `UPDATE public.budgets
       SET category = $1,
           limit_amount = $2,
           timeframe = $3,
           start_date = $4,
           end_date = $5,
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, category, limit_amount, timeframe, start_date, end_date, created_at, updated_at`,
      [
        normalized.category,
        normalized.limitAmount,
        normalized.timeframe,
        normalized.startDate,
        normalized.endDate,
        budgetId,
        userId,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (error.code === "23505") {
      const conflict = new Error("A budget for this category and timeframe already exists.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
};

const deleteBudget = async (userId, budgetId) => {
  await ensureBudgetTable();
  const result = await pool.query(
    `DELETE FROM public.budgets
     WHERE id = $1 AND user_id = $2`,
    [budgetId, userId]
  );
  return result.rowCount > 0;
};

const getBudgetsWithTracking = async (userId) => {
  await ensureBudgetTable();
  const result = await pool.query(
    `SELECT
        b.id,
        b.category,
        b.limit_amount,
        b.timeframe,
        to_char(b.start_date, 'YYYY-MM-DD') AS start_date,
        to_char(b.end_date, 'YYYY-MM-DD') AS end_date,
        COALESCE(
          SUM(ABS(t.amount)),
          0
        ) AS spent
     FROM public.budgets b
     LEFT JOIN public.categories c
       ON c.user_id = b.user_id AND LOWER(c.name) = LOWER(b.category)
     LEFT JOIN public.transactions t
       ON t.user_id = b.user_id
      AND t.txn_date BETWEEN b.start_date AND b.end_date
      AND t.category = c.id
     WHERE b.user_id = $1
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => {
    const limit = Number(row.limit_amount);
    const spent = Number(row.spent);
    const remaining = Math.max(limit - spent, 0);
    const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const status = spent > limit ? "exceeded" : percentUsed >= 80 ? "near_limit" : "on_track";
    return {
      id: row.id,
      category: row.category,
      timeframe: row.timeframe,
      startDate: row.start_date,
      endDate: row.end_date,
      limitAmount: limit,
      amountSpent: spent,
      remainingAmount: remaining,
      percentUsed,
      status,
      exceededBy: spent > limit ? Number((spent - limit).toFixed(2)) : 0,
    };
  });
};

module.exports = {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsWithTracking,
};
