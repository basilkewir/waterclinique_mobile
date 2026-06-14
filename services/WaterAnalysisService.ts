import { WaterAnalysisData } from './StorageService';
import { compareAgainstStandards } from './WaterStandardsService';

export type WaterObservation = {
  ph?: number;
  turbidity?: number;
  chlorine?: number;
  temperature?: number;
  tds?: number;
  conductivity?: number;

  source?: string;
  color?: string;
  clarity?: string;
  foam?: string;
  smell?: string;
  taste?: string;
  particles?: string;

  hasPhoto?: boolean;
};

export type WaterAnalysisIssue = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
};

export type WaterAnalysisFlag = {
  parameter: string;
  status: 'low' | 'high' | 'ok' | 'unknown';
  message?: string;
};

export type WaterAnalysisResult = {
  overallQuality: 'Safe to drink' | 'Caution' | 'Unsafe';
  riskScore: number;
  confidence: number;
  issues: WaterAnalysisIssue[];
  recommendations: string[];
  parameterFlags: WaterAnalysisFlag[];
};

export function analyzeWaterData(data: Partial<WaterAnalysisData>): {
  qualityScore: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  standardCompliance?: {
    epaCompliant: boolean;
    whoCompliant: boolean;
    violations: Array<{
      parameter: string;
      status: string;
      message: string;
      epaCompliance: string;
      whoCompliance: string;
    }>;
  };
} {
  let riskScore = 5;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Convert to old format for compatibility
  const observation: WaterObservation = {
    source: data.source,
    color: data.color,
    smell: data.smell,
    taste: data.taste,
    particles: data.hasParticles ? data.particleDescription || 'some' : 'none',
    ph: data.ph,
    tds: data.tds,
    temperature: data.temperature,
    chlorine: data.chlorine || 0,
    turbidity: data.turbidity || 0,
    conductivity: data.conductivity || 0,
    hasPhoto: data.inputMethod === 'image' && (data.imageUris?.length || 0) > 0,
  };

  const result = analyzeWater(observation);
  
  // Convert to new format
  let qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  let urgencyLevel: 'low' | 'medium' | 'high';
  
  if (result.riskScore <= 20) {
    qualityLevel = 'excellent';
    urgencyLevel = 'low';
  } else if (result.riskScore <= 40) {
    qualityLevel = 'good';
    urgencyLevel = 'low';
  } else if (result.riskScore <= 60) {
    qualityLevel = 'fair';
    urgencyLevel = 'medium';
  } else {
    qualityLevel = 'poor';
    urgencyLevel = 'high';
  }

  // Convert issues
  const convertedIssues = result.issues.map(issue => issue.message);
  
  // Add infrastructure-related issues if present
  if (data.visibleIssues?.includes('rust')) {
    convertedIssues.push('Visible rust on pipes may indicate corrosion and metal leaching');
  }
  if (data.visibleIssues?.includes('leaks')) {
    convertedIssues.push('Pipe leaks can allow contamination to enter the water system');
  }
  if (data.pipeAge === '>20' && data.source === 'tap') {
    convertedIssues.push('Old plumbing (>20 years) may increase risk of contamination');
  }

  // Check standards compliance
  const standardCompliance = checkStandardsCompliance(observation);

  // Add standard violations to issues
  if (standardCompliance.violations.length > 0) {
    standardCompliance.violations.forEach((violation: any) => {
      if (violation.epaCompliance === 'non-compliant' || violation.whoCompliance === 'non-compliant') {
        convertedIssues.push(`Standard violation: ${violation.message}`);
      }
    });
  }

  // Add standard-based recommendations
  if (!standardCompliance.epaCompliant) {
    recommendations.push('Water exceeds EPA drinking water standards - consider treatment or alternative source');
  }
  if (!standardCompliance.whoCompliant) {
    recommendations.push('Water exceeds WHO drinking water guidelines - seek professional advice');
  }

  return {
    qualityScore: 100 - result.riskScore,
    qualityLevel,
    issues: convertedIssues,
    recommendations: [...result.recommendations, ...recommendations],
    urgencyLevel,
    standardCompliance,
  };
}

