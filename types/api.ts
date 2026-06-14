export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface WaterSource {
  id: number;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  source_type: string | null;
  status: string;
  risk_level: string | null;
  is_active: boolean;
  description: string | null;
  population_served: number | null;
  readings_count: number;
  last_reading_at: string | null;
  last_risk_score: number | null;
  drinkability_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaterQualityReading {
  id: number;
  water_source_id: number;
  water_source?: WaterSource;
  sensor_id: number | null;
  technician_id: number | null;
  reading_time: string;
  turbidity: number | null;
  residual_chlorine: number | null;
  conductivity: number | null;
  ph: number | null;
  temperature: number | null;
  dissolved_oxygen: number | null;
  total_dissolved_solids: number | null;
  oxidation_reduction_potential: number | null;
  risk_score: number | null;
  quality_classification: string | null;
  water_color: string | null;
  water_smell: string | null;
  water_taste: string | null;
  particles: string | null;
  visual_observations: string | null;
  reading_method: string;
  is_manual_reading: boolean;
  notes: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  water_source: {
    id: number;
    name: string;
    location: string | null;
  };
  reading_id: number | null;
  sensor_id: number | null;
  alert_type: string;
  alert_type_name: string;
  priority: string;
  priority_color: string;
  status: string;
  title: string;
  description: string;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  threshold_value: number | null;
  current_value: number | null;
  additional_data: any;
  is_active: boolean;
  needs_escalation: boolean;
  created_at: string;
}

export interface WaterAnalysis {
  id: number;
  water_source_id: number | null;
  water_source?: WaterSource;
  user_id: number | null;
  image_path: string | null;
  image_url: string | null;
  safety_level: string;
  risk_score: number;
  confidence_score: number;
  ai_provider: string;
  ai_model: string;
  result: string;
  observations: string | null;
  recommendation: string | null;
  source_type: string | null;
  location: string | null;
  // Simplified user-facing fields
  user_friendly_status: string | null;
  status_color: string | null;
  one_line_advice: string | null;
  simple_indicators: SimpleIndicator[] | null;
  locale: string;
  device_id: string | null;
  app_version: string | null;
  synced_at: string | null;
  created_at: string;
}

export interface SimpleIndicator {
  label: string;
  color: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserFriendlyResult {
  status: string;
  safety_level: string;
  icon?: string;
  color: string;
  bg_color: string;
  text_color: string;
  one_line_advice: string;
  risk_score: number;
  risk_percentage?: number;
  confidence: number;
  indicators: SimpleIndicator[];
  boil_required: boolean;
}

export interface ParameterAssessment {
  name: string;
  key: string;
  value: string;
  quality_level: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  quality_label: string;
  color: string;
  status: string;
  health_impacts?: string[];
  treatment_recommendations?: string[];
}

export interface Solution {
  id: number;
  title: string;
  description: string;
  category: string;
  immediate_actions: string[];
  long_term_solutions: string[];
  prevention_tips: string[];
  steps: string[];
  required_materials: string[];
  cost_level: string;
  time_level: string;
  requires_professional: boolean;
}

export interface DetailedAnalysisResult {
  safety_level: string;
  risk_score: number;
  confidence_score: number;
  safety_verdict: string;
  primary_concerns: string[];
  visual_assessment: {
    clarity: string;
    color: string;
    particles: boolean;
    particle_description?: string;
    surface_condition: string;
  };
  six_dimensions: Record<string, any>;
  contamination_analysis: {
    bacterial_risk: string;
    chemical_signs: boolean;
    physical_contamination: boolean;
    health_implications?: string[];
  };
  recommendations: {
    immediate_actions: string[];
    treatment_methods: string[];
    boiling_required: boolean;
    long_term_solutions?: string[];
  };
  community_guidance: {
    warning_signs: string[];
    preventive_measures: string[];
  };
  ai_provider: string;
  ai_model: string;
  // DB standards-backed analysis
  standards_analysis?: Record<string, ParameterAssessment>;
  health_concerns?: string[];
  solutions?: Solution[];
}

export interface WaterAnalysisApiResponse {
  success: boolean;
  message?: string;
  result: UserFriendlyResult;
  detailed: DetailedAnalysisResult;
  reading_id: number | null;
  retake_required?: boolean;
  retake_message?: string;
  retake_reasons?: string[];
}

export interface WaterQualityThreshold {
  id: number;
  parameter: string;
  country_code: string;
  standard_name: string;
  min_value: number | null;
  max_value: number | null;
  unit: string;
  user_level: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  user_color: 'green' | 'light_green' | 'yellow' | 'orange' | 'red';
  user_message_key: string;
  action_required: Record<string, boolean> | null;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CreateReadingRequest {
  water_source_id: number;
  sensor_id?: number;
  turbidity?: number;
  residual_chlorine?: number;
  conductivity?: number;
  ph?: number;
  temperature?: number;
  dissolved_oxygen?: number;
  total_dissolved_solids?: number;
  oxidation_reduction_potential?: number;
  water_color?: string;
  water_smell?: string;
  water_taste?: string;
  particles?: string;
  visual_observations?: string;
  type?: 'manual' | 'sensor' | 'photo';
  riskScore?: number;
  quality?: string;
  notes?: string;
}
