/**
 * CommunityMapService — Client-side community data provider.
 * Works offline with local fallback data for the community water safety map.
 */

import ApiService from './ApiService';
import StorageService, { WaterAnalysisData } from './StorageService';

export interface CommunityMapPoint {
  id: string;
  sourceName: string;
  sourceType: string;
  location: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  safetyLevel: 'safe' | 'caution' | 'unsafe' | 'dangerous';
  safetyColor: string;
  reportedAt: string;
}

export interface CommunityReport {
  id: string;
  sourceName: string;
  sourceType: string;
  location: string;
  safetyScore: number;
  safetyLevel: string;
  safetyColor: string;
  observations: string;
  isVerified: boolean;
  reportedAt: string;
}

export interface OutbreakAlert {
  location: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  averageSafetyScore: number;
  riskLevel: string;
  message: string;
  alertId: string;
}

export interface CommunityDashboardData {
  totalReports: number;
  reportsToday: number;
  safePercentage: number;
  unsafePercentage: number;
  avgSafetyScore: number;
  safetyDistribution: { safe: number; caution: number; unsafe: number; dangerous: number };
}

class CommunityMapService {
  private localReports: CommunityMapPoint[] = [];

  async getMapPoints(): Promise<CommunityMapPoint[]> {
    try {
      const data = await ApiService.getCommunityMap();
      const result = data.data || data;
      this.localReports = result.points || result || [];
      return this.localReports;
    } catch {
      return this.getLocalFallbackMapPoints();
    }
  }

  async getReportsList(page = 1): Promise<{ reports: CommunityReport[]; hasMore: boolean }> {
    try {
      const data = await ApiService.getCommunityReports();
      const result = data.data || data;
      return {
        reports: result.reports || result || [],
        hasMore: false,
      };
    } catch {
      return { reports: this.getLocalFallbackReports(), hasMore: false };
    }
  }

  async getOutbreakAlerts(): Promise<{ hasOutbreaks: boolean; outbreaks: OutbreakAlert[] }> {
    try {
      const data = await ApiService.getOutbreakAlerts();
      const result = data.data || data;
      return { hasOutbreaks: result.has_outbreaks || false, outbreaks: result.outbreaks || [] };
    } catch {
      return { hasOutbreaks: false, outbreaks: [] };
    }
  }

  async getDashboardStats(): Promise<CommunityDashboardData> {
    try {
      const data = await ApiService.getCommunityDashboard();
      return (data.data || data) as CommunityDashboardData;
    } catch {
      return this.getLocalDashboardStats();
    }
  }

