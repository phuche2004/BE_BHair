import { GoogleGenAI, Type, Schema } from "@google/genai";

export class AIService {
    private ai?: GoogleGenAI;
    private useFpt: boolean = false;
    private fptApiKey?: string;
    private fptBaseUrl: string = 'https://mkp-api.fptcloud.com/v1';
    private fptModel: string = 'Qwen2.5-VL-7B-Instruct';

    constructor() {
        const fptKey = process.env.FPT_MARKETPLACE_API_KEY;
        if (fptKey) {
            this.useFpt = true;
            this.fptApiKey = fptKey;
            this.fptBaseUrl = process.env.FPT_MARKETPLACE_BASE_URL || 'https://mkp-api.fptcloud.com/v1';
            this.fptModel = process.env.FPT_MARKETPLACE_MODEL || 'Qwen2.5-VL-7B-Instruct';
            // console.log("AI Service initialized with FPT Marketplace API."); // Suppressed in PM2 cluster
        } else {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                // console.warn("WARNING: Neither FPT_MARKETPLACE_API_KEY nor GEMINI_API_KEY is set in environment variables."); // Suppressed in PM2 cluster
            }
            this.ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });
            // console.log("AI Service initialized with Gemini API."); // Suppressed in PM2 cluster
        }
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
5. Mô tả (description): Tại sao những kiểu tóc này lại phù hợp (BẮT BUỘC viết bằng TIẾNG VIỆT).
6. Nên tránh (avoid): Những kiểu tóc nào làm lộ khuyết điểm (BẮT BUỘC viết bằng TIẾNG VIỆT).
7. Gợi ý màu tóc (color_tip): Màu tóc phù hợp với tông da (BẮT BUỘC viết bằng TIẾNG VIỆT).
8. Lời khuyên chi tiết (advice_text): Lời khuyên tư vấn như đang chat với khách hàng (BẮT BUỘC viết bằng TIẾNG VIỆT, dùng Markdown, có thể xuống dòng, in đậm).

QUY TẮC CỰC KỲ QUAN TRỌNG: Tất cả các phần văn bản mô tả (bao gồm 'description', 'avoid', 'color_tip' và 'advice_text') đều phải được viết hoàn toàn bằng TIẾNG VIỆT. Không sử dụng tiếng Anh cho các trường này.`;

            if (this.useFpt && this.fptApiKey) {
                const responseSchemaStructure = {
                    analysis: {
                        face_shape: "string (Oval, Round, Square, Heart, Oblong, hoặc Diamond)",
                        skin_tone: "string (Warm, Cool, hoặc Neutral)",
                        scores: {
                            Oval: "number",
                            Round: "number",
                            Square: "number",
                            Heart: "number",
                            Oblong: "number",
                            Diamond: "number"
                        }
                    },
                    recommendations: {
                        styles: ["string (list of 2-3 recommended hairstyle names)"],
                        description: "string (why these styles match)",
                        avoid: "string (styles to avoid)",
                        color_tip: "string (hair color recommendations)"
                    },
                    advice_text: "string (detailed styling advice using Markdown)"
                };

                console.log(`Calling FPT Marketplace API using model ${this.fptModel}...`);
                let response = await fetch(`${this.fptBaseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.fptApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.fptModel,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: prompt + "\n\nCRITICAL REQUIREMENT: You MUST return a valid JSON object matching the requested schema structure. Do not include any other text, markdown formatting blocks, or explanations outside the JSON object. The response must start with '{' and end with '}'.\nStructure:\n" + JSON.stringify(responseSchemaStructure, null, 2)
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`
                                        }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.7
                    })
                });

                if (response.status === 400) {
                    const errText = await response.text();
                    if (errText.includes('response_format') || errText.includes('format')) {
                        console.warn("FPT Marketplace API does not support response_format. Retrying without it...");
                        response = await fetch(`${this.fptBaseUrl}/chat/completions`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.fptApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: this.fptModel,
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: prompt + "\n\nCRITICAL REQUIREMENT: You MUST return a valid JSON object matching the requested schema structure. Do not include any other text, markdown formatting blocks, or explanations outside the JSON object. The response must start with '{' and end with '}'.\nStructure:\n" + JSON.stringify(responseSchemaStructure, null, 2)
                                            },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`
                                                }
                                            }
                                        ]
                                    }
                                ],
                                temperature: 0.7
                            })
                        });
                    } else {
                        throw new Error(`FPT Marketplace API error (400): ${errText}`);
                    }
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`FPT Marketplace API error (${response.status}): ${errText}`);
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error("No content returned from FPT Marketplace model");
                }

                let jsonText = content.trim();
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
                }

                return JSON.parse(jsonText);
            }

            if (!this.ai) {
                throw new Error("AI Service is not properly initialized.");
            }

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

