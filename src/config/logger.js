const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length) {
      const { error, ...rest } = meta;
      if (error) log += `\n  Error: ${error}`;
      if (Object.keys(rest).length) {
        Object.entries(rest).forEach(([key, value]) => {
          log += `\n  ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`;
        });
      }
    }
    if (stack) log += `\n  Stack: ${stack}`;
    return log;
  })
);

// console format - clean and colorized
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length) {
      const { error, ...rest } = meta;
      if (error) log += `\n  → Error: ${error}`;
      if (Object.keys(rest).length) {
        Object.entries(rest).forEach(([key, value]) => {
          log += `\n  → ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`;
        });
      }
    }
    if (stack) log += `\n  → Stack: ${stack}`;
    return log;
  })
);

// daily rotate — error logs
const errorTransport = new DailyRotateFile({
  filename:     path.join("logs", "error-%DATE%.log"),
  datePattern:  "YYYY-MM-DD",
  level:        "error",
  maxFiles:     "30d",
  zippedArchive: true,
});

// daily rotate — combined logs (all)
const combinedTransport = new DailyRotateFile({
  filename:     path.join("logs", "combined-%DATE%.log"),
  datePattern:  "YYYY-MM-DD",
  maxFiles:     "14d",
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    errorTransport,
    combinedTransport,
  ],
});

// in development, also show in console
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

module.exports = logger;