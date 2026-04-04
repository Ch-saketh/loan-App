// src/routes/transactionRoutes.js
import express from "express";
import { body, param, query, validationResult } from "express-validator";
import auth from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleAuth.js";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();
console.log("✅ transactionRoutes.js loaded");

// ─────────────────────────────────────────
// Validation handler middleware
// ─────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, msg: e.msg }))
    });
  }
  next();
};

// ─────────────────────────────────────────
// Reusable body validation rules
// ─────────────────────────────────────────
const transactionBodyRules = [
  body("amount")
    .notEmpty().withMessage("amount is required")
    .isNumeric().withMessage("amount must be a number")
    .isFloat({ gt: 0 }).withMessage("amount must be greater than 0"),

  body("type")
    .notEmpty().withMessage("type is required")
    .isIn(["income", "expense"]).withMessage("type must be 'income' or 'expense'"),

  body("category")
    .notEmpty().withMessage("category is required")
    .isString().withMessage("category must be a string")
    .isLength({ max: 100 }).withMessage("category max 100 characters"),

  body("date")
    .notEmpty().withMessage("date is required")
    .isDate().withMessage("date must be valid format YYYY-MM-DD"),

  body("notes")
    .optional()
    .isString().withMessage("notes must be a string")
    .isLength({ max: 500 }).withMessage("notes max 500 characters"),
];

// ─────────────────────────────────────────
// Query param validation for GET
// ─────────────────────────────────────────
const transactionQueryRules = [
  query("type")
    .optional()
    .isIn(["income", "expense"]).withMessage("type must be 'income' or 'expense'"),

  query("from")
    .optional()
    .isDate().withMessage("from must be valid date YYYY-MM-DD"),

  query("to")
    .optional()
    .isDate().withMessage("to must be valid date YYYY-MM-DD"),

  query("page")
    .optional()
    .isInt({ gt: 0 }).withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ gt: 0, max: 100 }).withMessage("limit must be between 1 and 100"),
];

// ─────────────────────────────────────────
// Param validation for PUT / DELETE
// ─────────────────────────────────────────
const idParamRule = [
  param("id")
    .isInt({ gt: 0 }).withMessage("id must be a positive integer"),
];

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// GET all transactions (all roles, with filters + pagination)
router.get(
  "/",
  auth,
  allowRoles("user", "analyst", "admin"),
  transactionQueryRules,
  validate,
  getTransactions
);

// POST create transaction (admin only)
router.post(
  "/",
  auth,
  allowRoles("admin"),
  transactionBodyRules,
  validate,
  createTransaction
);

// PUT update transaction (admin only)
router.put(
  "/:id",
  auth,
  allowRoles("admin"),
  idParamRule,
  transactionBodyRules,
  validate,
  updateTransaction
);

// DELETE soft delete transaction (admin only)
router.delete(
  "/:id",
  auth,
  allowRoles("admin"),
  idParamRule,
  validate,
  deleteTransaction
);

export default router;