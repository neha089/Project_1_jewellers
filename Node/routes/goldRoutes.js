// routes/goldRoutes.js
import express from "express";
import {
  createGoldTransaction,
  getGoldTransactions,
  getGoldTransactionById,
  updateGoldTransaction,
  deleteGoldTransaction,
  getDailySummary,
  getMonthlySummary,
  getGoldAnalytics
} from "../controllers/goldController.js";

const router = express.Router();

// CRUD Operations
router.post("/", createGoldTransaction);
router.get("/", getGoldTransactions);
router.get("/:id", getGoldTransactionById);
router.put("/:id", updateGoldTransaction);
router.delete("/:id", deleteGoldTransaction);

// Analytics and Reporting
router.get("/reports/daily-summary", getDailySummary);
router.get("/reports/monthly-summary", getMonthlySummary);
router.get("/reports/analytics", getGoldAnalytics);

export default router;