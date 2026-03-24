export interface Person {
  id: number;
  name: string;
  photo_url: string;
  created_at: string;
  has_embedding: boolean;
}

export interface PersonsResponse {
  total: number;
  page: number;
  limit: number;
  persons: Person[];
}

export interface MatchResult {
  person_id: number;
  name: string;
  photo_url: string;
  is_match: boolean;
  similarity_percentage: number;
  model_scores?: {
    arcface?: {
      cosine_raw: number;
      normalized_pct: number;
      weight: number;
    };
  };
  threshold_used?: number;
}

export interface FaceAnalysis {
  age?: number;
  dominant_gender?: string;
  gender_scores?: Record<string, number>;
  dominant_emotion?: string;
  emotion_scores?: Record<string, number>;
  error?: string;
}

export interface DetectionData {
  has_glasses: boolean;
  glasses_details?: {
    has_glasses: boolean;
    faces_found: number;
    details: Array<{
      face_bbox: number[];
      has_glasses: boolean;
      confidence: number;
    }>;
  };
}

export interface GestionateResult {
  already_registered: boolean;
  message?: string;
  registrado?: boolean;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  estado?: string;
  error?: string;
}


export interface CompareResponse {
  comparison_id: number;
  query_photo_url: string;
  total_compared: number;
  matches_found: number;
  results: MatchResult[];
  face_analysis: FaceAnalysis;
  detection: DetectionData;
  llm_analysis: string;
  best_match: MatchResult | null;
  gestionate?: GestionateResult | null;
}
