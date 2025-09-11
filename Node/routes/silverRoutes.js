// routes/silverRoutes.js
import express from "express";
import {
  createSilverTransaction,
  getSilverTransactions,
  getSilverTransactionById,
  updateSilverTransaction,
  deleteSilverTransaction,
  getDailySummary,
  getMonthlySummary,
  getSilverAnalytics
} from "../controllers/silverController.js";

const router = express.Router();

// CRUD Operations
router.post("/", createSilverTransaction);
router.get("/", getSilverTransactions);
router.get("/:id", getSilverTransactionById);
router.put("/:id", updateSilverTransaction);
router.delete("/:id", deleteSilverTransaction);

// Analytics and Reporting
router.get("/reports/daily-summary", getDailySummary);
router.get("/reports/monthly-summary", getMonthlySummary);
router.get("/reports/analytics", getSilverAnalytics);

export default router;