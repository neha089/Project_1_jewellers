// routes/businessExpenseRoutes.js
import express from 'express';
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseDashboard,
  updateExpensePayment,
} from '../controllers/businessExpenseController.js';

const router = express.Router();

// Basic CRUD operations
router.post('/', createExpense);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Payment operations
router.put('/:id/payment', updateExpensePayment);

// Dashboard and analytics
router.get('/dashboard/summary', getExpenseDashboard);
export default router;