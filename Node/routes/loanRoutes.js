import express from 'express';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();

router.post('/', loanController.createLoan);
router.get('/', loanController.getAllLoans);
router.post('/:id/interest-payment', loanController.payLoanInterest);
router.post('/:id/principal-payment', loanController.payLoanPrincipal);

export default router;