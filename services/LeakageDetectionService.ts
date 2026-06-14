/**
 * LeakageDetectionService — Client-side leakage analysis engine.
 * Mirrors the backend LeakageAnalysisService for offline-first operation.
 */

export interface LeakageObservation {
  pipeCondition?: string;
  leakSeverity?: string;
  corrosionLevel?: string;
  jointCondition?: string;
  location?: string;
  imageUri?: string;
}

export interface LeakageAnalysisResult {
  leakDetected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  severityLabel: string;
  urgencyLevel: 'none' | 'monitor' | 'soon' | 'urgent' | 'immediate';
  urgencyLabel: string;
  estimatedWaterLossLitersPerDay: number;
  estimatedWaterLossLitersPerMonth: number;
  pipeConditionScore: number;
  pipeConditionLabel: string;
  corrosionAnalysis: {
    level: string;
    riskFactor: string;
    affectsStructuralIntegrity: boolean;
    recommendation: string;
  };
  jointIntegrity: {
    condition: string;
    needsRepair: boolean;
    recommendation: string;
  };
  recommendedActions: string[];
  shouldReportToUtility: boolean;
}

class LeakageDetectionService {
  analyze(obs: LeakageObservation): LeakageAnalysisResult {
    const severity = obs.leakSeverity || this.determineSeverity(obs);
    const urgency = this.mapUrgency(severity);
    const waterLoss = this.estimateWaterLoss(severity);

    return {
      leakDetected: severity !== 'none',
      severity,
      severityLabel: this.getSeverityLabel(severity),
      urgencyLevel: urgency as any,
      urgencyLabel: this.getUrgencyLabel(urgency),
      estimatedWaterLossLitersPerDay: waterLoss,
      estimatedWaterLossLitersPerMonth: waterLoss * 30,
      pipeConditionScore: this.scorePipeCondition(obs.pipeCondition || 'unknown'),
      pipeConditionLabel: this.getPipeConditionLabel(obs.pipeCondition || 'unknown'),
      corrosionAnalysis: this.analyzeCorrosion(obs.corrosionLevel || 'unknown'),
      jointIntegrity: this.assessJointIntegrity(obs.jointCondition || 'unknown'),
      recommendedActions: this.getRecommendedActions(severity),
      shouldReportToUtility: ['high', 'critical'].includes(severity),
    };
  }

  private determineSeverity(obs: LeakageObservation): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;

    const pipeMap: Record<string, number> = {
      good: 0, fair: 15, poor: 30, corroded: 40, cracked: 50, unknown: 20,
    };
    score += pipeMap[obs.pipeCondition || 'unknown'] ?? 20;

    const corrosionMap: Record<string, number> = {
      none: 0, light: 10, moderate: 25, heavy: 45, unknown: 0,
    };
    score += corrosionMap[obs.corrosionLevel || 'unknown'] ?? 0;

    const jointMap: Record<string, number> = {
      intact: 0, weeping: 15, dripping: 30, spraying: 50, unknown: 0,
    };
    score += jointMap[obs.jointCondition || 'unknown'] ?? 0;

    if (score >= 80) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    if (score >= 5) return 'low';
    return 'none';
  }

  private mapUrgency(severity: string): string {
    switch (severity) {
      case 'critical': return 'immediate';
      case 'high': return 'urgent';
      case 'medium': return 'soon';
      case 'low': return 'monitor';
      default: return 'none';
    }
  }

  private estimateWaterLoss(severity: string): number {
    const rand = () => Math.random();
    switch (severity) {
      case 'critical': return 100 + rand() * 200;
      case 'high': return 30 + rand() * 40;
      case 'medium': return 5 + rand() * 20;
      case 'low': return 1 + rand() * 10;
      default: return 0;
    }
  }

  private getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical': return 'CRITICAL - Immediate repair required';
      case 'high': return 'HIGH - Significant leakage detected';
      case 'medium': return 'MEDIUM - Moderate leakage suspected';
      case 'low': return 'LOW - Minor leak possible';
      default: return 'NONE - No leakage detected';
    }
  }

  private getUrgencyLabel(urgency: string): string {
    switch (urgency) {
      case 'immediate': return 'URGENT - Action required within hours';
      case 'urgent': return 'HIGH - Action required within 24 hours';
      case 'soon': return 'MEDIUM - Schedule repair within 1 week';
      case 'monitor': return 'LOW - Monitor and plan maintenance';
      default: return 'NONE - No action needed';
    }
  }

  private scorePipeCondition(condition: string): number {
    switch (condition) {
      case 'good': return 90;
      case 'fair': return 65;
      case 'poor': return 35;
      case 'corroded': return 20;
      case 'cracked': return 10;
      default: return 50;
    }
  }

  private getPipeConditionLabel(condition: string): string {
    switch (condition) {
      case 'good': return 'GOOD - Pipe in satisfactory condition';
      case 'fair': return 'FAIR - Some wear visible, monitor regularly';
      case 'poor': return 'POOR - Significant deterioration, plan replacement';
      case 'corroded': return 'CORRODED - Active corrosion, treat immediately';
      case 'cracked': return 'CRACKED - Structural damage, urgent replacement needed';
      default: return 'UNKNOWN - Unable to assess pipe condition';
    }
  }

  private analyzeCorrosion(level: string) {
    return {
      level,
      riskFactor: ['heavy', 'moderate'].includes(level) ? 'high' : 'low',
      affectsStructuralIntegrity: level === 'heavy',
      recommendation: (() => {
        switch (level) {
          case 'heavy': return 'Replace affected pipe section immediately';
          case 'moderate': return 'Apply corrosion treatment and monitor quarterly';
          case 'light': return 'Clean and apply protective coating';
          default: return 'No immediate action required';
        }
      })(),
    };
  }

  private assessJointIntegrity(condition: string) {
    return {
      condition,
      needsRepair: ['dripping', 'spraying'].includes(condition),
      recommendation: (() => {
        switch (condition) {
          case 'spraying': return 'Immediate joint replacement needed';
          case 'dripping': return 'Replace gasket or re-seal joint';
          case 'weeping': return 'Monitor - may need re-sealing soon';
          default: return 'No issues detected';
        }
      })(),
    };
  }

  private getRecommendedActions(severity: string): string[] {
    const actions: string[] = [];

    if (['critical', 'high'].includes(severity)) {
      actions.push('Shut off water supply to affected section');
      actions.push('Contact emergency plumbing service');
      actions.push('Report to municipal water utility immediately');
    }

    if (severity === 'medium') {
      actions.push('Schedule professional inspection within 7 days');
      actions.push('Monitor water meter for unusual usage');
      actions.push('Check for visible water damage in surrounding area');
    }

    if (severity === 'low') {
      actions.push('Mark leak location for monitoring');
      actions.push('Check again in 7 days for changes');
      actions.push('Consider preventive maintenance');
    }

    if (severity === 'none') {
      actions.push('No immediate action required');
      actions.push('Continue routine maintenance schedule');
    }

    actions.push('Document with timestamped photo for records');
    return actions;
  }
}

export default new LeakageDetectionService();
