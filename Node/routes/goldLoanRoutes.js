import express from 'express';
import * as goldLoanController from '../controllers/goldLoanController.js';

const router = express.Router();

router.post('/', goldLoanController.createGoldLoan);
router.get('/', goldLoanController.getAllGoldLoans);
router.get('/:id', goldLoanController.getGoldLoanById);
router.post('/:id/payments', goldLoanController.addPayment);
router.put('/:id/close', goldLoanController.closeGoldLoan);

export default router;