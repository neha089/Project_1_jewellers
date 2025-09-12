import express from 'express';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();

// Create a new loan (given or taken)
router.post('/', loanController.createLoan);

// Get all loans with filtering and pagination
router.get('/', loanController.getAllLoans);

// Get loan reminders (overdue payments) - should be before /:id routes
router.get('/reminders', loanController.getLoanReminders);

// Get loans by customer ID
router.get('/customer/:customerId', loanController.getLoansByCustomer);

// Get specific loan details with payment history
router.get('/:id', loanController.getLoanDetails);

// Pay loan interest only
router.post('/:id/interest-payment', loanController.payLoanInterest);

// Pay loan principal only (partial or full payment)
router.post('/:id/principal-payment', loanController.payLoanPrincipal);

// Combined payment endpoint (both principal and interest)
// This is the main endpoint for loan repayments from the frontend
router.post('/:id/payments', loanController.makeLoanPayment);

// Update interest rate for a loan (admin function)
router.patch('/:id/interest-rate', loanController.updateInterestRate);

// Mark reminder as sent
router.patch('/:id/reminder-sent', loanController.markReminderSent);

export default router;
