const errorMiddleware = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
  } else {
    console.error("❌ Error:", err.message);
  }
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Email already registered.";
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
module.exports = errorMiddleware;