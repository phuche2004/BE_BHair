import express from 'express';
import * as reviewController from '../controllers/review.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Public
router.get('/shop/:shopId', reviewController.getShopReviews);

// Protected
router.post('/', authMiddleware.verifyToken, reviewController.createReview);

export default router;
