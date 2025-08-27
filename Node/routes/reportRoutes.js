import express from 'express';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.get('/customer/:customerId/statement', reportController.getCustomerStatement);
router.get('/customer/:customerId/statement/export', reportController.exportCustomerStatement);
router.get('/gold-loans/export', reportController.exportAllGoldLoans);
router.get('/transactions/export', reportController.exportAllTransactions);

export default router;