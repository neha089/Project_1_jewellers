import express from 'express';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();

// Create a new loan
router.post('/', loanController.createLoan);

// Get all loans with filtering and pagination
router.get('/', loanController.getAllLoans);

// Get loans by customer ID
router.get('/customer/:customerId', loanController.getLoansByCustomer);

// Get loan reminders (overdue payments)
router.get('/reminders', loanController.getLoanReminders);

// Get specific loan details with payment history
router.get('/:id', loanController.getLoanDetails);

// Pay loan interest
router.post('/:id/interest-payment', loanController.payLoanInterest);

// Pay loan principal (partial or full payment)
router.post('/:id/principal-payment', loanController.payLoanPrincipal);

// Update interest rate for a loan (admin function)
router.patch('/:id/interest-rate', loanController.updateInterestRate);

// Mark reminder as sent
router.patch('/:id/reminder-sent', loanController.markReminderSent);

export default router;