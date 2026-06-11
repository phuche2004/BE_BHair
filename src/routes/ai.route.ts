import express from 'express';
import multer from 'multer';
import { analyzeFace } from '../controllers/ai.controller';

const router = express.Router();

// Configure multer to store file in memory so we can send the buffer directly to Gemini
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

// POST /api/v1/ai/analyze
router.post('/analyze', upload.single('image'), analyzeFace);

// POST /api/v1/ai/try-style (for future implementation)
router.post('/try-style', upload.single('image'), (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export default router;
