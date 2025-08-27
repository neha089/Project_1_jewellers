import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', dashboardController.getDashboardStats);
router.get('/income-expense-report', dashboardController.getIncomeExpenseReport);

export default router;