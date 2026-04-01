const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// Connection Pool
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max:      10,           // at a time maximum 10 connections
                         // pg queues automatically, no queueLimit needed
                         // pg uses UTC by default, no timezone config needed
});

// Startup connection test
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL Database connected successfully");
    client.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

testConnection();
module.exports = pool;