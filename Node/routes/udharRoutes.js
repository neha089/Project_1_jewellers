import express from 'express';
import {
    giveUdhar,
    takeUdhar,
    receiveUdharPayment,
    makeUdharPayment,
    getCustomerUdharSummary,
    getOutstandingToCollect,
    getOutstandingToPay,
    getOverallUdharSummary,
    getPaymentHistory,
    getUdharReminders,
    markReminderSent

} from '../controllers/udharController.js';

const router = express.Router();

// Core udhar operations
router.post('/give', giveUdhar);                    // Give money to someone (lend)
router.post('/take', takeUdhar);                    // Take money from someone (borrow)

// Payment operations
router.post('/receive-payment', receiveUdharPayment); // Receive payment from someone who borrowed
router.post('/make-payment', makeUdharPayment);       // Make payment to someone you borrowed from

// Customer specific data
router.get('/customer/:customerId', getCustomerUdharSummary); // Get all udhar data for specific customer

// Outstanding amounts
router.get('/outstanding/collect', getOutstandingToCollect); // Money you need to collect from others
router.get('/outstanding/pay', getOutstandingToPay);         // Money you need to pay to others

// Summary and analytics
router.get('/summary', getOverallUdharSummary);               // Overall udhar summary

// Payment history
router.get('/payment-history/:udharId', getPaymentHistory);   // Payment history for specific udhar

// Reminders
router.get('/reminders', getUdharReminders);                  // Get overdue udhar reminders
router.patch('/:id/reminder-sent', markReminderSent);         // Mark reminder as sent

export default router;
