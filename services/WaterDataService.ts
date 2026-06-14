/**
 * WaterDataService — thin wrapper around the backend API.
 * ALL data lives on the server. Mobile holds NO local copies.
 * Only the auth token is stored in AsyncStorage.
 */
import ApiService from './ApiService';

export interface WaterSource {
  id: number | string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  source_type: string;
  status: string;
  is_active: boolean;
  risk_level?: string;
  description?: string;
  population_served?: number;
  readings_count?: number;
  last_reading_at?: string;
  last_risk_score?: number;
  drinkability_status?: string;
  created_at?: string;
}

export interface WaterReading {
  id: number | string;
  water_source_id: number | string;
  water_source?: { id: number; name: string };
  reading_time?: string;
  ph?: number;
  turbidity?: number;
  residual_chlorine?: number;
  conductivity?: number;
  temperature?: number;
  dissolved_oxygen?: number;
  total_dissolved_solids?: number;
  water_color?: string;
  water_smell?: string;
  water_taste?: string;
  risk_score?: number;
  type?: string;
  notes?: string;
  created_at?: string;
}

export interface WaterAnalysis {
  id: number;
  user_id: number;
  water_source?: { id: number; name: string; source_type?: string };
  source_type?: string;
  location?: string;
  safety_level?: string;
  risk_score?: number;
  confidence_score?: number;
  ai_provider?: string;
  observations?: Record<string, any>;
  result?: Record<string, any>;
  admin_recommendation?: string;
  created_at?: string;
  type?: string;
}

export interface WaterQualityReadingDTO {
  id: number;
  water_source_id?: number;
  water_source?: { id: number; name: string; source_type?: string };
  risk_score?: number;
  quality_classification?: string;
  ph?: number;
  turbidity?: number;
  residual_chlorine?: number;
  conductivity?: number;
  temperature?: number;
  created_at?: string;
  reading_time?: string;
}

class WaterDataService {

  // ── Water Sources ─────────────────────────────────────────────────────────

  async getSources(): Promise<WaterSource[]> {
    const res = await ApiService.getWaterSources();
    return res?.data ?? [];
  }

  // alias used by WaterSourceSelector
  async getWaterSources(): Promise<WaterSource[]> {
    return this.getSources();
  }

  async saveWaterSource(data: {
    name: string;
    location?: string;
    source_type?: string;
    status?: string;
  }): Promise<WaterSource> {
    return this.createSource(data);
  }

  async createSource(data: {
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    source_type?: string;
    description?: string;
    population_served?: number;
  }): Promise<WaterSource> {
    const res = await ApiService.createWaterSource(data);
    return res?.data;
  }

