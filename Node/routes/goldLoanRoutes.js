// routes/goldLoanRoutes.js
import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// GOLD PRICE MANAGEMENT (Before /:id routes)
router.get('/current-gold-prices', goldLoanController.getCurrentGoldPrices);
router.post('/update-gold-prices', goldLoanController.updateGoldPrices);
router.get('/calculate-amount', goldLoanController.calculateLoanAmount);

// INTEREST CALCULATION AND MANAGEMENT
router.get('/calculate/interest', goldLoanController.calculateInterest);

// ANALYTICS AND REPORTS
router.get('/analytics/pending-interest', goldLoanController.getPendingInterest);
router.get('/analytics/dashboard', goldLoanController.getDashboardStats);
router.get('/analytics/business', reportController.getBusinessAnalytics);
router.get('/analytics/overdue', reportController.getOverdueReport);

// PAYMENT HISTORY
router.get('/payments/history', goldLoanController.getAllPaymentHistory);

// REPORTS
router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport);

// CUSTOMER SPECIFIC ROUTES (Before /:id route)
router.get('/customer/:customerId', goldLoanController.getGoldLoansByCustomer);
router.get('/customer/:customerId/summary', goldLoanController.getCustomerLoanSummary);

// BASIC CRUD OPERATIONS
router.post('/', goldLoanController.createGoldLoan);
router.get('/', goldLoanController.getAllGoldLoans);
router.get('/:id', goldLoanController.getGoldLoanById);

// LOAN SPECIFIC OPERATIONS
router.get('/:id/report', goldLoanController.getLoanReport);
router.get('/:id/timeline', reportController.getLoanTimeline);

// ENHANCED PAYMENT OPERATIONS
router.post('/:id/payments', goldLoanController.addPayment);
router.post('/:id/interest-payment', goldLoanController.addInterestPayment);
router.get('/:id/interest-history', goldLoanController.getInterestPaymentHistory);

// NEW ENHANCED ENDPOINTS FOR YOUR REQUIREMENTS
router.get('/:id/interest-calculation', goldLoanController.getInterestCalculation);

// ENHANCED REPAYMENT OPERATIONS
router.get('/:id/repayment-options', goldLoanController.getRepaymentOptions);
router.post('/:id/process-repayment', goldLoanController.processItemRepayment);

// ITEM MANAGEMENT
router.post('/:id/items', goldLoanController.addItems);
router.put('/:id/items/:itemId', goldLoanController.updateItem);
router.delete('/:id/items/:itemId', goldLoanController.removeItem);

// LOAN MANAGEMENT
router.put('/:id/close', goldLoanController.closeGoldLoan);
router.post('/:id/return-items', goldLoanController.returnItems);
router.put('/:id/complete', goldLoanController.completeGoldLoan);

// VALIDATION ENDPOINTS
router.get('/:id/validate-closure', goldLoanController.validateLoanClosure);
router.get('/:id/outstanding-summary', goldLoanController.getOutstandingSummary);

export default router;