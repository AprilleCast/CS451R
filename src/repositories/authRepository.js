
const createUser = async ({ fullName, email, passwordHash }) => {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, created_at`,
      [fullName, email, passwordHash]
    );
  
    return result.rows[0];
  };