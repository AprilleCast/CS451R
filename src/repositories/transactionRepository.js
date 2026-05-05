const pool = require("../db/pool");

const getAllByUser = async (userId, options = {}) => {
  const {
    startDate,
    endDate,
    sortby = "date_desc",
  } = options;
  const values = [userId];
  let query = `
    SELECT t.id,
            t.amount,
            c.name AS category,
            to_char(t.txn_date, 'YYYY-MM-DD') AS txn_date,
            t.description
     FROM public.transactions t
     LEFT JOIN public.categories c
       ON t.category = c.id
     WHERE t.user_id = $1
    `;
  if (startDate) {
    query += " AND t.txn_date >= $2";
    values.push(startDate);
  }
  if (endDate) {
    query += ` AND t.txn_date <= $${values.length + 1}`;
    values.push(endDate);
  }
  if (sortby === "date_asc") {
    query += ` ORDER BY t.txn_date ASC, t.id ASC`;
  } else if (sortby === "amount_high") {
    query += ` ORDER BY t.amount DESC, t.id DESC`;
  } else if (sortby === "amount_low") {
    query += ` ORDER BY t.amount ASC, t.id ASC`;
  } else if (sortby === "category") {
    query += ` ORDER BY c.name ASC, t.id ASC`;
  } else {
    query += ` ORDER BY t.txn_date DESC, t.id DESC`;
  }
  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    ...row,
    amount: Number(row.amount),
    category: row.category || "Other",
  }));
};

const createCategoryIfMissing = async (userId, categoryName) => {
  const existing = await pool.query(
    `SELECT id
     FROM public.categories
     WHERE user_id = $1 AND LOWER(name) = LOWER($2)
     LIMIT 1`,
    [userId, categoryName]
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const inserted = await pool.query(
    `INSERT INTO public.categories (user_id, name)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, categoryName]
  );
  return inserted.rows[0].id;
};

const addTransaction = async (userId, { txnDate, category, description, amount }) => {
  const categoryId = await createCategoryIfMissing(userId, category);
  const result = await pool.query(
    `INSERT INTO public.transactions (user_id, category, amount, txn_date, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, categoryId, amount, txnDate, description || null]
  );
  return result.rows[0];
};
const deleteTransaction = async (transactionId, userId) => {
  const result = await pool.query(
    `DELETE FROM public.transactions
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [transactionId, userId]
  );

  return result.rows[0];
};
const updateTransaction = async (userId, txnId, { txn_date, category, description, amount }) => {
  const categoryId = await createCategoryIfMissing(userId, category);

  const result = await pool.query(
    `UPDATE public.transactions
     SET category = $1,
         amount = $2,
         txn_date = $3,
         description = $4
     WHERE id = $5 AND user_id = $6`,
    [categoryId, amount, txn_date, description || null, txnId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error("Transaction not found");
  }

  return result.rows[0];
};
module.exports = {
  getAllByUser,
  addTransaction,
  deleteTransaction,
  updateTransaction,
};
