"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFace = void 0;
const ai_service_1 = require("../services/ai.service");
const analyzeFace = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided' });
            return;
        }
        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        // Call AI Service
        const aiResult = yield ai_service_1.aiService.analyzeFace(imageBuffer, mimeType);
        // Prepare the original image base64 for the frontend
        const originalBase64 = imageBuffer.toString('base64');
        res.status(200).json({
            success: true,
            analysis: aiResult.analysis,
            recommendations: aiResult.recommendations,
            advice_text: aiResult.advice_text,
            images: {
                original: originalBase64,
                edited: null,
                illustration: null,
                status: "text_only",
                style_applied: aiResult.recommendations.styles[0] || "Unknown"
            }
        });
    }
    catch (error) {
        console.error('Analyze Face Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing face',
            error: error.message
        });
    }
});
exports.analyzeFace = analyzeFace;
