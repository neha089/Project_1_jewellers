// routes/silverLoanRoutes.js
import express from 'express';
import * as silverLoanController from '../controllers/silverLoanController.js';

const router = express.Router();

// Dashboard and analytics
router.get('/analytics/dashboard', silverLoanController.getDashboardStats);

// Customer specific routes
router.get('/customer/:customerId', silverLoanController.getSilverLoansByCustomer);

// Basic CRUD
router.post('/', silverLoanController.createSilverLoan);
router.get('/', silverLoanController.getAllSilverLoans);
router.get('/:id', silverLoanController.getSilverLoanById);

// Loan specific operations
router.get('/:id/payment-history', silverLoanController.getPaymentHistory);
router.put('/:id/close', silverLoanController.closeSilverLoan);

// Interest payments
router.post('/:loanId/interest-payment', silverLoanController.addInterestPayment);
router.get('/:loanId/interest-payments', silverLoanController.getInterestPayments);

// Repayments
router.get('/:id/repayments', silverLoanController.getRepayments);
router.get('/:id/repayment-stats', silverLoanController.getRepaymentStats);
router.post('/:id/validate-repayment', silverLoanController.validateRepayment);

// Additional repayment routes
router.get('/repayments/search', silverLoanController.searchAllRepayments);
router.get('/repayments/:repaymentId', silverLoanController.getRepaymentDetails);
router.get('/repayments/:repaymentId/receipt', silverLoanController.getRepaymentReceipt);
router.put('/repayments/:repaymentId/cancel', silverLoanController.cancelRepayment);

// Transactions and summaries
router.get('/:id/transactions', silverLoanController.getLoanTransactions);
router.get('/daily-summary', silverLoanController.getDailySilverLoanSummary);
router.get('/:id/active-items', silverLoanController.getActiveItemsForReturn);
router.post('/:id/return-items', silverLoanController.processItemReturn);

export default router;