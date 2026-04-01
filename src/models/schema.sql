CREATE DATABASE IF NOT EXISTS finance_db;
USE finance_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(150)        NOT NULL UNIQUE,
  password    VARCHAR(255)        NOT NULL,
  created_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE users 
ADD COLUMN theme_preference ENUM('light', 'dark') NOT NULL DEFAULT 'light';

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED        NOT NULL,
  name        VARCHAR(100)        NOT NULL,
  created_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_category_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED              NOT NULL,
  category_id   INT UNSIGNED              NULL,
  type          ENUM('income','expense')  NOT NULL,
  amount        DECIMAL(12, 2)            NOT NULL,
  date          DATE                      NOT NULL,
  note          VARCHAR(255)              NULL,
  created_at    TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transaction_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_transaction_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED    NOT NULL,
  category_id   INT UNSIGNED    NOT NULL,
  month         DATE            NOT NULL,
  limit_amount  DECIMAL(12, 2)  NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_budget (user_id, category_id, month),
  CONSTRAINT fk_budget_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_budget_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE
);

-- Indexes (For Query speed)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_budgets_user_month     ON budgets(user_id, month);