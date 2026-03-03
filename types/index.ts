export interface Person {
  id: number;
  name: string;
  photo_url: string;
  created_at: string;
  has_embedding: boolean;
}

export interface MatchResult {
  person_id: number;
  name: string;
  photo_url: string;
  cosine_similarity: number;
  cosine_distance: number;
  similarity_percentage: number;
  euclidean_distance: number;
  is_match: boolean;
}

export interface FaceAnalysis {
  age?: number;
  dominant_gender?: string;
  gender_scores?: Record<string, number>;
  dominant_emotion?: string;
  emotion_scores?: Record<string, number>;
  error?: string;
}

export interface Detection {
  class: string;
  confidence_pct: number;
  bbox: number[];
}

export interface DetectionData {
  detections: Detection[];
  persons_count: number;
  total_objects: number;
  has_glasses: boolean;
  glasses_details?: {
    has_glasses: boolean;
    faces_found: number;
    details: Array<{
      face_bbox: number[];
      has_glasses: boolean;
      glasses_detections: number;
    }>;
  };
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
}

export interface HistoryItem {
  id: number;
  query_photo_url: string;
  best_match_name: string | null;
  best_match_score: number | null;
  has_glasses: boolean;
  created_at: string;
}
