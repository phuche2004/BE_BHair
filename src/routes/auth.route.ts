import express from 'express';
import * as authController from '../controllers/auth.controller';
import upload from '../config/multer.config';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
// Allow single file upload for 'avatar' field
router.post('/register', upload.single('avatar'), authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);

export default router;
