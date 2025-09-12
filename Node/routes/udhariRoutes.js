import express from 'express';
import * as udhariController from '../controllers/udhariController.js';

const router = express.Router();

// Core udhari operations
router.post('/give', udhariController.giveUdhari);                    // Give money to someone (lend)
router.post('/take', udhariController.takeUdhari);                    // Take money from someone (borrow)

// Payment operations
router.post('/receive-payment', udhariController.receiveUdhariPayment); // Receive payment from someone who borrowed
router.post('/make-payment', udhariController.makeUdhariPayment);       // Make payment to someone you borrowed from

// Customer specific data
router.get('/customer/:customerId', udhariController.getCustomerUdhariSummary); // Get all udhari data for specific customer

// Outstanding amounts

router.get('/outstanding/collect', udhariController.getOutstandingToCollect);   // Money you need to collect from others
router.get('/outstanding/pay', udhariController.getOutstandingToPay);           // Money you need to pay to others

// Summary and analytics
router.get('/summary', udhariController.getOverallUdhariSummary);               // Overall udhari summary

// Payment history
router.get('/payment-history/:udhariId', udhariController.getPaymentHistory);   // Payment history for specific udhari

export default router;