import express from 'express';
import * as udhariController from '../controllers/udhariController.js';

const router = express.Router();

router.post('/give', udhariController.giveUdhari);
router.post('/receive', udhariController.receiveUdhariPayment);
router.get('/', udhariController.getAllUdhariTransactions);
router.get('/outstanding/:customer', udhariController.getOutstandingUdhari);

export default router;
