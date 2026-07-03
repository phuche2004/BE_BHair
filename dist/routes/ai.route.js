"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const ai_controller_1 = require("../controllers/ai.controller");
const router = express_1.default.Router();
// Configure multer to store file in memory so we can send the buffer directly to Gemini
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});
// POST /api/v1/ai/analyze
router.post('/analyze', upload.single('image'), ai_controller_1.analyzeFace);
// POST /api/v1/ai/try-style (for future implementation)
router.post('/try-style', upload.single('image'), (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.default = router;
