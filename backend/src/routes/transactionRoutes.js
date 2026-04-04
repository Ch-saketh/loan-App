// src/routes/transactionRoutes.js
import express from "express";
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

// Viewer: read only | Analyst: read only | Admin: full access
router.get("/",    auth, allowRoles("user", "analyst", "admin"), getTransactions);
router.post("/",   auth, allowRoles("admin"), createTransaction);
router.put("/:id", auth, allowRoles("admin"), updateTransaction);
router.delete("/:id", auth, allowRoles("admin"), deleteTransaction);

export default router;