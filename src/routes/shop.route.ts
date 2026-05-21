import express from 'express';
import * as shopController from '../controllers/shop.controller';
import upload from '../config/multer.config';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Configure Multer for multiple fields
const cpUpload = upload.fields([
    { name: 'images1', maxCount: 5 },
    { name: 'images2', maxCount: 5 },
    { name: 'images3', maxCount: 5 },
    { name: 'videos', maxCount: 2 }
]);

// Protected Routes
router.post('/', authMiddleware.verifyToken, cpUpload, shopController.createShop);
router.get('/my-shops', authMiddleware.verifyToken, shopController.getMyShops);
router.get('/:shopId/history', authMiddleware.verifyToken, shopController.getShopHistory);
router.put('/:id', authMiddleware.verifyToken, shopController.updateShop);

// Public Routes
router.get('/:id', shopController.getShopById);

export default router;
