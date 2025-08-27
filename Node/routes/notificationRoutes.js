import express from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.post('/', notificationController.createNotification);
router.get('/', notificationController.getAllNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);

export default router;