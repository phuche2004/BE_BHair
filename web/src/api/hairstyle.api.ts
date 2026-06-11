import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1000/api/v1';

const aiAxios = axios.create({
  baseURL: `${API_URL}/ai`,
  timeout: 60000, // 60 seconds
});

export interface FaceAnalysis {
  face_shape: string;
  skin_tone: string;
  scores: Record<string, number>;
  face_ratio: number;
  jaw_ratio: number;
  forehead_ratio: number;
}

export interface HairstyleRecommendations {
  face_shape: string;
  skin_tone: string;
  styles: string[];
  description: string;
  avoid: string;
  color_tip: string;
}

export interface HairstyleImages {
  original: string;
  edited: string | null;
  illustration: string | null;
  status: 'full' | 'illustration_only' | 'failed' | 'no_api_key';
  style_applied: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: FaceAnalysis;
  recommendations: HairstyleRecommendations;
  advice_text: string;
  images: HairstyleImages;
}

export interface TryStyleResponse {
  success: boolean;
  images: HairstyleImages;
}

export async function analyzePhoto(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await aiAxios.post<AnalyzeResponse>('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function tryStyle(file: File, style: string): Promise<TryStyleResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await aiAxios.post<TryStyleResponse>(
    `/try-style?style=${encodeURIComponent(style)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data;
}

export async function healthCheck(): Promise<{ status: string; gemini_configured: boolean }> {
  const response = await aiAxios.get('/api/health');
  return response.data;
}
