-- PostgreSQL syntax
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,          
  name       VARCHAR(100)    NOT NULL,
  email      VARCHAR(150)    NOT NULL UNIQUE,
  password   VARCHAR(255)    NOT NULL,
  theme_preference VARCHAR(10) NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  user_id    INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100)    NOT NULL,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT             REFERENCES categories(id) ON DELETE SET NULL,
  type        VARCHAR(10)     NOT NULL CHECK (type IN ('income','expense')),
  amount      DECIMAL(12,2)   NOT NULL,
  date        DATE            NOT NULL,
  note        VARCHAR(255),
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id           SERIAL PRIMARY KEY,
  user_id      INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INT             NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month        DATE            NOT NULL,
  limit_amount DECIMAL(12,2)   NOT NULL,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month     ON budgets(user_id, month);