import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const analyzeFace = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided' });
            return;
        }

        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // Call AI Service
        const aiResult = await aiService.analyzeFace(imageBuffer, mimeType);

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

    } catch (error: any) {
        console.error('Analyze Face Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error analyzing face', 
            error: error.message 
        });
    }
};
