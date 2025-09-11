// routes/businessExpenseRoutes.js
import express from 'express';
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpensePayment,
  getExpenseSummaryByCategory,
  getMonthlyExpenseSummary,
  getOverdueExpenses,
  updateExpense,
  deleteExpense,
  getExpenseDashboard,
  getVendorExpenseSummary
} from '../controllers/businessExpenseController.js';

const router = express.Router();

// Basic CRUD operations
router.post('/', createExpense);
router.get('/', getAllExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Payment operations
router.put('/:id/payment', updateExpensePayment);

// Dashboard and analytics
router.get('/dashboard/summary', getExpenseDashboard);
router.get('/summary/category', getExpenseSummaryByCategory);
router.get('/summary/monthly', getMonthlyExpenseSummary);
router.get('/summary/vendors', getVendorExpenseSummary);

// Special queries
router.get('/overdue/list', getOverdueExpenses);

export default router;