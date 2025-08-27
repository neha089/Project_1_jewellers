import express from 'express';
import * as metalSaleController from '../controllers/metalSaleController.js';

const router = express.Router();

router.post('/', metalSaleController.createMetalSale);
router.get('/', metalSaleController.getAllMetalSales);

export default router;