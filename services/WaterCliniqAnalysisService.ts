/**
 * WaterCliniqAnalysisService — 3-Stage Analysis Pipeline
 *
 * Stage 1: Google Cloud Vision API (extract container, color, object data)
 *          → Quick container verification (glass + water? plastic?)
 *          → If failed: return retake immediately
 * Stage 2: Backend Laravel API (WaterImageAnalysisService)
 *          → Sends image + vision_data JSON
 *          → Backend injects Vision data into AI prompt as verified ground truth
 *          → Admin-selected AI (Claude/OpenAI/Gemini) analyzes using admin standards
 * Stage 3: Direct OpenAI/Claude Vision API (DirectAIService — bypasses backend)
 * Stage 4: Local fallback
 *
 * Each stage tries the next if the previous fails.
 * Results include AI metadata: model used, processing time, tokens.
 */

import SecureStorage from '@/services/SecureStorage';
import ApiService from './ApiService';
import DirectAIService, { AIAnalysisResult } from './DirectAIService';
import type { WaterSource } from './WaterDataService';
import LeakageDetectionService from './LeakageDetectionService';
import GoogleVisionService from './GoogleVisionService';
import { extractVisionData, VisionExtractedData } from './VisionWaterAnalyzer';

// ── Types ──

export interface VisualAssessment {
  clarity: string; color: string; particles: boolean;
  particle_description?: string; surface_condition: string; container_condition?: string;
}

export interface LeakageAssessment {
  leakage_detected: boolean; leakage_severity: 'none' | 'minor' | 'moderate' | 'major' | 'burst';
  leakage_type: string; pipe_condition: string; pipe_material?: string;
  estimated_water_loss_liters_per_day?: string; urgency: 'low' | 'medium' | 'high' | 'critical';
  leak_location?: string;
}

export interface SixDimensions {
  colour_score: number; colour_detail: string;
  clarity_score: number; clarity_detail: string;
  particles_score: number; particles_detail: string;
  rust_score: number; rust_detail: string;
  contamination_score: number; contamination_detail: string;
  who_compliance_score: number; who_compliance_detail: string;
  overall_six_dimension_score: number;
}

export interface SafetyAssessment {
  safety_level: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'DANGEROUS';
  risk_score: number; primary_concerns: string[]; safety_verdict?: string;
}

export interface ContaminationAnalysis {
  bacterial_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bacterial_indicators?: string[]; chemical_signs: boolean;
  chemical_indicators?: string[]; physical_contamination: boolean;
  physical_indicators?: string[]; environmental_factors: string[];
  contamination_sources?: string[]; health_implications?: string[];
}

export interface WaterRecommendations {
  immediate_actions: string[]; treatment_methods: string[];
  boiling_required: boolean; filtering_required?: boolean;
  alternative_source: boolean; infrastructure_repairs?: string[];
  long_term_solutions?: string[];
}

export interface CommunityGuidance {
  simple_tests: string[]; warning_signs: string[]; preventive_measures: string[];
  contact_authorities: boolean; outbreak_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  community_message?: string;
}

export interface AIMetadata {
  method: 'google_vision' | 'backend_ai' | 'openai_direct' | 'claude_direct' | 'local_engine';
  model?: string;
  processingTimeMs?: number;
  tokensUsed?: number;
  source: string;
}

export interface ContainerVerification {
  passed: boolean;
  container_type: string;
  reason: string;
  suggested_action: string;
}

export interface ObservationDiscrepancy {
  has_discrepancy: boolean;
  details?: string[];
  color_discrepancy?: { user_said: string; ai_detected: string; detail: string };
  particles_discrepancy?: { user_said: string; ai_detected: boolean; detail: string };
  clarity_discrepancy?: { user_said: string; ai_detected: string; detail: string };
  suggested_action?: string;
}

export interface WaterCliniqAnalysisResult {
  visual_assessment: VisualAssessment;
  leakage_assessment: LeakageAssessment;
  six_dimensions?: SixDimensions;
  safety_assessment: SafetyAssessment;
  contamination_analysis: ContaminationAnalysis;
  recommendations: WaterRecommendations;
  community_guidance: CommunityGuidance;
  confidence_score: number;
  analysis_timestamp: string;
  ai_metadata: AIMetadata;
  raw_analysis?: string;
  user_observations?: Record<string, string>;
  container_verification?: ContainerVerification;
  observation_discrepancy?: ObservationDiscrepancy;
  retake_required?: boolean;
  retake_message?: string;
  safetyColor: string;
  urgencyColor: string;
  summaryText: string;
}

