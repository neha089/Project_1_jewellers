import express from 'express';
import { getAllTransactions, getRecentTransactions } from '../controllers/transactionController.js';

const router = express.Router();

router.get('/', getAllTransactions);
router.get('/recent', getRecentTransactions);

export default router;
