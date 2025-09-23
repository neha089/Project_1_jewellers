// routes/goldLoanRoutes.js - UPDATED WITH NEW ENDPOINTS (UNCHANGED, AS BACKEND LOGIC IS UPDATED IN CONTROLLERS/MODELS)
import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';
// import * as reportController from '../controllers/reportController.js'; // Assume this exists or add if needed

const router = express.Router();
// const authenticateToken = (req, res, next) => { next(); }; // Placeholder for auth

// Dashboard and analytics
router.get('/analytics/dashboard', goldLoanController.getDashboardStats);
// router.get('/analytics/business', reportController.getBusinessAnalytics);
// router.get('/analytics/overdue', reportController.getOverdueReport);

// Reports
// router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport);

// Customer specific routes
router.get('/customer/:customerId', goldLoanController.getGoldLoansByCustomer);

// Basic CRUD
router.post('/', goldLoanController.createGoldLoan);
router.get('/', goldLoanController.getAllGoldLoans);
router.get('/:id', goldLoanController.getGoldLoanById);

// Loan specific operations
// router.get('/:id/timeline', reportController.getLoanTimeline);
router.get('/:id/payment-history', goldLoanController.getPaymentHistory);
router.put('/:id/close', goldLoanController.closeGoldLoan);

// Interest payments
router.post('/:loanId/interest-payment', goldLoanController.addInterestPayment);
router.get('/:loanId/interest-payments', goldLoanController.getInterestPayments);

// Repayments
// router.post('/:id/repayment', goldLoanController.processItemRepayment);
router.get('/:id/repayments', goldLoanController.getRepayments);
router.get('/:id/repayment-stats', goldLoanController.getRepaymentStats);
router.post('/:id/validate-repayment', goldLoanController.validateRepayment);

// Additional repayment routes
router.get('/repayments/search', goldLoanController.searchAllRepayments);
router.get('/repayments/:repaymentId', goldLoanController.getRepaymentDetails);
router.get('/repayments/:repaymentId/receipt', goldLoanController.getRepaymentReceipt);
router.put('/repayments/:repaymentId/cancel', goldLoanController.cancelRepayment);

// Gold price
// router.get('/gold-price/current', goldLoanController.getCurrentGoldPrice);

// NEW: Get all transactions for a loan
router.get('/:id/transactions', goldLoanController.getLoanTransactions);

// NEW: Daily summary
router.get('/daily-summary', goldLoanController.getDailyGoldLoanSummary);
router.get('/:id/active-items', goldLoanController.getActiveItemsForReturn);
router.post('/:id/return-items', goldLoanController.processItemReturn);

export default router;