export interface WaterCliniqObservations {
  color?: string; smell?: string; taste?: string;
  clarity?: string; foam?: string;
  location?: string; source_type?: string; notes?: string;
  leakage?: string; pipe_condition?: string; particles?: string;
  water_source_id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  context_mode?: 'water' | 'test_kit' | 'source_add';
}

export interface MultiImageInput {
  waterImage?: string; pipeImage?: string; environmentImage?: string;
}

// ── Constants ──

const SAFETY_COLORS: Record<string, string> = {
  SAFE: '#22c55e', CAUTION: '#eab308', UNSAFE: '#f97316', DANGEROUS: '#ef4444',
};
const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444',
};

// ── Service ──

class WaterCliniqAnalysisService {
  /**
   * 4-STAGE ANALYSIS PIPELINE
   *
   * Stage 1 → Google Cloud Vision API (extract container, colors, objects — no heuristic scoring)
   * Stage 2 → Backend Laravel API with vision_data context (admin-selected AI + admin standards)
   * Stage 3 → Direct OpenAI/Claude Vision API (bypasses backend)
   * Stage 4 → Local heuristic fallback
   */
  async analyze(imageUris: string[], observations: WaterCliniqObservations = {}): Promise<WaterCliniqAnalysisResult> {
    const startTime = Date.now();
    let visionData: VisionExtractedData | null = null;

    // Flush any cached analyses from previous offline sessions
    this.flushPendingAnalyses();

    // ── STAGE 1: Google Cloud Vision extraction ──
    try {
      await GoogleVisionService.init();
      if (GoogleVisionService.isConfigured()) {
        const visionResult = await GoogleVisionService.analyze(imageUris);
        if (visionResult.success) {
          visionData = extractVisionData(
            visionResult.objects,
            visionResult.labels,
            visionResult.colors,
            visionResult.fullText,
            visionResult.detectedText,
          );

          // Quick container check — fail fast for bad images
          if (!visionData.container.passed) {
            return {
              ...this.enrichFallback(),
              retake_required: true,
              retake_message: visionData.container.suggested_action,
              container_verification: {
                passed: visionData.container.passed,
                container_type: visionData.container.container_type,
                reason: visionData.container.reason,
                suggested_action: visionData.container.suggested_action,
              },
            };
          }

          console.log('[AI Pipeline] Vision extraction OK, sending to backend with vision_data...');
        }
      }
    } catch (err) {
      console.log('[AI Pipeline] Google Vision unavailable, proceeding without vision data...');
    }

    // ── STAGE 2: Backend API (with vision_data if available) ──
    try {
      const primaryUri = imageUris[0];
      const visionDataJson = visionData ? JSON.stringify(visionData) : undefined;
      const response = await ApiService.analyzeWaterImage(
        primaryUri,
        {
          water_source_id: observations.water_source_id,
          name: observations.name,
          color: observations.color, smell: observations.smell, taste: observations.taste,
          location: observations.location, source_type: observations.source_type,
          latitude: observations.latitude, longitude: observations.longitude,
          notes: [observations.notes, observations.clarity ? `clarity: ${observations.clarity}` : null, observations.foam ? `foam: ${observations.foam}` : null].filter(Boolean).join(' | ') || undefined,
          leakage: observations.leakage, pipe_condition: observations.pipe_condition,
          particles: observations.particles,
          context_mode: observations.context_mode ?? 'water',
        },
        visionDataJson,
      );

      if (response.success) {
        if (response.analysis?.retake_required) {
          return {
            ...this.enrichFallback(),
            retake_required: true,
            retake_message: response.analysis.retake_message ?? 'Please retake using a clear glass cup.',
            container_verification: response.analysis.container_verification,
            observation_discrepancy: response.analysis.observation_discrepancy,
          };
        }
        return this.enrich(response.analysis, {
          method: 'backend_ai',
          model: response.ai_model ?? 'backend-ai',
          source: `Laravel API (${response.ai_provider ?? 'AI'}) ${visionData ? '+ Vision data' : ''}`,
        });
      }
    } catch (err) {
      console.log('[AI Pipeline] Backend API unavailable, falling to direct AI...');
    }

    // ── STAGE 3: Direct OpenAI/Claude API ──
    try {
      const context: any = {
        ...observations,
        notes: [observations.notes, observations.clarity ? `clarity: ${observations.clarity}` : null, observations.foam ? `foam: ${observations.foam}` : null].filter(Boolean).join(' | ') || undefined,
      };
      if (visionData) {
        context.vision_data = JSON.stringify({
          container: visionData.container,
          color: visionData.colors.analysis.dominant_name,
          water_corrected_color: visionData.colors.water_corrected.dominant_name,
          turbidity_ntu: visionData.turbidity.ntu_estimate,
          turbidity_grade: visionData.turbidity.clarity_grade,
          color_confidence: visionData.color_confidence,
          detected_readings: visionData.detected_readings,
          full_text: visionData.full_text,
          labels: visionData.labels.slice(0, 8).map(l => l.description),
          objects: visionData.objects.slice(0, 8).map(o => o.name),
        });
      }
      const aiResult = await DirectAIService.analyze(imageUris, context);
      if (aiResult.success) {
        if (aiResult.result?.retake_required) {
          return {
            ...this.enrichFallback(),
            retake_required: true,
            retake_message: aiResult.result.retake_message ||
              'No glass or water detected. Pour water into a clear glass cup and retake.',
            container_verification: aiResult.result.container_verification,
          };
        }
        const methodLabel = aiResult.method === 'openai_direct' ? 'openai_direct' : 'claude_direct';
        const modelLabel = aiResult.method === 'openai_direct' ? 'GPT-4o (direct)' : 'Claude (direct)';
        const sourceLabel = aiResult.method === 'openai_direct' ? 'Direct OpenAI API' : 'Direct Claude API';
        return this.enrichFromAIResult(aiResult.result, {
          method: methodLabel, model: modelLabel, source: sourceLabel,
          processingTimeMs: aiResult.processingTimeMs, tokensUsed: aiResult.tokensUsed,
        });
      }
    } catch (err) {
      console.log('[AI Pipeline] Direct AI failed, falling to local engine...');
    }

    // ── STAGE 4: Reject — no AI available ──
    return {
      ...this.enrichFallback(),
      retake_required: true,
      retake_message: 'AI analysis is currently unavailable. Check your internet connection and API configuration.',
      container_verification: {
        passed: false,
        container_type: 'unknown',
        reason: 'No AI provider available to verify glass and water in image',
        suggested_action: 'Configure a Google Vision API key in Settings, or connect to the internet and retry.',
      },
    };
  }

