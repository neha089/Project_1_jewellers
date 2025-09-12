// routes/silverLoanRoutes.js
import express from 'express';
import * as silverLoanController from '../controllers/silverLoanController.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// GOLD PRICE MANAGEMENT (Before /:id routes)
router.get('/current-silver-prices', silverLoanController.getCurrentGoldPrices);
router.post('/update-silver-prices', silverLoanController.updateGoldPrices);
router.get('/calculate-amount', silverLoanController.calculateLoanAmount);

// INTEREST CALCULATION AND MANAGEMENT
router.get('/calculate/interest', silverLoanController.calculateInterest);

// ANALYTICS AND REPORTS
router.get('/analytics/pending-interest', silverLoanController.getPendingInterest);
router.get('/analytics/dashboard', silverLoanController.getDashboardStats);
router.get('/analytics/business', reportController.getBusinessAnalytics);
router.get('/analytics/overdue', reportController.getOverdueReport);

// PAYMENT HISTORY
router.get('/payments/history', silverLoanController.getAllPaymentHistory);

// REPORTS
router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport);

// CUSTOMER SPECIFIC ROUTES (Before /:id route)
// router.get('/customer/:customerId', silverLoanController.getGoldLoansByCustomer);
router.get('/customer/:customerId/summary', silverLoanController.getCustomerLoanSummary);

// BASIC CRUD OPERATIONS
// router.post('/', silverLoanController.createGoldLoan);
// router.get('/', silverLoanController.getAllGoldLoans);
// router.get('/:id', silverLoanController.getGoldLoanById);

// LOAN SPECIFIC OPERATIONS
router.get('/:id/report', silverLoanController.getLoanReport);
router.get('/:id/timeline', reportController.getLoanTimeline);

// ENHANCED PAYMENT OPERATIONS
router.post('/:id/payments', silverLoanController.addPayment);
router.post('/:id/interest-payment', silverLoanController.addInterestPayment);
router.get('/:id/interest-history', silverLoanController.getInterestPaymentHistory);

// NEW ENHANCED ENDPOINTS FOR YOUR REQUIREMENTS
router.get('/:id/interest-calculation', silverLoanController.getInterestCalculation);

// ENHANCED REPAYMENT OPERATIONS
router.get('/:id/repayment-options', silverLoanController.getRepaymentOptions);
router.post('/:id/process-repayment', silverLoanController.processItemRepayment);

// ITEM MANAGEMENT
router.post('/:id/items', silverLoanController.addItems);
router.put('/:id/items/:itemId', silverLoanController.updateItem);
router.delete('/:id/items/:itemId', silverLoanController.removeItem);

// LOAN MANAGEMENT
// router.put('/:id/close', silverLoanController.closeGoldLoan);
router.post('/:id/return-items', silverLoanController.returnItems);
// router.put('/:id/complete', silverLoanController.completeGoldLoan);

// VALIDATION ENDPOINTS
router.get('/:id/validate-closure', silverLoanController.validateLoanClosure);
router.get('/:id/outstanding-summary', silverLoanController.getOutstandingSummary);

export default router;