  async submitReport(reportData: {
    sourceName: string;
    sourceType?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    safetyScore?: number;
    safetyLevel?: string;
    observations?: string;
    isAnonymous?: boolean;
  }): Promise<{ success: boolean }> {
    try {
      await ApiService.createCommunityReport(reportData);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  getSafetyColor(level: string): string {
    switch (level) {
      case 'safe': return '#02C39A';
      case 'caution': return '#F4A261';
      case 'unsafe': return '#E63946';
      case 'dangerous': return '#7C0000';
      default: return '#64748B';
    }
  }

  getSafetyLabel(level: string): string {
    switch (level) {
      case 'safe': return 'Safe';
      case 'caution': return 'Caution';
      case 'unsafe': return 'Unsafe';
      case 'dangerous': return 'Dangerous';
      default: return 'Unknown';
    }
  }

  /** Build a map point from a local water analysis */
  analysisToMapPoint(analysis: WaterAnalysisData): CommunityMapPoint {
    const score = analysis.qualityScore || 50;
    let level: CommunityMapPoint['safetyLevel'] = 'caution';
    if (score >= 85) level = 'safe';
    else if (score >= 60) level = 'caution';
    else if (score >= 30) level = 'unsafe';
    else level = 'dangerous';

    return {
      id: analysis.id || String(Date.now()),
      sourceName: analysis.source || 'Unknown Source',
      sourceType: analysis.source || 'unknown',
      location: 'Local',
      latitude: 3.8667 + (Math.random() - 0.5) * 0.1,
      longitude: 11.5167 + (Math.random() - 0.5) * 0.1,
      safetyScore: score,
      safetyLevel: level,
      safetyColor: this.getSafetyColor(level),
      reportedAt: 'Just now',
    };
  }

  private async getLocalFallbackMapPoints(): Promise<CommunityMapPoint[]> {
    try {
      const analyses = await StorageService.getRecentAnalyses(20);
      return analyses.map((a) => this.analysisToMapPoint(a));
    } catch {
      return this.getStaticFallbackPoints();
    }
  }

  private getStaticFallbackPoints(): CommunityMapPoint[] {
    return [
      { id: '1', sourceName: 'Bastos Borehole #3', sourceType: 'borehole', location: 'Bastos, Yaoundé', latitude: 3.8767, longitude: 11.5067, safetyScore: 98, safetyLevel: 'safe', safetyColor: '#02C39A', reportedAt: '2 hours ago' },
      { id: '2', sourceName: 'Omnisport Tap', sourceType: 'tap', location: 'Omnisport, Yaoundé', latitude: 3.8667, longitude: 11.5267, safetyScore: 85, safetyLevel: 'safe', safetyColor: '#02C39A', reportedAt: '1 hour ago' },
      { id: '3', sourceName: 'Mokolo Market Tap', sourceType: 'tap', location: 'Mokolo, Yaoundé', latitude: 3.8617, longitude: 11.4917, safetyScore: 72, safetyLevel: 'caution', safetyColor: '#F4A261', reportedAt: '4 hours ago' },
      { id: '4', sourceName: 'Nsam River Source', sourceType: 'river', location: 'Nsam, Yaoundé', latitude: 3.8467, longitude: 11.4867, safetyScore: 61, safetyLevel: 'caution', safetyColor: '#F4A261', reportedAt: '6 hours ago' },
      { id: '5', sourceName: 'Mvog-Mbi Well', sourceType: 'well', location: 'Mvog-Mbi, Yaoundé', latitude: 3.8567, longitude: 11.5367, safetyScore: 35, safetyLevel: 'unsafe', safetyColor: '#E63946', reportedAt: '3 hours ago' },
      { id: '6', sourceName: 'Biyem-Assi Pipe Leak', sourceType: 'pipe', location: 'Biyem-Assi, Yaoundé', latitude: 3.8417, longitude: 11.4767, safetyScore: 20, safetyLevel: 'dangerous', safetyColor: '#7C0000', reportedAt: '30 mins ago' },
      { id: '7', sourceName: 'Etoudi Tank', sourceType: 'tank', location: 'Etoudi, Yaoundé', latitude: 3.8817, longitude: 11.5167, safetyScore: 90, safetyLevel: 'safe', safetyColor: '#02C39A', reportedAt: '5 hours ago' },
    ];
  }

  private getLocalFallbackReports(): CommunityReport[] {
    return [
      { id: '1', sourceName: 'Bastos Borehole #3', sourceType: 'Borehole', location: 'Yaoundé', safetyScore: 98, safetyLevel: 'safe', safetyColor: '#02C39A', observations: 'Clear water, no smell, good taste', isVerified: true, reportedAt: '2 hours ago' },
      { id: '2', sourceName: 'Mokolo Market Tap', sourceType: 'Tap', location: 'Yaoundé', safetyScore: 72, safetyLevel: 'caution', safetyColor: '#F4A261', observations: 'Slight cloudiness after rain', isVerified: true, reportedAt: '4 hours ago' },
      { id: '3', sourceName: 'Nsam River Source', sourceType: 'River', location: 'Yaoundé', safetyScore: 61, safetyLevel: 'caution', safetyColor: '#F4A261', observations: 'Brownish color, earthy smell', isVerified: false, reportedAt: '6 hours ago' },
      { id: '4', sourceName: 'Biyem-Assi Pipe Leak', sourceType: 'Pipe', location: 'Yaoundé', safetyScore: 20, safetyLevel: 'dangerous', safetyColor: '#7C0000', observations: 'Major pipe burst, sewage mixing', isVerified: true, reportedAt: '30 mins ago' },
    ];
  }

  private getLocalDashboardStats(): CommunityDashboardData {
    return {
      totalReports: 156,
      reportsToday: 12,
      safePercentage: 45,
      unsafePercentage: 18,
      avgSafetyScore: 68,
      safetyDistribution: { safe: 70, caution: 42, unsafe: 28, dangerous: 16 },
    };
  }
}

export default new CommunityMapService();
