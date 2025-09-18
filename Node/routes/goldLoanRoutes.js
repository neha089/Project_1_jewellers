// routes/goldLoanRoutes.js
import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';
import * as reportController from '../controllers/reportController.js';
import { addInterestPayment, getInterestPayments } from '../controllers/goldLoanController.js';

const router = express.Router();
const authenticateToken = (req, res, next) => {
  // For now, just pass through - implement proper auth later
  next();
};

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

// // ENHANCED PAYMENT OPERATIONS
// router.post('/:id/interest-payment', goldLoanController.addInterestPayment);

// // NEW ENHANCED ENDPOINTS FOR YOUR REQUIREMENTS

// // ENHANCED REPAYMENT OPERATIONS
//router.post('/:id/process-repayment', goldLoanController.processItemRepayment);

// ENHANCED PAYMENT OPERATIONS - SEPARATE MODELS
// Interest payment operations
router.post('/:loanId/interest-payment', addInterestPayment);
router.get('/:loanId/interest-payments', getInterestPayments);

// Repayment operations
router.post('/:id/repayment', goldLoanController.processItemRepayment);
router.get('/:id/repayments', goldLoanController.getRepayments);
router.get('/:id/repayment-stats', goldLoanController.getRepaymentStats);
router.get('/gold-price/current', goldLoanController.getCurrentGoldPrice);



// Optional: Validate repayment before processing
router.post('/:id/validate-repayment', authenticateToken, goldLoanController.validateRepayment);

// Additional repayment routes (if needed)
router.get('/repayments/search', authenticateToken, goldLoanController.searchAllRepayments);
router.get('/repayments/:repaymentId', authenticateToken, goldLoanController.getRepaymentDetails);
router.get('/repayments/:repaymentId/receipt', authenticateToken, goldLoanController.getRepaymentReceipt);
router.put('/repayments/:repaymentId/cancel', authenticateToken, goldLoanController.cancelRepayment);

// ITEM MANAGEMENT

// LOAN MANAGEMENT
router.put('/:id/close', goldLoanController.closeGoldLoan);

// VALIDATION ENDPOINTS

export default router;