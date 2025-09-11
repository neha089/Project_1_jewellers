import express from 'express';
import * as udhariController from '../controllers/udhariController.js';

const router = express.Router();

// Udhari management routes
router.post('/give', udhariController.giveUdhari);                    // Give udhari to someone
router.post('/take', udhariController.takeUdhari);                    // Take udhari from someone
router.post('/receive-payment', udhariController.receiveUdhariPayment); // Receive payment from someone who borrowed
router.post('/make-payment', udhariController.makeUdhariPayment);     // Make payment to someone from whom you borrowed

// Get udhari data
router.get('/', udhariController.getAllUdhariTransactions);           // Get all udhari transactions with filters
router.get('/customer/:customerId', udhariController.getCustomerUdhariTransactions); // Get specific customer udhari details
router.get('/payment-history/:udhariId', udhariController.getUdhariPaymentHistory); // Get payment history for specific udhari

// Outstanding amounts
router.get('/outstanding/collect', udhariController.getOutstandingUdhariToCollect);   // Money you need to collect
router.get('/outstanding/payback', udhariController.getOutstandingUdhariToPayBack);   // Money you need to pay back

// Summary and analytics
router.get('/summary', udhariController.getUdhariSummary);            // Overall udhari summary
router.get('/customers', udhariController.getUdhariCustomers);        // All customers with udhari transactions

export default router;