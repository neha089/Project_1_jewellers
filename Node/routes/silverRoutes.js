// routes/silverRoutes.js
import express from "express";
import {
  createSilverTransaction,
  getSilverTransactions,
  getSilverTransactionById,
  updateSilverTransaction,
  deleteSilverTransaction,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getProfitLossAnalysis,
  getSilverTrnsactionByCustomerId
} from "../controllers/silverController.js";

const router = express.Router();

// CRUD Operations
router.post("/", createSilverTransaction);
router.get("/", getSilverTransactions);
router.get("/:id", getSilverTransactionById);
router.put("/:id", updateSilverTransaction);
router.delete("/:id", deleteSilverTransaction);

// Analytics and Reporting
router.get("/reports/daily-summary", getDailyAnalytics);
router.get("/reports/weekly-summary", getWeeklyAnalytics);
router.get("/reports/profit-loss", getProfitLossAnalysis);
router.get("/customers/:customerId/transactions", getSilverTrnsactionByCustomerId);

export default router;