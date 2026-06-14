import { WaterAnalysis } from './storage';

// Water quality standards (WHO guidelines)
const WATER_STANDARDS = {
  ph: { min: 6.5, max: 8.5, optimal: 7.2 },
  tds: { max: 500, optimal: 300 }, // ppm
  temperature: { min: 10, max: 30, optimal: 20 }, // Celsius
  hardness: { max: 500, optimal: 200 }, // mg/L
  turbidity: { max: 5, optimal: 1 }, // NTU
  chlorine: { max: 5, optimal: 2 }, // mg/L
  nitrate: { max: 50, optimal: 10 }, // mg/L
  fluoride: { max: 1.5, optimal: 0.7 }, // mg/L
};

// Analysis weights for scoring
const ANALYSIS_WEIGHTS = {
  ph: 0.25,
  tds: 0.20,
  turbidity: 0.15,
  temperature: 0.10,
  hardness: 0.10,
  contaminants: 0.20,
};

// Contaminant risk levels
const CONTAMINANT_RISKS = {
  none: 0,
  low: 0.1,
  medium: 0.3,
  high: 0.6,
  critical: 0.9,
};

export interface ManualInputData {
  source: string;
  testDate: string;
  location?: string;
  color: string;
  particles: string;
  particlesDescription?: string;
  smell: string;
  taste?: string;
  ph?: number;
  tds?: number;
  temperature?: number;
  hardness?: number;
  contaminants: string[];
  pipeAge?: string;
  visibleIssues: string[];
  recentChanges?: string;
  recentChangesDescription?: string;
}

export interface ImageAnalysisData {
  analysisType: string;
  images: string[];
  results: {
    color?: string;
    turbidity?: string;
    particles?: string;
    clarity?: string;
    estimated_ph?: number;
    estimated_tds?: number;
    confidence?: number;
    condition?: string;
    rust_level?: string;
    leaks?: string;
    material?: string;
    age_estimate?: string;
    cleanliness?: string;
    seal_condition?: string;
    damage_type?: string;
    severity?: string;
  };
}

export interface SensorData {
  deviceId: string;
  deviceType: string;
  readings: {
    ph?: number;
    tds?: number;
    temperature?: number;
    conductivity?: number;
    turbidity?: number;
    dissolvedOxygen?: number;
    timestamp: string;
  }[];
  batteryLevel?: number;
  signalStrength?: number;
}

export class WaterAnalysisEngine {
  // Process manual input data
  static processManualInput(data: ManualInputData): WaterAnalysis {
    const analysis: WaterAnalysis = {
      id: this.generateId(),
      date: data.testDate || new Date().toISOString(),
      source: data.source,
      inputType: 'manual',
      score: 0,
      status: 'good',
      data,
      location: data.location,
      recommendations: [],
      issues: [],
    };

    // Calculate water quality score
    const score = this.calculateManualScore(data);
    analysis.score = score.score;
    analysis.status = score.status;
    analysis.issues = score.issues;
    analysis.recommendations = score.recommendations;

    return analysis;
  }

  // Process image analysis data
  static processImageAnalysis(data: ImageAnalysisData): WaterAnalysis {
    const analysis: WaterAnalysis = {
      id: this.generateId(),
      date: new Date().toISOString(),
      source: 'Image Analysis',
      inputType: 'image',
      score: 0,
      status: 'good',
      data,
      recommendations: [],
      issues: [],
      confidence: data.results.confidence || 0.8,
    };

    // Calculate score based on image analysis results
    const score = this.calculateImageScore(data);
    analysis.score = score.score;
    analysis.status = score.status;
    analysis.issues = score.issues;
    analysis.recommendations = score.recommendations;

    return analysis;
  }

  // Process sensor data
  static processSensorData(data: SensorData): WaterAnalysis {
    const analysis: WaterAnalysis = {
      id: this.generateId(),
      date: new Date().toISOString(),
      source: `Sensor: ${data.deviceType}`,
      inputType: 'sensor',
      score: 0,
      status: 'good',
      data,
      recommendations: [],
      issues: [],
      confidence: 0.95, // High confidence for sensor data
    };

    // Calculate score based on sensor readings
    const score = this.calculateSensorScore(data);
    analysis.score = score.score;
    analysis.status = score.status;
    analysis.issues = score.issues;
    analysis.recommendations = score.recommendations;

    return analysis;
  }

