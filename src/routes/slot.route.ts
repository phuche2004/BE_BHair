import express from 'express';
import * as slotController from '../controllers/slot.controller';

const router = express.Router();

// Public route to check availability
router.get('/shop/:shopId/slots', slotController.getAvailableSlots);

export default router;