  async updateSource(id: number | string, data: Partial<WaterSource>): Promise<WaterSource> {
    const res = await ApiService.request_(`/water-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.data;
  }

  async deleteSource(id: number | string): Promise<void> {
    await ApiService.request_(`/water-sources/${id}`, { method: 'DELETE' });
  }

  // ── Readings ──────────────────────────────────────────────────────────────

  async getReadings(waterSourceId?: number | string): Promise<WaterReading[]> {
    const params = waterSourceId ? { water_source_id: String(waterSourceId) } : undefined;
    const res = await ApiService.getReadings(params);
    return res?.data ?? [];
  }

  async saveReading(data: {
    water_source_id: number | string;
    // canonical names
    water_color?: string;
    water_smell?: string;
    water_taste?: string;
    particles?: string;
    ph?: number;
    turbidity?: number;
    residual_chlorine?: number;
    conductivity?: number;
    temperature?: number;
    total_dissolved_solids?: number;
    dissolved_oxygen?: number;
    riskScore?: number;
    type?: string;
    notes?: string;
    // legacy aliases from new-reading.tsx
    color?: string;
    smell?: string;
    taste?: string;
    clarity?: string;
    foam?: string;
    chlorine?: number;
    tds?: number;
    source_name?: string;
    image_uri?: string;
    quality?: string;
  }): Promise<WaterReading> {
    const payload: Record<string, any> = {
      water_source_id:       data.water_source_id,
      ph:                    data.ph,
      turbidity:             data.turbidity,
      temperature:           data.temperature,
      conductivity:          data.conductivity,
      dissolved_oxygen:      data.dissolved_oxygen,
      riskScore:             data.riskScore,
      type:                  data.type,
      notes:                 data.notes,
      // map aliases → canonical names
      residual_chlorine:     data.residual_chlorine ?? data.chlorine,
      total_dissolved_solids:data.total_dissolved_solids ?? data.tds,
      water_color:           data.water_color ?? data.color,
      water_smell:           data.water_smell ?? data.smell,
      water_taste:           data.water_taste ?? data.taste,
      particles:             data.particles,
      visual_observations:   JSON.stringify({
        clarity:  data.clarity,
        foam:     data.foam,
        particles:data.particles,
      }),
      quality:               data.quality,
    };
    // strip undefined
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    const res = await ApiService.createReading(payload);
    return res?.data ?? res;
  }

  // ── Water Analyses (image-based) ──────────────────────────────────────────

  async getAnalyses(): Promise<WaterAnalysis[]> {
    const res = await ApiService.getWaterAnalyses();
    return res?.data ?? [];
  }

  async getFeed(): Promise<WaterAnalysis[]> {
    const readingsRes = await this.getReadings().catch(() => []);
    const allReadings = readingsRes as unknown as WaterQualityReadingDTO[];
    const mapped = (allReadings ?? []).map(r => this.mapReadingToAnalysis(r));
    return mapped.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  }

  async getAnalysis(id: number): Promise<WaterAnalysis> {
    const res = await ApiService.getWaterAnalysis(id);
    return res?.data ?? res;
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  private mapReadingToAnalysis(r: WaterQualityReadingDTO): WaterAnalysis {
    const risk = r.risk_score;
    let safetyLevel = r.quality_classification ?? '';
    if (!safetyLevel) {
      safetyLevel = risk != null
        ? (risk <= 25 ? 'SAFE' : risk <= 50 ? 'CAUTION' : risk <= 75 ? 'UNSAFE' : 'DANGEROUS')
        : 'CAUTION';
    } else {
      const map: Record<string, string> = { Safe: 'SAFE', Caution: 'CAUTION', Warning: 'UNSAFE', Dangerous: 'DANGEROUS' };
      safetyLevel = map[safetyLevel] ?? safetyLevel.toUpperCase();
    }

    return {
      id: r.id,
      user_id: 0,
      water_source: r.water_source ?? undefined,
      source_type: r.water_source?.source_type,
      safety_level: safetyLevel,
      risk_score: risk,
      confidence_score: undefined,
      observations: undefined,
      result: undefined,
      admin_recommendation: undefined,
      created_at: r.created_at ?? r.reading_time,
      type: 'reading',
    };
  }

  async getDashboardStats() {
    const [sources, readingsRes] = await Promise.all([
      this.getSources().catch(() => []),
      this.getReadings().catch(() => []),
    ]);
    const allReadings = readingsRes as unknown as WaterQualityReadingDTO[];

    const mapped = (allReadings ?? []).map(r => this.mapReadingToAnalysis(r));
    const sorted = mapped.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

    const total = sorted.length;
    const avgRisk = total > 0
      ? Math.round(sorted.reduce((s, a) => s + (a.risk_score ?? 0), 0) / total)
      : 0;

    const recentAnalyses = sorted.slice(0, 5);

    return {
      totalSources: sources.length,
      activeSources: sources.filter(s => s.is_active).length,
      totalAnalyses: total,
      averageRiskScore: avgRisk,
      recentAnalyses,
      sources,
    };
  }

  formatTimestamp(ts: string): string {
    const d = new Date(ts), now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  }
}

export default new WaterDataService();
