const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register
const register = async ({ name, email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = await userRepository.create({ name, email, hashedPassword });
  const token = generateToken(userId);
  return {
    token,
    user: { id: userId, name, email },
  };
};

// Login
const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Password verify
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }
  const token = generateToken(user.id);
  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
    },
  };
};

module.exports = { register, login };