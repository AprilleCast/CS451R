const pool = require("../db/pool");

// find user by email
const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
};

// find user by id
const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] || null;
};

// new user creation
const create = async ({ name, email, hashedPassword }) => {
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
    [name, email, hashedPassword]
  );
  return result.rows[0].id;
};

// User info update
const updateProfile = async (id, { name, email }) => {
  const result = await pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3",
    [name, email, id]
  );
  return result.rowCount > 0;
};

// Password update
const updatePassword = async (id, hashedPassword) => {
  const result = await pool.query(
    "UPDATE users SET password = $1 WHERE id = $2",
    [hashedPassword, id]
  );
  return result.rowCount > 0;
};

// Theme preference update
const updateTheme = async (id, theme) => {
  const result = await pool.query(
    "UPDATE users SET theme_preference = $1 WHERE id = $2",
    [theme, id]
  );
  return result.rowCount > 0;
};

const saveResetToken = async (userId, token) => {
  await pool.query(
    "DELETE FROM password_resets WHERE user_id = $1", [userId]
  );
  await pool.query(
    `INSERT INTO password_resets (user_id, token, expires_at) 
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, token]
  );
};

const findResetToken = async (token) => {
  const { rows } = await pool.query(
    `SELECT pr.*, u.email FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = $1 AND pr.expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
};

const deleteResetToken = async (token) => {
  await pool.query(
    "DELETE FROM password_resets WHERE token = $1", [token]
  );
};

const deleteUser = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM users WHERE id = $1", [id]
  );
  return rowCount > 0;
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateProfile,
  updatePassword,
  updateTheme,
  saveResetToken,
  findResetToken,
  deleteResetToken,
  deleteUser
};