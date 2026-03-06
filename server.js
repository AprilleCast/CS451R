const express = require('express')
require("dotenv").config()

const pool = require("./src/db/pool")

const app = express()

app.set("json spaces", 2)

app.use(express.static("public"));

app.get('/', (req, res) =>  {
    res.send('Hello from express')
})

app.get('/about', (req, res) =>{
    res.send('Hello from about page')
})

app.get("/health/db", async (req, res) => {
  const r = await pool.query("SELECT 1 AS ok");
  res.json(r.rows[0]);
});

app.get("/api/dashboard/summary", async (req, res) => {

    try {

        const total = await pool.query(
            "SELECT COALESCE(SUM(amount),0) AS total_spent FROM transactions"
        )

        const byCategory = await pool.query(
            `SELECT category, SUM(amount) AS total
             FROM transactions
             GROUP BY category
             ORDER BY total DESC`
        )

        const recent = await pool.query(
  `SELECT id, amount, category,
          to_char(txn_date, 'YYYY-MM-DD') AS txn_date,
          description
   FROM transactions
   ORDER BY txn_date DESC, id DESC
   LIMIT 5`
);

const totalSpent = Number(total.rows[0].total_spent);

const spendingByCategory = byCategory.rows.map(r => ({
  category: r.category,
  total: Number(r.total),
}));

const recentTransactions = recent.rows.map(r => ({
  ...r,
  amount: Number(r.amount),
}));
        res.json({
            totalSpent: total.rows[0].total_spent,
            spendingByCategory: byCategory.rows,
            recentTransactions: recent.rows
        })

    } catch (error) {

        console.error(error)

        res.status(500).json({
            error: "Database query failed"
        })

    }

})

app.listen(process.env.PORT || 3000, () => {
    console.log('The server is running')
})