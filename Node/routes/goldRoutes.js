import express from "express";
import {
  createGoldTransaction,
  getGoldTransactions,
  getGoldTransactionById,
  updateGoldTransaction,
  deleteGoldTransaction,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getProfitLossAnalysis,
  getCurrentGoldPrices,
  getDailySummary,
  getMonthlySummary,
  getGoldAnalytics,
  getGoldTrnsactionByCustomerId
} from "../controllers/goldController.js";

const router = express.Router();

// CRUD Operations
router.post("/", createGoldTransaction);
router.get("/", getGoldTransactions);
router.get("/:id", getGoldTransactionById);
router.put("/:id", updateGoldTransaction);
router.delete("/:id", deleteGoldTransaction);

// Analytics and Reporting
router.get("/reports/daily-analytics", getDailyAnalytics);
router.get("/reports/weekly-analytics", getWeeklyAnalytics);
router.get("/reports/profit-loss", getProfitLossAnalysis);
router.get("/reports/current-prices", getCurrentGoldPrices);
router.get("/reports/daily-summary", getDailySummary);
router.get("/reports/monthly-summary", getMonthlySummary);
router.get("/reports/analytics", getGoldAnalytics);
router.get("/customers/:customerId/transactions", getGoldTrnsactionByCustomerId);
export default router;