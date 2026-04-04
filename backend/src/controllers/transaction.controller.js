// src/controllers/transaction.controller.js
import pool from "../config/db.js";

// CREATE
export const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const user_id = req.user.id;

    if (!amount || !type || !category || !date) {
      return res.status(400).json({ msg: "amount, type, category, date are required ❌" });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ msg: "type must be 'income' or 'expense' ❌" });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, type, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, amount, type, category, date, notes || null]
    );

    res.status(201).json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    console.error("Create Transaction Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// GET ALL (with filters: type, category, date range)
export const getTransactions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type, category, from, to } = req.query;

    let query = `SELECT * FROM transactions WHERE user_id = $1`;
    const values = [user_id];
    let i = 2;

    if (type) { query += ` AND type = $${i++}`; values.push(type); }
    if (category) { query += ` AND category ILIKE $${i++}`; values.push(`%${category}%`); }
    if (from) { query += ` AND date >= $${i++}`; values.push(from); }
    if (to) { query += ` AND date <= $${i++}`; values.push(to); }

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, values);
    res.json({ success: true, transactions: result.rows });
  } catch (err) {
    console.error("Get Transactions Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// UPDATE
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      `UPDATE transactions
       SET amount=$1, type=$2, category=$3, date=$4, notes=$5
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [amount, type, category, date, notes, id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Transaction not found ❌" });
    }

    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    console.error("Update Transaction Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// DELETE
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Transaction not found ❌" });
    }

    res.json({ success: true, msg: "Transaction deleted ✅" });
  } catch (err) {
    console.error("Delete Transaction Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};