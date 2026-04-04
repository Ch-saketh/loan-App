// src/controllers/transaction.controller.js
import pool from "../config/db.js";

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────
export const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const user_id = req.user.id;

    // Input validation
    if (!amount || !type || !category || !date) {
      return res.status(400).json({ msg: "amount, type, category, date are required ❌" });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ msg: "amount must be a positive number ❌" });
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ msg: "type must be 'income' or 'expense' ❌" });
    }
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ msg: "date must be a valid date (YYYY-MM-DD) ❌" });
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

// ─────────────────────────────────────────
// GET ALL (filters + pagination + search)
// ─────────────────────────────────────────
export const getTransactions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type, category, from, to, search, page = 1, limit = 10 } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // cap at 100
    const offset   = (pageNum - 1) * limitNum;

    let baseCondition = `WHERE user_id = $1 AND deleted_at IS NULL`;
    const values = [user_id];
    let i = 2;

    if (type)     { baseCondition += ` AND type = $${i++}`;           values.push(type); }
    if (category) { baseCondition += ` AND category ILIKE $${i++}`;   values.push(`%${category}%`); }
    if (from)     { baseCondition += ` AND date >= $${i++}`;          values.push(from); }
    if (to)       { baseCondition += ` AND date <= $${i++}`;          values.push(to); }
    if (search)   { baseCondition += ` AND notes ILIKE $${i++}`;      values.push(`%${search}%`); }

    const dataQuery  = `SELECT * FROM transactions ${baseCondition} ORDER BY date DESC LIMIT $${i} OFFSET $${i+1}`;
    const countQuery = `SELECT COUNT(*) FROM transactions ${baseCondition}`;

    const [result, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, limitNum, offset]),
      pool.query(countQuery, values),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      transactions: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Get Transactions Error:", err);
    res.status(500).json({ msg: "Server error ❌" });
  }
};

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;
    const user_id = req.user.id;

    // Input validation
    if (!amount || !type || !category || !date) {
      return res.status(400).json({ msg: "amount, type, category, date are required ❌" });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ msg: "amount must be a positive number ❌" });
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ msg: "type must be 'income' or 'expense' ❌" });
    }
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ msg: "date must be a valid date (YYYY-MM-DD) ❌" });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET amount=$1, type=$2, category=$3, date=$4, notes=$5
       WHERE id=$6 AND user_id=$7 AND deleted_at IS NULL
       RETURNING *`,
      [amount, type, category, date, notes || null, id, user_id]
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

// ─────────────────────────────────────────
// SOFT DELETE
// ─────────────────────────────────────────
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `UPDATE transactions SET deleted_at = NOW()
       WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
       RETURNING *`,
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