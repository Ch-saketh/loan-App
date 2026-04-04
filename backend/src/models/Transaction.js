// src/models/Transaction.js
// Run this query once in your PostgreSQL DB to create the table

import pool from "../config/db.js";

export const createTransactionTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
      category VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ transactions table ready");
};