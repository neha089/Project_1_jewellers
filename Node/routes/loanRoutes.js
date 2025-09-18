import express from 'express';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();

// Core loan operations
router.post('/give', loanController.giveLoan);                    // Give money to someone (lend)
router.post('/take', loanController.takeLoan);                    // Take money from someone (borrow)

// Payment operations
router.post('/receive-payment', loanController.receiveLoanPayment); // Receive payment from someone who borrowed
router.post('/make-payment', loanController.makeLoanPayment);       // Make payment to someone you borrowed from

// Customer specific data
router.get('/customer/:customerId', loanController.getCustomerLoanSummary); // Get all loan data for specific customer

// Outstanding amounts
router.get('/outstanding/collect', loanController.getOutstandingToCollect); // Money you need to collect from others
router.get('/outstanding/pay', loanController.getOutstandingToPay);         // Money you need to pay to others

// Summary and analytics
router.get('/summary', loanController.getOverallLoanSummary);               // Overall loan summary

// Payment history
router.get('/payment-history/:loanId', loanController.getPaymentHistory);   // Payment history for specific loan

// Reminders and interest rate updates
router.get('/reminders', loanController.getLoanReminders);                  // Get overdue loan reminders
router.patch('/:id/interest-rate', loanController.updateInterestRate);      // Update interest rate for a loan
router.patch('/:id/reminder-sent', loanController.markReminderSent);        // Mark reminder as sent

export default router;
