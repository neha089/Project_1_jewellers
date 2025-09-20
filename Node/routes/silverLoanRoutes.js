import express from 'express';
import * as silverLoanController from '../controllers/silverLoanController.js';
// import * as reportController from '../controllers/reportController.js'; // Assume this exists or add if needed

const router = express.Router();
// const authenticateToken = (req, res, next) => { next(); }; // Placeholder for auth

// Dashboard and analytics
router.get('/analytics/dashboard', silverLoanController.getDashboardStats);
// router.get('/analytics/business', reportController.getBusinessAnalytics);
// router.get('/analytics/overdue', reportController.getOverdueReport);

// Reports
// router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport);

// Customer specific routes
router.get('/customer/:customerId', silverLoanController.getSilverLoansByCustomer);

// Basic CRUD
router.post('/', silverLoanController.createSilverLoan);
router.get('/', silverLoanController.getAllSilverLoans);
router.get('/:id', silverLoanController.getSilverLoanById);

// Loan specific operations
// router.get('/:id/timeline', reportController.getLoanTimeline);
router.get('/:id/payment-history', silverLoanController.getPaymentHistory);
router.put('/:id/close', silverLoanController.closeSilverLoan);

// Interest payments
router.post('/:loanId/interest-payment', silverLoanController.addInterestPaymentS);
router.get('/:loanId/interest-payments', silverLoanController.getInterestPayments);

// Repayments
router.post('/:id/repayment', silverLoanController.processItemRepaymentS);
router.get('/:id/repayments', silverLoanController.getRepayments);
router.get('/:id/repayment-stats', silverLoanController.getRepaymentStats);
router.post('/:id/validate-repayment', silverLoanController.validateRepayment);

// Additional repayment routes
router.get('/repayments/search', silverLoanController.searchAllRepayments);
router.get('/repayments/:repaymentId', silverLoanController.getRepaymentDetails);
// router.get('/repayments/:repaymentId/receipt', silverLoanController.getRepaymentReceipt);
router.put('/repayments/:repaymentId/cancel', silverLoanController.cancelRepayment);

// Silver price
router.get('/silver-price/current', silverLoanController.getCurrentSilverPrice);

// NEW: Get all transactions for a loan
// router.get('/:id/transactions', silverLoanController.getLoanTransactions);

// NEW: Daily summary
// router.get('/daily-summary', silverLoanController.getDailySilverLoanSummary);
router.get('/:id/active-items', silverLoanController.getActiveItemsForReturnS);
router.post('/:id/return-items', silverLoanController.processItemReturnS);

export default router;