import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';
import * as reportController from '../controllers/reportController.js'; // ✅ Correct import name

const router = express.Router();

// Interest calculation (should be before /:id routes)
router.get('/calculate/interest', goldLoanController.calculateInterest);

// Analytics and reports (should be before /:id routes)
router.get('/analytics/pending-interest', goldLoanController.getPendingInterest);
router.get('/analytics/dashboard', goldLoanController.getDashboardStats);
router.get('/analytics/business', reportController.getBusinessAnalytics); // ✅ Fixed: reportController not reportsController
router.get('/analytics/overdue', reportController.getOverdueReport); // ✅ Fixed

// Payment history
router.get('/payments/history', goldLoanController.getAllPaymentHistory);

// Reports
router.get('/reports/monthly-income', reportController.getMonthlyIncomeReport); // ✅ Fixed

// Customer specific routes (MOVED UP - before /:id route)
router.get('/customer/:customerId', goldLoanController.getGoldLoansByCustomer);
router.get('/customer/:customerId/summary', goldLoanController.getCustomerLoanSummary);

// Basic CRUD operations
router.post('/', goldLoanController.createGoldLoan);
router.get('/', goldLoanController.getAllGoldLoans);
router.get('/:id', goldLoanController.getGoldLoanById); // MOVED DOWN - after specific routes

// Loan specific operations
router.get('/:id/report', goldLoanController.getLoanReport);
router.get('/:id/timeline', reportController.getLoanTimeline); // ✅ Fixed

// Payment operations
router.post('/:id/payments', goldLoanController.addPayment);
router.post('/:id/interest-payment', goldLoanController.addInterestPayment);

// Item management
router.post('/:id/items', goldLoanController.addItems);
router.put('/:id/items/:itemId', goldLoanController.updateItem);
router.delete('/:id/items/:itemId', goldLoanController.removeItem);

// Loan management
router.put('/:id/close', goldLoanController.closeGoldLoan);
router.post('/:id/return-items', goldLoanController.returnItems);
router.put('/:id/complete', goldLoanController.completeGoldLoan);

// Validation endpoints
router.get('/:id/validate-closure', goldLoanController.validateLoanClosure);
router.get('/:id/outstanding-summary', goldLoanController.getOutstandingSummary);

export default router;