  /** Multi-image specific analysis */
  async analyzeMultiImage(images: MultiImageInput, obs: WaterCliniqObservations = {}): Promise<WaterCliniqAnalysisResult> {
    const allUris = [images.waterImage, images.pipeImage, images.environmentImage].filter(Boolean) as string[];
    if (allUris.length === 0) throw new Error('At least one image required');

    const result = await this.analyze(allUris, obs);

    // Enhance leakage if pipe image present
    if (images.pipeImage) {
      const leakageAnalysis = LeakageDetectionService.analyze({
        pipeCondition: obs.pipe_condition || 'unknown',
        imageUri: images.pipeImage,
      });
      result.leakage_assessment = {
        ...result.leakage_assessment,
        leakage_detected: leakageAnalysis.leakDetected,
        leakage_severity: leakageAnalysis.severity,
        pipe_condition: obs.pipe_condition || 'unknown',
        urgency: leakageAnalysis.urgencyLevel,
        estimated_water_loss_liters_per_day: `${leakageAnalysis.estimatedWaterLossLitersPerDay.toFixed(0)}L`,
      };
      result.urgencyColor = URGENCY_COLORS[leakageAnalysis.urgencyLevel] as string;
    }

    return result;
  }

  /** Quick safety check */
  async quickCheck(imageUri: string) {
    try {
      const resp = await ApiService.quickWaterAssessment(imageUri);
      if (resp.success) return { ...resp, safetyColor: SAFETY_COLORS[resp.safety_level] || '#94a3b8' };
      throw new Error('Quick check failed');
    } catch {
      return { safety_level: 'CAUTION', risk_score: 50, quick_advice: 'Boil water before drinking.', color_detected: 'clear', clarity: 'unknown', safetyColor: '#eab308' };
    }
  }

  /** Retry sending any locally cached analyses that failed while offline */
  async flushPendingAnalyses(): Promise<void> {
    try {
      const raw = await SecureStorage.getItem('pending_analyses');
      if (!raw) return;
      const pending = JSON.parse(raw);
      if (!pending.length) return;
      const remaining: typeof pending = [];
      for (const item of pending) {
        try {
          await ApiService.saveAnalysisResult(item.payload);
        } catch {
          remaining.push(item);
        }
      }
      await SecureStorage.setItem('pending_analyses', JSON.stringify(remaining));
    } catch {}
  }