  // Calculate score for manual input
  private static calculateManualScore(data: ManualInputData) {
    let totalScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // pH analysis
    if (data.ph !== undefined) {
      if (data.ph < WATER_STANDARDS.ph.min || data.ph > WATER_STANDARDS.ph.max) {
        totalScore -= 25;
        issues.push('pH level outside safe range');
        recommendations.push('Consider water treatment for pH adjustment');
      }
    }

    // TDS analysis
    if (data.tds !== undefined) {
      if (data.tds > WATER_STANDARDS.tds.max) {
        totalScore -= 20;
        issues.push('High TDS level detected');
        recommendations.push('Use water filtration system');
      }
    }

    // Visual analysis
    if (data.color === 'yellowish' || data.color === 'brownish' || data.color === 'greenish') {
      totalScore -= 15;
      issues.push('Unusual water color detected');
      recommendations.push('Test for contaminants and consider filtration');
    }

    if (data.particles === 'yes') {
      totalScore -= 10;
      issues.push('Particles/sediment detected');
      recommendations.push('Use sediment filter and test water quality');
    }

    if (data.smell !== 'none') {
      totalScore -= 10;
      issues.push('Unusual odor detected');
      recommendations.push('Avoid consumption until tested');
    }

    if (data.taste && data.taste !== 'none') {
      totalScore -= 10;
      issues.push('Unusual taste detected');
      recommendations.push('Do not consume without testing');
    }

    // Contaminant analysis
    if (data.contaminants.includes('lead')) {
      totalScore -= 30;
      issues.push('Lead contamination risk');
      recommendations.push('Use lead-certified filter immediately');
    }

    if (data.contaminants.includes('bacteria')) {
      totalScore -= 25;
      issues.push('Bacterial contamination risk');
      recommendations.push('Boil water before consumption');
    }

    // Infrastructure analysis
    if (data.pipeAge === '>20') {
      totalScore -= 10;
      issues.push('Old plumbing system');
      recommendations.push('Consider pipe replacement and regular testing');
    }

    if (data.visibleIssues.includes('rust')) {
      totalScore -= 15;
      issues.push('Pipe corrosion detected');
      recommendations.push('Check for metal contamination and replace pipes');
    }

    // Ensure score doesn't go below 0
    totalScore = Math.max(0, totalScore);

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (totalScore >= 90) status = 'excellent';
    else if (totalScore >= 80) status = 'good';
    else if (totalScore >= 70) status = 'fair';
    else status = 'poor';

    // Add general recommendations
    if (totalScore < 80) {
      recommendations.push('Test water regularly');
      recommendations.push('Consider professional water testing');
    }

    return { score: totalScore, status, issues, recommendations };
  }

  // Calculate score for image analysis
  private static calculateImageScore(data: ImageAnalysisData) {
    let totalScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    const results = data.results;

    // Water sample analysis
    if (data.analysisType === 'water_sample') {
      if (results.color === 'yellowish' || results.color === 'brownish') {
        totalScore -= 20;
        issues.push('Discoloration detected');
        recommendations.push('Test for mineral contamination');
      }

      if (results.turbidity === 'high') {
        totalScore -= 25;
        issues.push('High turbidity detected');
        recommendations.push('Use filtration system');
      }

      if (results.particles === 'yes') {
        totalScore -= 15;
        issues.push('Particles detected');
        recommendations.push('Install sediment filter');
      }

      if (results.estimated_ph && (results.estimated_ph < 6.5 || results.estimated_ph > 8.5)) {
        totalScore -= 20;
        issues.push('pH imbalance detected');
        recommendations.push('pH adjustment recommended');
      }

      if (results.estimated_tds && results.estimated_tds > 500) {
        totalScore -= 20;
        issues.push('High TDS detected');
        recommendations.push('Use reverse osmosis filter');
      }
    }

    // Pipe analysis
    if (data.analysisType === 'pipe') {
      if (results.rust_level === 'high') {
        totalScore -= 25;
        issues.push('Severe pipe corrosion');
        recommendations.push('Replace corroded pipes immediately');
      }

      if (results.leaks === 'yes') {
        totalScore -= 30;
        issues.push('Pipe leaks detected');
        recommendations.push('Repair leaks and test for contamination');
      }

      if (results.condition === 'poor') {
        totalScore -= 20;
        issues.push('Poor pipe condition');
        recommendations.push('Schedule plumbing inspection');
      }
    }

    // Container analysis
    if (data.analysisType === 'container') {
      if (results.cleanliness === 'poor') {
        totalScore -= 20;
        issues.push('Container contamination risk');
        recommendations.push('Clean and sanitize container');
      }

      if (results.seal_condition === 'damaged') {
        totalScore -= 15;
        issues.push('Container seal compromised');
        recommendations.push('Replace container or seal');
      }
    }

    // Leakage analysis
    if (data.analysisType === 'leakage') {
      if (results.severity === 'high') {
        totalScore -= 35;
        issues.push('Severe leakage detected');
        recommendations.push('Immediate repair required');
      }

      if (results.damage_type === 'structural') {
        totalScore -= 25;
        issues.push('Structural damage detected');
        recommendations.push('Professional repair needed');
      }
    }

    // Adjust score based on confidence
    const confidence = results.confidence || 0.8;
    totalScore = totalScore * confidence;

    // Ensure score doesn't go below 0
    totalScore = Math.max(0, totalScore);

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (totalScore >= 90) status = 'excellent';
    else if (totalScore >= 80) status = 'good';
    else if (totalScore >= 70) status = 'fair';
    else status = 'poor';

    return { score: Math.round(totalScore), status, issues, recommendations };
  }