function checkStandardsCompliance(observation: WaterObservation) {
  const comparisons = compareAgainstStandards(observation);
  const violations = comparisons.filter((c: any) => 
    c.epaCompliance === 'non-compliant' || c.whoCompliance === 'non-compliant'
  );
  
  const epaCompliant = !comparisons.some((c: any) => c.epaCompliance === 'non-compliant');
  const whoCompliant = !comparisons.some((c: any) => c.whoCompliance === 'non-compliant');

  return {
    epaCompliant,
    whoCompliant,
    violations,
  };
}

export function analyzeWater(observation: WaterObservation): WaterAnalysisResult {
  let riskScore = 5;
  const issues: WaterAnalysisIssue[] = [];
  const parameterFlags: WaterAnalysisFlag[] = [];

  const addIssue = (id: string, severity: WaterAnalysisIssue['severity'], message: string) => {
    // Avoid duplicates by id
    if (!issues.find((i) => i.id === id)) {
      issues.push({ id, severity, message });
    }
  };

  const addFlag = (parameter: string, status: WaterAnalysisFlag['status'], message?: string) => {
    parameterFlags.push({ parameter, status, message });
  };

  const { ph, turbidity, chlorine, tds, conductivity, temperature } = observation;

  // --- Numeric parameter rules ---

  // pH
  if (typeof ph === 'number' && !Number.isNaN(ph)) {
    if (ph < 6.5) {
      riskScore += 20;
      addIssue(
        'ph_low',
        'warning',
        `pH is low (${ph.toFixed(2)}). Acidic water can corrode pipes and leach metals like lead or copper.`,
      );
      addFlag('pH', 'low', 'Below typical drinking-water range (6.5–8.5).');
    } else if (ph > 8.5) {
      riskScore += 20;
      addIssue(
        'ph_high',
        'warning',
        `pH is high (${ph.toFixed(2)}). Alkaline water can cause deposits and change taste.`,
      );
      addFlag('pH', 'high', 'Above typical drinking-water range (6.5–8.5).');
    } else {
      addFlag('pH', 'ok', 'Within the usual range for drinking water (6.5–8.5).');
    }
  } else {
    addFlag('pH', 'unknown');
  }

  // Turbidity (NTU)
  if (typeof turbidity === 'number' && !Number.isNaN(turbidity)) {
    if (turbidity <= 1) {
      addFlag('Turbidity', 'ok', 'Very clear water (≤ 1 NTU).');
    } else if (turbidity <= 5) {
      riskScore += 5;
      addIssue(
        'turbidity_slight',
        'info',
        `Turbidity is slightly elevated (${turbidity.toFixed(1)} NTU). Cloudiness may be from fine particles.`,
      );
      addFlag('Turbidity', 'high', 'Slightly above very clear range, monitor if it increases.');
    } else if (turbidity <= 10) {
      riskScore += 15;
      addIssue(
        'turbidity_high',
        'warning',
        `Turbidity is high (${turbidity.toFixed(1)} NTU). This can hide germs and reduce disinfection.`,
      );
      addFlag('Turbidity', 'high', 'High turbidity, filtration and disinfection recommended.');
    } else {
      riskScore += 30;
      addIssue(
        'turbidity_very_high',
        'danger',
        `Turbidity is very high (${turbidity.toFixed(1)} NTU). Water is likely unsafe without strong treatment.`,
      );
      addFlag('Turbidity', 'high', 'Very cloudy water, treat before any use for drinking.');
    }
  } else {
    addFlag('Turbidity', 'unknown');
  }

  // Free chlorine (mg/L)
  if (typeof chlorine === 'number' && !Number.isNaN(chlorine)) {
    if (chlorine === 0) {
      addIssue(
        'chlorine_none',
        'info',
        'No chlorine detected. If this is piped or treated water, disinfection may be insufficient.',
      );
      addFlag('Chlorine', 'low', 'No disinfectant residual detected.');
    } else if (chlorine > 0 && chlorine <= 0.5) {
      addFlag('Chlorine', 'ok', 'Chlorine level is within a common operational range.');
    } else if (chlorine <= 1.5) {
      riskScore += 5;
      addIssue(
        'chlorine_elevated',
        'info',
        `Chlorine is somewhat high (${chlorine.toFixed(2)} mg/L). Sensitive users may notice taste or smell.`,
      );
      addFlag('Chlorine', 'high', 'Slightly above typical comfort range.');
    } else if (chlorine <= 4) {
      riskScore += 15;
      addIssue(
        'chlorine_high',
        'warning',
        `Chlorine is quite high (${chlorine.toFixed(2)} mg/L). Can irritate eyes and taste very strong.`,
      );
      addFlag('Chlorine', 'high', 'Well above normal, adjust treatment if possible.');
    } else {
      riskScore += 25;
      addIssue(
        'chlorine_very_high',
        'danger',
        `Chlorine is extremely high (${chlorine.toFixed(2)} mg/L). This is above many guideline values.`,
      );
      addFlag('Chlorine', 'high', 'Extremely high residual, seek technical support.');
    }
  } else {
    addFlag('Chlorine', 'unknown');
  }

  // TDS (mg/L)
  if (typeof tds === 'number' && !Number.isNaN(tds)) {
    if (tds <= 300) {
      addFlag('TDS', 'ok', 'Low mineral content, often good tasting.');
    } else if (tds <= 600) {
      riskScore += 5;
      addIssue(
        'tds_moderate',
        'info',
        `TDS is moderate (${tds.toFixed(0)} mg/L). Some taste or hardness may be noticeable.`,
      );
      addFlag('TDS', 'high', 'Mineral content is moderate, monitor for scaling or taste changes.');
    } else if (tds <= 1200) {
      riskScore += 15;
      addIssue(
        'tds_high',
        'warning',
        `TDS is high (${tds.toFixed(0)} mg/L). Water may taste salty or bitter and cause scaling.`,
      );
      addFlag('TDS', 'high', 'High dissolved solids, may not be acceptable for long-term drinking.');
    } else {
      riskScore += 25;
      addIssue(
        'tds_very_high',
        'danger',
        `TDS is very high (${tds.toFixed(0)} mg/L). Water is usually unsuitable for drinking without treatment.`,
      );
      addFlag('TDS', 'high', 'Very high salts and minerals, seek alternative source or treatment.');
    }
  } else {
    addFlag('TDS', 'unknown');
  }

  // Conductivity (µS/cm) – approximate indicator for dissolved solids
  if (typeof conductivity === 'number' && !Number.isNaN(conductivity)) {
    if (conductivity <= 500) {
      addFlag('Conductivity', 'ok', 'Within common range for drinking water.');
    } else if (conductivity <= 1000) {
      riskScore += 10;
      addIssue(
        'cond_high',
        'info',
        `Conductivity is elevated (${conductivity.toFixed(0)} µS/cm). Dissolved salts/minerals are higher than usual.`,
      );
      addFlag('Conductivity', 'high', 'Indicates higher mineral/salt content.');
    } else {
      riskScore += 20;
      addIssue(
        'cond_very_high',
        'warning',
        `Conductivity is very high (${conductivity.toFixed(0)} µS/cm). Water may be too salty or mineral-rich.`,
      );
      addFlag('Conductivity', 'high', 'Very high conductivity, usually linked to high TDS.');
    }
  } else {
    addFlag('Conductivity', 'unknown');
  }

  // Temperature (°C)
  if (typeof temperature === 'number' && !Number.isNaN(temperature)) {
    if (temperature >= 30) {
      riskScore += 10;
      addIssue(
        'temp_warm',
        'info',
        `Water is warm (${temperature.toFixed(1)} °C). Warm water can encourage growth of germs in storage.`,
      );
      addFlag('Temperature', 'high', 'Warmer than typical room-temperature drinking water.');
    } else if (temperature <= 5) {
      addFlag('Temperature', 'low', 'Very cold water, usually fine but may mask taste/smell.');
    } else {
      addFlag('Temperature', 'ok');
    }
  } else {
    addFlag('Temperature', 'unknown');
  }

  // --- Visual and sensory rules ---

  // Color
  if (observation.color) {
    const color = observation.color;
    if (['muddy', 'brown', 'red'].includes(color)) {
      riskScore += 30;
      addIssue(
        'color_heavy',
        'danger',
        'Water looks heavily discoloured (muddy, brown or red). This may indicate soil, rust or organic pollution.',
      );
      addFlag('Color', 'high', 'Strong discoloration visible.');
    } else if (['yellow', 'green', 'cloudy', 'slightly_cloudy'].includes(color)) {
      riskScore += 18;
      addIssue(
        'color_moderate',
        'warning',
        'Color or cloudiness may come from minerals, algae or fine particles. Further checking is recommended.',
      );
      addFlag('Color', 'high', 'Noticeable change in color or cloudiness.');
    } else {
      addFlag('Color', 'ok', 'No strong discoloration reported.');
    }
  } else {
    addFlag('Color', 'unknown');
  }

  // Clarity
  if (observation.clarity) {
    const clarity = observation.clarity;
    if (['very_cloudy'].includes(clarity)) {
      riskScore += 25;
      addIssue(
        'clarity_very_cloudy',
        'danger',
        'Water looks very cloudy. This usually means high levels of suspended material and possible germs.',
      );
      addFlag('Clarity', 'high');
    } else if (['hazy', 'cloudy'].includes(clarity)) {
      riskScore += 12;
      addIssue(
        'clarity_cloudy',
        'warning',
        'Cloudy or hazy appearance can reduce the effectiveness of disinfection and hide contamination.',
      );
      addFlag('Clarity', 'high');
    } else if (['slightly_hazy'].includes(clarity)) {
      riskScore += 5;
      addIssue(
        'clarity_slight',
        'info',
        'Slight haze visible. Often harmless but worth monitoring if it becomes stronger.',
      );
      addFlag('Clarity', 'high');
    } else {
      addFlag('Clarity', 'ok');
    }
  } else {
    addFlag('Clarity', 'unknown');
  }

  // Foam
  if (observation.foam) {
    const foam = observation.foam;
    if (foam === 'none') {
      addFlag('Foam', 'ok');
    } else if (foam === 'slight') {
      riskScore += 5;
      addIssue(
        'foam_slight',
        'info',
        'Slight foam on the surface can come from natural organic matter or agitation.',
      );
      addFlag('Foam', 'high');
    } else if (foam === 'moderate') {
      riskScore += 10;
      addIssue(
        'foam_moderate',
        'warning',
        'Moderate foam may indicate detergents or organic pollution.',
      );
      addFlag('Foam', 'high');
    } else if (['heavy', 'excessive'].includes(foam)) {
      riskScore += 20;
      addIssue(
        'foam_heavy',
        'danger',
        'Heavy or persistent foam is a strong warning sign for detergents or serious organic contamination.',
      );
      addFlag('Foam', 'high');
    } else {
      addFlag('Foam', 'unknown');
    }
  } else {
    addFlag('Foam', 'unknown');
  }

  // Smell
  if (observation.smell) {
    const smell = observation.smell;
    if (['chemical', 'sewage', 'rotten'].includes(smell)) {
      riskScore += 30;
      addIssue(
        'smell_severe',
        'danger',
        'Strong chemical, sewage or rotten smell is a serious warning sign. Do not drink this water.',
      );
      addFlag('Smell', 'high', 'Severe, unpleasant odour reported.');
    } else if (['musty', 'fishy', 'earthy'].includes(smell)) {
      riskScore += 18;
      addIssue(
        'smell_moderate',
        'warning',
        'Musty, fishy or earthy smell may indicate algae, organic growth or pollution.',
      );
      addFlag('Smell', 'high', 'Unusual smell that should be investigated.');
    } else if (smell === 'chlorine') {
      riskScore += 8;
      addIssue(
        'smell_chlorine',
        'info',
        'Chlorine smell suggests treated water. Very strong smell can bother users but usually protects against germs.',
      );
      addFlag('Smell', 'high');
    } else {
      addFlag('Smell', 'ok', 'No unusual smell reported.');
    }
  } else {
    addFlag('Smell', 'unknown');
  }

  // Taste
  if (observation.taste) {
    const taste = observation.taste;
    if (['chemical', 'metallic', 'bitter'].includes(taste)) {
      riskScore += 25;
      addIssue(
        'taste_severe',
        'danger',
        'Chemical, metallic or very bitter taste can be a sign of metals or chemical contamination.',
      );
      addFlag('Taste', 'high', 'Strong off-taste reported.');
    } else if (['salty', 'sour'].includes(taste)) {
      riskScore += 18;
      addIssue(
        'taste_salty_sour',
        'warning',
        'Salty or sour taste may be caused by high mineral content or other dissolved substances.',
      );
      addFlag('Taste', 'high');
    } else if (taste === 'sweet') {
      riskScore += 8;
      addIssue(
        'taste_sweet',
        'info',
        'Unusually sweet taste can sometimes indicate dissolved organic substances.',
      );
      addFlag('Taste', 'high');
    } else {
      addFlag('Taste', 'ok', 'No unusual taste reported.');
    }
  } else {
    addFlag('Taste', 'unknown');
  }

  // Particles
  if (observation.particles) {
    const particles = observation.particles;
    if (['many', 'excessive'].includes(particles)) {
      riskScore += 20;
      addIssue(
        'particles_many',
        'warning',
        'Many visible particles or floating material show that the water is not well filtered.',
      );
      addFlag('Particles', 'high');
    } else if (particles === 'some') {
      riskScore += 15;
      addIssue(
        'particles_some',
        'info',
        'Some particles visible. These can carry germs or sediment and should be removed by filtration.',
      );
      addFlag('Particles', 'high');
    } else if (particles === 'few') {
      riskScore += 10;
      addIssue(
        'particles_few',
        'info',
        'A few particles are common in some sources but still better to filter out.',
      );
      addFlag('Particles', 'high');
    } else {
      addFlag('Particles', 'ok');
    }
  } else {
    addFlag('Particles', 'unknown');
  }

  // Source-specific notes
  if (observation.source) {
    const source = observation.source;
    if (['river', 'spring'].includes(source)) {
      addIssue(
        'source_surface',
        'info',
        'Surface water sources (rivers, springs) can change quickly with rain and pollution. Regular testing is important.',
      );
    } else if (['well', 'borehole'].includes(source)) {
      addIssue(
        'source_ground',
        'info',
        'Groundwater sources (wells, boreholes) are often safer but can be affected by nearby latrines, farms or waste dumps.',
      );
    } else if (source === 'tap') {
      addIssue(
        'source_tap',
        'info',
        'Tap water depends on the treatment plant and distribution pipes. Report persistent problems to your water provider.',
      );
    }
  }

  // --- Combination patterns (cross-check multiple conditions) ---

  if (
    typeof turbidity === 'number' &&
    turbidity > 5 &&
    ['sewage', 'rotten'].includes((observation.smell || '').toLowerCase())
  ) {
    riskScore += 15;
    addIssue(
      'combo_turbidity_sewage',
      'danger',
      'Very cloudy water together with sewage or rotten smell strongly suggests faecal contamination. Do not drink this water.',
    );
  }

  if (
    typeof tds === 'number' &&
    tds > 1200 &&
    ['salty', 'bitter'].includes((observation.taste || '').toLowerCase())
  ) {
    riskScore += 10;
    addIssue(
      'combo_tds_salty',
      'warning',
      'High dissolved solids and salty/bitter taste indicate excess minerals or salts. Long-term drinking may not be safe.',
    );
  }

  if (
    typeof temperature === 'number' &&
    temperature >= 30 &&
    typeof turbidity === 'number' &&
    turbidity > 5
  ) {
    riskScore += 10;
    addIssue(
      'combo_warm_cloudy',
      'warning',
      'Warm and cloudy water can allow germs to multiply quickly, especially in stored containers.',
    );
  }

  if (
    ['chemical'].includes((observation.smell || '').toLowerCase()) &&
    ['chemical', 'metallic'].includes((observation.taste || '').toLowerCase())
  ) {
    riskScore += 15;
    addIssue(
      'combo_chemical',
      'danger',
      'Strong chemical or metallic smell and taste suggest possible chemical or metal contamination.',
    );
  }

  // --- Aggregate quality and confidence ---

  if (riskScore < 0) riskScore = 0;
  if (riskScore > 100) riskScore = 100;

  // Escalate immediately on any danger-severity issue — no matter the score
  const hasDangerIssue = issues.some((i) => i.severity === 'danger');

  let overallQuality: WaterAnalysisResult['overallQuality'];
  if (hasDangerIssue || riskScore > 50) {
    overallQuality = 'Unsafe';
    if (riskScore < 60) riskScore = 60;  // floor when danger flag present
  } else if (riskScore > 20) {
    overallQuality = 'Caution';
  } else {
    overallQuality = 'Safe to drink';
  }

  // Confidence based on how much data we have
  let confidence = 40;
  const numericCount = [ph, turbidity, chlorine, tds, conductivity].filter(
    (v) => typeof v === 'number' && !Number.isNaN(v),
  ).length;

  if (numericCount >= 1) confidence += 10;
  if (numericCount >= 3) confidence += 10;
  if (numericCount >= 4) confidence += 10;

  const sensoryCount = [observation.color, observation.clarity, observation.smell, observation.taste, observation.particles].filter(
    Boolean,
  ).length;
  if (sensoryCount >= 2) confidence += 10;
  if (sensoryCount >= 4) confidence += 10; // Bonus for comprehensive sensory data

  // Photo provides visual evidence - boost confidence significantly if we have sensory data too
  if (observation.hasPhoto) {
    if (sensoryCount >= 3) {
      confidence += 20; // Photo + comprehensive answers = high confidence
    } else if (sensoryCount >= 1) {
      confidence += 15; // Photo + some answers = medium-high confidence
    } else {
      confidence += 5; // Photo alone = minimal boost
    }
  }

  // Critical indicators (smell and taste) boost confidence when provided
  if (observation.smell && observation.taste && 
      observation.smell !== 'none' && observation.taste !== 'normal') {
    confidence += 10; // User provided critical sensory information
  }

  if (confidence > 95) confidence = 95; // Cap at 95% (never 100% without lab test)

  // --- Recommendations ---

  const recommendations: string[] = [];

  if (overallQuality === 'Safe to drink') {
    recommendations.push(
      'This water is safe to drink based on the information provided.',
      'Continue storing water in a clean, covered container. Test periodically as conditions can change.',
    );
  } else if (overallQuality === 'Caution') {
    recommendations.push(
      'Use this water with caution, especially for babies, elderly people or anyone with weak immunity.',
      'Boil the water for at least 1 minute before drinking, or use an approved chemical disinfectant or filter.',
    );
  } else {
    recommendations.push(
      'Do not drink this water until it has been properly tested and treated.',
      'Use another safer source (bottled water, well-managed tap supply or protected borehole) for drinking and cooking.',
    );
  }

  recommendations.push(
    'For a certified result and professional treatment, contact your nearest Water Cliniq. Water Cliniq provides accredited lab testing and on-site treatment solutions.',
  );

  return {
    overallQuality,
    riskScore,
    confidence,
    issues,
    recommendations,
    parameterFlags,
  };
}

