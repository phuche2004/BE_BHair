import { GoogleGenAI, Type, Schema } from "@google/genai";

export class AIService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });
    }

    public async analyzeFace(imageBuffer: Buffer, mimeType: string) {
        try {
            const prompt = `Bạn là một chuyên gia tư vấn tạo mẫu tóc hàng đầu.
Hãy phân tích bức ảnh khuôn mặt này và trả về kết quả dưới dạng JSON theo đúng cấu trúc yêu cầu.

Yêu cầu phân tích:
1. Hình dáng khuôn mặt (face_shape): Oval, Round, Square, Heart, Oblong, hoặc Diamond.
2. Tông màu da (skin_tone): Warm, Cool, hoặc Neutral.
3. Chấm điểm các hình dáng khuôn mặt (scores): Đánh giá phần trăm độ giống với từng hình dáng (tổng không cần bằng 100, thang điểm 100 cho mỗi dáng).
4. Gợi ý kiểu tóc (styles): Mảng chứa 3-4 tên kiểu tóc nam (nếu là nam) hoặc nữ (nếu là nữ) phù hợp nhất.
5. Mô tả (description): Tại sao những kiểu tóc này lại phù hợp.
6. Nên tránh (avoid): Những kiểu tóc nào làm lộ khuyết điểm.
7. Gợi ý màu tóc (color_tip): Màu tóc phù hợp với tông da.
8. Lời khuyên chi tiết (advice_text): Lời khuyên tư vấn như đang chat với khách hàng (dùng Markdown, có thể xuống dòng, in đậm).`;

            const responseSchema: Schema = {
                type: Type.OBJECT,
                properties: {
                    analysis: {
                        type: Type.OBJECT,
                        properties: {
                            face_shape: { type: Type.STRING },
                            skin_tone: { type: Type.STRING },
                            scores: {
                                type: Type.OBJECT,
                                properties: {
                                    Oval: { type: Type.NUMBER },
                                    Round: { type: Type.NUMBER },
                                    Square: { type: Type.NUMBER },
                                    Heart: { type: Type.NUMBER },
                                    Oblong: { type: Type.NUMBER },
                                    Diamond: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["face_shape", "skin_tone", "scores"]
                    },
                    recommendations: {
                        type: Type.OBJECT,
                        properties: {
                            styles: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            description: { type: Type.STRING },
                            avoid: { type: Type.STRING },
                            color_tip: { type: Type.STRING }
                        },
                        required: ["styles", "description", "avoid", "color_tip"]
                    },
                    advice_text: { type: Type.STRING }
                },
                required: ["analysis", "recommendations", "advice_text"]
            };

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    prompt,
                    {
                        inlineData: {
                            data: imageBuffer.toString("base64"),
                            mimeType: mimeType
                        }
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.7,
                }
            });

            const responseText = response.text;
            if (!responseText) {
                throw new Error("No response from Gemini");
            }

            const parsed = JSON.parse(responseText);
            return parsed;

        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    }
}

export const aiService = new AIService();
