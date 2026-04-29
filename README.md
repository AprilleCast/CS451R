# BudgeIt — Personal Budget Tracker

A full-stack budgeting web application built with **Node.js**, **Express**, and **PostgreSQL**. Users can register, log in, add transactions, create budgets, and track spending in real time.

---

## Features

- **User Authentication** — Register/Login with JWT-based auth
- **Transactions** — Add income and expenses with categories and dates
- **Budgets** — Create budgets with category, spending limit, and timeframe (weekly/monthly/custom)
- **Spending Tracking** — Real-time tracking of how much you've spent vs. your budget limit
- **Dashboard** — Visual overview with total spent, top categories, recent transactions, pie chart, and spending trend line chart
- **Profile** — View and update user profile

---

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | HTML, CSS, Bootstrap 5, Chart.js |
| Backend    | Node.js, Express.js   |
| Database   | PostgreSQL            |
| Auth       | JWT (JSON Web Tokens) |
| Password   | bcrypt hashing        |

---

## Prerequisites

Before setting up, make sure you have these installed on your system:

1. **Node.js** (v16 or higher) — [Download](https://nodejs.org/)
2. **PostgreSQL** (v14 or higher) — [Download](https://www.postgresql.org/download/)
3. **Git** — [Download](https://git-scm.com/)

### How to check if they're installed:
```bash
node --version    # Should show v16+ 
npm --version     # Should show 8+
psql --version    # Should show 14+
git --version     # Should show 2+
```

---

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/AprilleCast/CS451R.git
cd CS451R
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs Express, pg (PostgreSQL client), bcrypt, jsonwebtoken, and other dependencies.

### Step 3: Set Up PostgreSQL Database

#### 3a. Start PostgreSQL

- **Mac (Homebrew):**
  ```bash
  brew services start postgresql@14
  ```
- **Windows:** PostgreSQL should be running as a service after installation
- **Linux:**
  ```bash
  sudo systemctl start postgresql
  ```

#### 3b. Create the Database

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

> **Note:** If this doesn't work, try:
> - Mac: `psql -U $(whoami) -d postgres` (then create the postgres role)
> - Windows: Use pgAdmin or `psql -U postgres` (use the password you set during installation)

Then just create the database — **tables are created automatically when the server starts**:

```sql
CREATE DATABASE budget_app;
```

Then exit:
```sql
\q
```

> **That's it!** The server will automatically create all 4 tables (users, categories, transactions, budgets) and indexes when you run `node server.js`. No manual table creation needed.

<details>
<summary>📋 Manual table creation (only if auto-create fails)</summary>

If for some reason the auto-create doesn't work, connect to the database and run:

```bash
psql -U postgres -d budget_app
```

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  theme_preference VARCHAR(10) NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category INT REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  txn_date DATE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
  timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('weekly', 'monthly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, txn_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_user_category_period 
  ON budgets(user_id, LOWER(category), timeframe, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, start_date, end_date);
```

Then exit psql:
```sql
\q
```

</details>

### Step 4: Create the `.env` File

Create a file called `.env` in the project root directory (same level as `server.js`):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=budget_app
JWT_SECRET=ANY_RANDOM_SECRET_STRING
JWT_EXPIRES_IN=7d
```

**Important — Update these values:**

| Variable       | What to put                                                     |
|----------------|-----------------------------------------------------------------|
| `DB_PORT`      | Usually `5432` (default PostgreSQL port). Check with `psql -U postgres -c "SHOW port;"` |
| `DB_USER`      | Usually `postgres`. On Mac it might be your system username     |
| `DB_PASSWORD`  | The password for your PostgreSQL user                           |
| `JWT_SECRET`   | Any random string (e.g., `mysecretkey123`)                      |

### Step 5: Start the Server

```bash
node server.js
```

You should see:
```
Server running on http://localhost:3000
```

### Step 6: Open the App

Open your browser and go to: **http://localhost:3000**

1. You'll see the **Login** page
2. Click to **Register** a new account
3. After registering, you're logged in automatically
4. Navigate using the top navbar:
   - **Dashboard** — Overview of spending with charts
   - **Transactions** — Add and view transactions
   - **Budgets** — Create budgets and track spending
   - **Profile** — View/update your profile

---

## How to Use the Budget Feature

1. First, go to **Transactions** and add some expenses (e.g., category: "Food", amount: 50)
2. Then go to **Budgets** and create a budget:
   - Category: `Food` (must match the transaction category name)
   - Limit: `500`
   - Timeframe: `monthly`
3. The budget will automatically show how much you've spent in that category for the current period

---

## API Endpoints

### Auth
| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Register new user    |
| POST   | `/api/auth/login`    | Login, get JWT token |

### Transactions (requires auth token)
| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| POST   | `/api/transactions/add`   | Add a transaction      |
| GET    | `/api/transactions/all`   | Get all transactions   |

### Budgets (requires auth token)
| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/api/budgets`       | Get all budgets with spending data   |
| POST   | `/api/budgets`       | Create a new budget                  |
| PUT    | `/api/budgets/:id`   | Update a budget                      |
| DELETE | `/api/budgets/:id`   | Delete a budget                      |

### Dashboard (requires auth token)
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/api/dashboard/summary`  | Spending summary + recent transactions |
| GET    | `/api/dashboard/trend`    | Daily spending trend     |

---

## Project Structure

```
CS451R/
├── server.js                    # Main server file + dashboard routes
├── package.json                 # Dependencies
├── .env                         # Environment config (not in git)
├── .gitignore
├── public/                      # Frontend files
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js               # Shared utilities (Auth, API, UI, Layout)
│   │   ├── login.js
│   │   └── register.js
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       ├── transactions.html
│       ├── budgets.html
│       └── profile.html
└── src/                         # Backend files
    ├── config/db.js
    ├── db/pool.js               # PostgreSQL connection pool
    ├── middleware/
    │   ├── authMiddleware.js     # JWT verification
    │   └── errorMiddleware.js
    ├── controllers/
    │   ├── authController.js
    │   ├── budgetController.js
    │   ├── transactionController.js
    │   └── dashboardController.js
    ├── services/
    │   ├── authService.js
    │   ├── budgetService.js
    │   ├── transactionService.js
    │   └── dashboardService.js
    ├── repositories/
    │   ├── authRepository.js
    │   ├── budgetRepository.js
    │   ├── transactionRepository.js
    │   ├── dashboardRepository.js
    │   └── userRepository.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── budgetRoutes.js
    │   ├── transactionRoutes.js
    │   └── dashboardRoutes.js
    └── models/
        ├── PGschema.sql          # Database schema
        └── migrations/
```

---

## Troubleshooting

### "Connection refused" when starting server
- Make sure PostgreSQL is running: `brew services list` (Mac) or `sudo systemctl status postgresql` (Linux)
- Check the port: `psql -U postgres -c "SHOW port;"`
- Update `DB_PORT` in `.env` to match

### "Authentication failed" for PostgreSQL
- Try connecting manually: `psql -U postgres -d budget_app`
- If on Mac, your default user might be your system username, not `postgres`
- Reset password: `ALTER USER postgres WITH PASSWORD 'newpassword';`

### "relation does not exist" errors
- Make sure you ran all the CREATE TABLE commands from Step 3b
- Connect and check: `psql -U postgres -d budget_app -c "\dt"`

### Dashboard shows $0 / empty
- Make sure you're logged in (check browser localStorage for "token")
- Add some transactions first on the Transactions page
- Budget tracking requires the category name to match between budgets and transactions

---

## Contributors

CS451R Team — University of Missouri-Kansas City
