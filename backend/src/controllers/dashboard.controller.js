// src/controllers/dashboard.controller.js
import pool from "../config/db.js";

// SUMMARY: total income, expense, net balance
export const getSummary = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE -amount END), 0) AS net_balance
       FROM transactions WHERE user_id=$1`,
      [user_id]
    );

    res.json({ success: true, summary: result.rows[0] });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// CATEGORY-WISE TOTALS
export const getCategoryTotals = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT category, type,
        SUM(amount) AS total
       FROM transactions
       WHERE user_id=$1
       GROUP BY category, type
       ORDER BY total DESC`,
      [user_id]
    );

    res.json({ success: true, categoryTotals: result.rows });
  } catch (err) {
    console.error("Category Totals Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// MONTHLY TRENDS
export const getMonthlyTrends = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE user_id=$1
       GROUP BY month
       ORDER BY month ASC`,
      [user_id]
    );

    res.json({ success: true, trends: result.rows });
  } catch (err) {
    console.error("Monthly Trends Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// RECENT ACTIVITY (last 10)
export const getRecentActivity = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT * FROM transactions
       WHERE user_id=$1
       ORDER BY created_at DESC
       LIMIT 10`,
      [user_id]
    );

    res.json({ success: true, recent: result.rows });
  } catch (err) {
    console.error("Recent Activity Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};