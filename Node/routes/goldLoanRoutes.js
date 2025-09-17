// routes/goldLoanRoutes.js
import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();


router.get('/analytics/dashboard', goldLoanController.getDashboardStats);
router.get('/analytics/business', reportController.getBusinessAnalytics);
router.get('/analytics/overdue', reportController.getOverdueReport);

// PAYMENT HISTORY

// REPORTS
router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport);

// CUSTOMER SPECIFIC ROUTES (Before /:id route)
router.get('/customer/:customerId', goldLoanController.getGoldLoansByCustomer);

// BASIC CRUD OPERATIONS
router.post('/', goldLoanController.createGoldLoan);
router.get('/', goldLoanController.getAllGoldLoans);
router.get('/:id', goldLoanController.getGoldLoanById);

// LOAN SPECIFIC OPERATIONS
router.get('/:id/timeline', reportController.getLoanTimeline);

// ENHANCED PAYMENT OPERATIONS
router.post('/:id/interest-payment', goldLoanController.addInterestPayment);

// NEW ENHANCED ENDPOINTS FOR YOUR REQUIREMENTS

// ENHANCED REPAYMENT OPERATIONS
router.post('/:id/process-repayment', goldLoanController.processItemRepayment);

// ITEM MANAGEMENT

// LOAN MANAGEMENT
router.put('/:id/close', goldLoanController.closeGoldLoan);

// VALIDATION ENDPOINTS

export default router;