  /** Save analysis to backend — with local cache fallback when offline */
  async saveToHistory(result: WaterCliniqAnalysisResult, obs: WaterCliniqObservations, imageUris: string[], visionData?: VisionExtractedData | null): Promise<void> {
    const payload = {
      safety_level: result.safety_assessment.safety_level,
      risk_score: result.safety_assessment.risk_score,
      confidence_score: result.confidence_score,
      ai_provider: result.ai_metadata.source,
      ai_model: result.ai_metadata.model,
      result: JSON.stringify(result),
      observations: JSON.stringify(obs),
      source_type: obs.source_type,
      location: obs.location,
      water_source_id: obs.water_source_id,
      vision_data: visionData ? JSON.stringify(visionData) : undefined,
    };
    try {
      await ApiService.saveAnalysisResult(payload);
    } catch {
      // Offline — queue in local cache for retry on next analysis
      try {
        const cached = JSON.parse(await SecureStorage.getItem('pending_analyses') || '[]');
        cached.push({ payload, timestamp: new Date().toISOString() });
        await SecureStorage.setItem('pending_analyses', JSON.stringify(cached.slice(-50)));
      } catch {}
    }
  }

  private enrichFallback(): WaterCliniqAnalysisResult {
    return {
      visual_assessment: { clarity: 'unknown', color: 'unknown', particles: false, surface_condition: 'unknown' },
      leakage_assessment: { leakage_detected: false, leakage_severity: 'none', leakage_type: 'none', pipe_condition: 'unknown', urgency: 'low' },
      safety_assessment: { safety_level: 'CAUTION', risk_score: 50, primary_concerns: [] },
      contamination_analysis: { bacterial_risk: 'LOW', chemical_signs: false, physical_contamination: false, environmental_factors: [] },
      recommendations: { immediate_actions: [], treatment_methods: [], boiling_required: false, alternative_source: false },
      community_guidance: { simple_tests: [], warning_signs: [], preventive_measures: [], contact_authorities: false },
      confidence_score: 0,
      analysis_timestamp: new Date().toISOString(),
      ai_metadata: { method: 'local_engine', source: 'Fallback' },
      safetyColor: '#94a3b8',
      urgencyColor: '#94a3b8',
      summaryText: 'Analysis requires container verification.',
    };
  }

  private enrich(raw: any, meta: Partial<AIMetadata>): WaterCliniqAnalysisResult {
    const safetyLevel = raw.safety_assessment?.safety_level || 'CAUTION';
    const urgency = raw.leakage_assessment?.urgency || 'low';
    return {
      visual_assessment: raw.visual_assessment || {},
      leakage_assessment: raw.leakage_assessment || {},
      six_dimensions: raw.six_dimensions,
      safety_assessment: raw.safety_assessment || { safety_level: safetyLevel, risk_score: 50, primary_concerns: [] },
      contamination_analysis: raw.contamination_analysis || {},
      recommendations: raw.recommendations || {},
      community_guidance: raw.community_guidance || {},
      user_observations: raw.user_observations,
      confidence_score: raw.confidence_score || 70,
      analysis_timestamp: raw.analysis_timestamp || new Date().toISOString(),
      ai_metadata: {
        method: (meta.method || 'local_engine') as AIMetadata['method'],
        model: meta.model,
        processingTimeMs: meta.processingTimeMs,
        tokensUsed: meta.tokensUsed,
        source: meta.source || 'Unknown',
      },
      safetyColor: SAFETY_COLORS[safetyLevel] || '#94a3b8',
      urgencyColor: URGENCY_COLORS[urgency] || '#94a3b8',
      summaryText: this.buildSummary(raw),
    };
  }

  private enrichFromAIResult(raw: any, meta: Partial<AIMetadata>): WaterCliniqAnalysisResult {
    return this.enrich(raw, meta);
  }

  private buildSummary(raw: any): string {
    const level = raw.safety_assessment?.safety_level || 'CAUTION';
    const risk = raw.safety_assessment?.risk_score || 0;
    const clarity = raw.visual_assessment?.clarity || 'unknown';
    const color = raw.visual_assessment?.color || 'unknown';
    let s = `${level} — Risk: ${risk}/100. Water appears ${clarity}, ${color}.`;
    if (raw.six_dimensions?.overall_six_dimension_score) {
      s += ` 6-dim score: ${raw.six_dimensions.overall_six_dimension_score}/100.`;
    }
    if (raw.leakage_assessment?.leakage_detected) {
      s += ` [Alert] ${raw.leakage_assessment.leakage_severity} leak (${raw.leakage_assessment.urgency}).`;
    }
    const concerns = raw.safety_assessment?.primary_concerns || [];
    if (concerns.length) s += ` Concerns: ${concerns[0]}.`;
    return s;
  }

}

export default new WaterCliniqAnalysisService();