  // Calculate score for sensor data
  private static calculateSensorScore(data: SensorData) {
    let totalScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Get latest readings
    const latestReading = data.readings[data.readings.length - 1];

    if (!latestReading) {
      return { score: 50, status: 'fair' as const, issues: ['No sensor data available'], recommendations: ['Check sensor connection'] };
    }

    // pH analysis
    if (latestReading.ph !== undefined) {
      if (latestReading.ph < WATER_STANDARDS.ph.min || latestReading.ph > WATER_STANDARDS.ph.max) {
        totalScore -= 25;
        issues.push('pH level outside safe range');
        recommendations.push('pH adjustment needed');
      }
    }

    // TDS analysis
    if (latestReading.tds !== undefined) {
      if (latestReading.tds > WATER_STANDARDS.tds.max) {
        totalScore -= 20;
        issues.push('High TDS detected');
        recommendations.push('Filtration recommended');
      }
    }

    // Temperature analysis
    if (latestReading.temperature !== undefined) {
      if (latestReading.temperature < WATER_STANDARDS.temperature.min || latestReading.temperature > WATER_STANDARDS.temperature.max) {
        totalScore -= 10;
        issues.push('Temperature outside optimal range');
        recommendations.push('Check water source conditions');
      }
    }

    // Turbidity analysis
    if (latestReading.turbidity !== undefined) {
      if (latestReading.turbidity > WATER_STANDARDS.turbidity.max) {
        totalScore -= 20;
        issues.push('High turbidity detected');
        recommendations.push('Water filtration needed');
      }
    }

    // Conductivity analysis (related to TDS)
    if (latestReading.conductivity !== undefined) {
      if (latestReading.conductivity > 800) { // High conductivity
        totalScore -= 15;
        issues.push('High conductivity detected');
        recommendations.push('Check for mineral content');
      }
    }

    // Dissolved oxygen analysis
    if (latestReading.dissolvedOxygen !== undefined) {
      if (latestReading.dissolvedOxygen < 5) { // Low dissolved oxygen
        totalScore -= 10;
        issues.push('Low dissolved oxygen');
        recommendations.push('Check water aeration');
      }
    }

    // Check sensor health
    if (data.batteryLevel !== undefined && data.batteryLevel < 20) {
      recommendations.push('Replace sensor battery');
    }

    if (data.signalStrength !== undefined && data.signalStrength < 30) {
      recommendations.push('Check sensor connection');
    }

    // Ensure score doesn't go below 0
    totalScore = Math.max(0, totalScore);

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (totalScore >= 90) status = 'excellent';
    else if (totalScore >= 80) status = 'good';
    else if (totalScore >= 70) status = 'fair';
    else status = 'poor';

    return { score: Math.round(totalScore), status, issues, recommendations };
  }

  // Generate unique ID
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get trend analysis
  static getTrendAnalysis(analyses: WaterAnalysis[]): {
    trend: 'improving' | 'stable' | 'declining';
    averageScore: number;
    recommendations: string[];
  } {
    if (analyses.length < 2) {
      return {
        trend: 'stable',
        averageScore: analyses[0]?.score || 0,
        recommendations: ['More data needed for trend analysis'],
      };
    }

    const recentAnalyses = analyses.slice(0, 7); // Last 7 analyses
    const scores = recentAnalyses.map(a => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'declining';
    if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';
    else trend = 'stable';

    const recommendations: string[] = [];
    if (trend === 'declining') {
      recommendations.push('Water quality is declining - investigate causes');
      recommendations.push('Increase testing frequency');
    } else if (trend === 'improving') {
      recommendations.push('Water quality improving - maintain current practices');
    } else {
      recommendations.push('Water quality stable - continue regular monitoring');
    }

    return { trend, averageScore: Math.round(averageScore), recommendations };
  }
}
