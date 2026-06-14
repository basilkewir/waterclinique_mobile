/**
 * StorageService — user data is stored on the backend, not locally.
 * This file retains only the TypeScript types used by other modules.
 */

export interface WaterAnalysisData {
  id: string;
  timestamp?: number;
  date: string;
  source: string;
  location?: string;
  inputMethod: 'manual' | 'image' | 'sensor';
  qualityScore: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  riskScore?: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  color?: string;
  smell?: string;
  taste?: string;
  hasParticles?: boolean;
  particles?: string;
  issues: string[];
  recommendations: string[];
  imageUris?: string[];
  imageAnalysis?: any;
  standardCompliance?: any;
}

export interface WaterSource {
  id: string;
  name: string;
  type: string;
  location: string;
  isActive: boolean;
  createdDate: string;
  lastTestDate?: string;
  averageQuality?: number;
}
