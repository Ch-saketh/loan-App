// src/routes/dashboardRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleAuth.js";
import {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
} from "../controllers/dashboard.controller.js";

const router = express.Router();
console.log("✅ dashboardRoutes.js loaded");

// Analyst + Admin can access dashboard
router.get("/summary",    auth, allowRoles("analyst", "admin"), getSummary);
router.get("/categories", auth, allowRoles("analyst", "admin"), getCategoryTotals);
router.get("/trends",     auth, allowRoles("analyst", "admin"), getMonthlyTrends);
router.get("/recent",     auth, allowRoles("analyst", "admin"), getRecentActivity);

export default router;