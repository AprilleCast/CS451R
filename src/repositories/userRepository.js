const pool = require("../config/db");

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

module.exports = {
  findByEmail,
  findById,
  create,
  updateProfile,
  updatePassword,
  updateTheme,
};