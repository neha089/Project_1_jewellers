import express from 'express';
import * as goldPurchaseController from '../controllers/goldPurchaseController.js';

const router = express.Router();

router.post('/', goldPurchaseController.createGoldPurchase);
router.get('/', goldPurchaseController.getAllGoldPurchases);

export default router;