/**
 * WaterQualityEngine.ts
 *
 * Unified engine that processes water data from all three input methods
 * (manual questionnaire, image analysis, IoT sensor) and produces an
 * identical, plain-language result structure.
 *
 * Rules for "plain language" — users are NOT water experts:
 *  - No technical jargon without an explanation
 *  - Every issue maps to a simple action the user can take today
 *  - Severity uses traffic-light language: Safe / Caution / Unsafe
 */

// ─────────────────────────────────────────────────────────────────────────────
// Input types  (what each method feeds in)
// ─────────────────────────────────────────────────────────────────────────────

export type WaterSource =
  | 'tap'
  | 'bottled'
  | 'well'
  | 'river'
  | 'lake'
  | 'rainwater'
  | 'other';

export type InputMethod = 'manual' | 'image' | 'sensor';

/** Visual + sensory data (manual questionnaire) */
export interface ManualObservations {
  source: WaterSource;
  location?: string;
  color: 'clear' | 'cloudy' | 'yellowish' | 'brownish' | 'greenish' | 'reddish' | 'other';
  clarity: 'clear' | 'slightly_cloudy' | 'cloudy' | 'very_turbid';
  smell: 'none' | 'earthy' | 'chlorine' | 'rotten_eggs' | 'metallic' | 'chemical' | 'other';
  taste: 'none' | 'bitter' | 'salty' | 'metallic' | 'sweet' | 'chemical' | 'other';
  hasParticles: boolean;
  particleDescription?: string;
  hasFoam: boolean;
  hasOilSheen: boolean;
  // Optional measurements the user may have from a test kit
  ph?: number;
  tds?: number;         // mg/L
  temperature?: number; // °C
  chlorine?: number;    // mg/L
  turbidity?: number;   // NTU
  hardness?: number;    // mg/L
  conductivity?: number; // µS/cm
  // Infrastructure
  pipeAge?: '<5' | '5-20' | '>20' | 'unknown';
  pipeCondition?: 'good' | 'rusty' | 'corroded' | 'cracked' | 'unknown';
  visibleLeakage?: 'none' | 'minor' | 'moderate' | 'major';
  visibleStains?: boolean;
  recentPlumbingWork?: boolean;
  // Usage context
  usedForDrinking: boolean;
  usedForCooking: boolean;
}

/** Data extracted from AI image analysis */
export interface ImageObservations {
  source?: WaterSource;
  location?: string;
  imageUris: string[];                 // may include pipe / leakage / stain shots
  imageTypes: ImageType[];             // per image
  // AI-returned values (may be empty if offline)
  aiColor?: string;
  aiClarity?: string;
  aiParticles?: boolean;
  aiLeakageDetected?: boolean;
  aiLeakageSeverity?: 'none' | 'minor' | 'moderate' | 'major' | 'burst';
  aiPipeCondition?: string;
  aiSafetyLevel?: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'DANGEROUS';
  aiRiskScore?: number;                // 0-100
  aiImmediateActions?: string[];
  aiTreatmentMethods?: string[];
  aiContaminationSources?: string[];
  aiConfidence?: number;               // 0-100
  // User-provided context alongside images
  userObservations?: Partial<ManualObservations>;
}

export type ImageType =
  | 'water_sample'   // glass / bottle of water
  | 'pipe_rust'      // rusty pipe
  | 'leakage'        // visible leak
  | 'stains'         // stained surface
  | 'tap'            // tap / faucet
  | 'storage_tank'   // water tank
  | 'other';

/** Sensor / IoT readings */
export interface SensorReadings {
  source?: WaterSource;
  location?: string;
  sensorId?: string;
  deviceType?: 'bluetooth' | 'wifi' | 'manual_entry';
  timestamp?: number;
  // Core parameters
  ph?: number;
  tds?: number;
  temperature?: number;
  turbidity?: number;
  conductivity?: number;
  dissolvedOxygen?: number;  // mg/L
  chlorine?: number;
  orp?: number;              // Oxidation-reduction potential mV
  hardness?: number;
  // E-coli / coliform flags (some sensors detect these)
  bacterialCount?: number;  // CFU/100mL
  // Optional supplementary visual from user
  userObservations?: Partial<ManualObservations>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output types  (always the same regardless of input method)
// ─────────────────────────────────────────────────────────────────────────────

export type SafetyLevel = 'safe' | 'caution' | 'unsafe' | 'dangerous';

export interface WaterIssue {
  id: string;
  category: 'safety' | 'health' | 'aesthetics' | 'infrastructure' | 'chemical';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;            // plain-language headline
  explanation: string;      // plain-language "what this means"
  parameter?: string;       // which parameter triggered this
  measuredValue?: number | string;
  safeRange?: string;
}

export interface WaterAction {
  priority: 'immediate' | 'soon' | 'eventually';
  action: string;           // what to do
  reason: string;           // why (plain language)
  canDoAtHome: boolean;
}

export interface ParameterSummary {
  name: string;             // plain name e.g. "Acidity (pH)"
  value: number | string;
  unit: string;
  status: 'ok' | 'low' | 'high' | 'unknown';
  safeRange: string;
  plainStatus: string;      // "Within safe range" | "Too high" | "Too low"
}

export interface WaterQualityResult {
  // Meta
  id: string;
  timestamp: number;
  date: string;
  inputMethod: InputMethod;
  source: WaterSource;
  location?: string;
  imageUris?: string[];

  // Overall verdict
  safetyLevel: SafetyLevel;
  safetyLabel: string;        // "Your water looks safe to drink"
  riskScore: number;          // 0-100
  confidence: number;         // 0-100
  qualityScore: number;       // 0-100 (inverse of risk)
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';

  // Issues & actions
  issues: WaterIssue[];
  actions: WaterAction[];
  parameterSummaries: ParameterSummary[];

  // Summary for display
  headline: string;           // one-liner for the card
  summary: string;            // 2-3 sentence plain-language summary

  // Infrastructure
  infrastructureAlert?: {
    hasIssue: boolean;
    severity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
  };

  // Stored fields (legacy compatibility)
  qualityLevel_legacy?: 'excellent' | 'good' | 'fair' | 'poor';
  issues_legacy?: string[];
  recommendations?: string[];
  urgencyLevel?: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────────────────────
// WHO / EPA parameter thresholds
// ─────────────────────────────────────────────────────────────────────────────

interface ParameterThreshold {
  name: string;
  unit: string;
  min?: number;
  max: number;
  excellent?: number;
  good?: number;
  safeRange: string;
  lowRisk: number;    // risk points if out of range
  highRisk: number;
}

const THRESHOLDS: Record<string, ParameterThreshold> = {
  ph: {
    name: 'Acidity (pH)',
    unit: 'pH',
    min: 6.5,
    max: 8.5,
    excellent: 7.2,
    good: 7.5,
    safeRange: '6.5 – 8.5',
    lowRisk: 20,
    highRisk: 25,
  },
  tds: {
    name: 'Total Dissolved Solids',
    unit: 'mg/L',
    max: 600,
    excellent: 150,
    good: 300,
    safeRange: 'below 600 mg/L',
    lowRisk: 0,
    highRisk: 20,
  },
  temperature: {
    name: 'Water Temperature',
    unit: '°C',
    max: 25,
    safeRange: 'below 25°C',
    lowRisk: 0,
    highRisk: 10,
  },
  turbidity: {
    name: 'Cloudiness (Turbidity)',
    unit: 'NTU',
    max: 4,
    excellent: 1,
    good: 2,
    safeRange: 'below 4 NTU',
    lowRisk: 0,
    highRisk: 20,
  },
  chlorine: {
    name: 'Chlorine Level',
    unit: 'mg/L',
    min: 0.2,
    max: 4.0,
    safeRange: '0.2 – 4.0 mg/L',
    lowRisk: 10,
    highRisk: 15,
  },
  conductivity: {
    name: 'Conductivity',
    unit: 'µS/cm',
    max: 1000,
    safeRange: 'below 1000 µS/cm',
    lowRisk: 0,
    highRisk: 15,
  },
  dissolvedOxygen: {
    name: 'Dissolved Oxygen',
    unit: 'mg/L',
    min: 5,
    max: 999,
    safeRange: 'above 5 mg/L',
    lowRisk: 15,
    highRisk: 0,
  },
  hardness: {
    name: 'Water Hardness',
    unit: 'mg/L',
    max: 500,
    safeRange: 'below 500 mg/L',
    lowRisk: 0,
    highRisk: 10,
  },
  bacterialCount: {
    name: 'Bacterial Count',
    unit: 'CFU/100mL',
    max: 0,
    safeRange: '0 (none detectable)',
    lowRisk: 0,
    highRisk: 60,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Visual indicator mappings
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_RISK: Record<string, number> = {
  clear: 0,
  cloudy: 15,
  yellowish: 20,
  brownish: 25,
  greenish: 20,
  reddish: 20,
  other: 10,
};

const SMELL_RISK: Record<string, number> = {
  none: 0,
  chlorine: 5,
  earthy: 15,
  rotten_eggs: 25,  // H2S — serious
  metallic: 20,
  chemical: 30,
  other: 10,
};

const TASTE_RISK: Record<string, number> = {
  none: 0,
  bitter: 15,
  salty: 10,
  metallic: 20,
  sweet: 5,
  chemical: 30,
  other: 10,
};

const SOURCE_BASE_RISK: Record<WaterSource, number> = {
  tap: 5,
  bottled: 0,
  well: 20,
  river: 35,
  lake: 30,
  rainwater: 25,
  other: 20,
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function riskToLevel(risk: number): SafetyLevel {
  if (risk <= 20) return 'safe';
  if (risk <= 45) return 'caution';
  if (risk <= 70) return 'unsafe';
  return 'dangerous';
}

function riskToQuality(risk: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (risk <= 15) return 'excellent';
  if (risk <= 35) return 'good';
  if (risk <= 60) return 'fair';
  return 'poor';
}

function safetyLabelFor(level: SafetyLevel, usedForDrinking: boolean): string {
  if (!usedForDrinking) {
    if (level === 'safe') return 'Water quality looks acceptable for non-drinking use';
    return 'Water has concerns — avoid contact if possible';
  }
  switch (level) {
    case 'safe':      return 'Safe to drink';
    case 'caution':   return 'Not safe to drink without treatment — boil first';
    case 'unsafe':    return 'Not safe to drink — do not consume without proper treatment';
    case 'dangerous': return 'DANGEROUS — Do not drink this water under any circumstances';
  }
}

function checkParameter(
  key: string,
  value: number,
  issues: WaterIssue[],
  summaries: ParameterSummary[],
  riskAcc: { v: number },
) {
  const t = THRESHOLDS[key];
  if (!t) return;

  let status: 'ok' | 'low' | 'high' = 'ok';
  let plainStatus = 'Within safe range';

  if (t.min !== undefined && value < t.min) {
    status = 'low';
    plainStatus = `Too low (safe: ${t.safeRange})`;
    riskAcc.v += t.lowRisk;
    issues.push({
      id: uid(),
      category: key === 'ph' ? 'chemical' : key === 'dissolvedOxygen' ? 'safety' : 'chemical',
      severity: t.lowRisk >= 20 ? 'danger' : 'warning',
      title: `${t.name} is too low`,
      explanation: getExplanation(key, 'low', value),
      parameter: key,
      measuredValue: value,
      safeRange: t.safeRange,
    });
  } else if (value > t.max && t.max < 999) {
    status = 'high';
    plainStatus = `Too high (safe: ${t.safeRange})`;
    riskAcc.v += t.highRisk;
    issues.push({
      id: uid(),
      category: 'chemical',
      severity: t.highRisk >= 25 ? 'danger' : 'warning',
      title: `${t.name} is too high`,
      explanation: getExplanation(key, 'high', value),
      parameter: key,
      measuredValue: value,
      safeRange: t.safeRange,
    });
  }

  summaries.push({
    name: t.name,
    value,
    unit: t.unit,
    status,
    safeRange: t.safeRange,
    plainStatus,
  });
}

function getExplanation(param: string, direction: 'low' | 'high', value: number): string {
  const explanations: Record<string, Record<'low' | 'high', string>> = {
    ph: {
      low: `Your water is too acidic (pH ${value.toFixed(1)}). Acidic water can corrode pipes and leach metals like lead and copper into your water, which can be harmful. Safe range is 6.5–8.5.`,
      high: `Your water is too alkaline (pH ${value.toFixed(1)}). Very alkaline water can taste bitter and may irritate skin. Safe range is 6.5–8.5.`,
    },
    tds: {
      low: `Total Dissolved Solids (${value} mg/L) is unusually low, which may mean mineral content is stripped out — like some over-filtered water.`,
      high: `Total Dissolved Solids is ${value} mg/L — above the recommended 600 mg/L. High TDS can indicate salts, minerals, or contaminants dissolved in the water.`,
    },
    turbidity: {
      low: `Turbidity (${value} NTU) is fine — clear water.`,
      high: `Your water is cloudy or murky (turbidity ${value} NTU). Cloudy water may contain particles, sediment or microorganisms. It should be filtered or boiled before drinking.`,
    },
    chlorine: {
      low: `Chlorine level (${value} mg/L) is too low. Tap water needs some chlorine to kill bacteria. Below 0.2 mg/L means bacteria may survive in the water.`,
      high: `Chlorine level (${value} mg/L) is higher than recommended. Very high chlorine can taste and smell unpleasant and may cause digestive discomfort.`,
    },
    conductivity: {
      low: `Conductivity is very low — this is usually fine for drinking water.`,
      high: `Conductivity (${value} µS/cm) is high, suggesting dissolved minerals or salts above recommended levels.`,
    },
    dissolvedOxygen: {
      low: `Dissolved oxygen (${value} mg/L) is below 5 mg/L, which may indicate stagnant or contaminated water.`,
      high: `Dissolved oxygen is within range.`,
    },
    hardness: {
      low: `Water hardness is very low — soft water. This is generally fine but can be slightly more corrosive.`,
      high: `Water hardness (${value} mg/L) is quite high. Hard water causes scale build-up and may affect taste but is not usually a health risk.`,
    },
    bacterialCount: {
      low: `No bacteria detected — good.`,
      high: `Bacteria detected (${value} CFU/100mL). This water is not safe to drink without boiling or purification.`,
    },
    temperature: {
      low: `Water temperature is fine.`,
      high: `Water temperature (${value}°C) is above 25°C. Warm water promotes bacterial growth — store and use cold.`,
    },
  };

  return explanations[param]?.[direction] ?? `${param} is out of the recommended range.`;
}

function colorToIssue(color: string, issues: WaterIssue[]): void {
  const msgs: Record<string, { title: string; explanation: string; severity: WaterIssue['severity'] }> = {
    cloudy: {
      title: 'Water appears cloudy or milky',
      explanation: 'Cloudy water (also called turbid) usually means suspended particles or air. If the cloudiness settles, it may just be air. If it remains, there could be sediment or contaminants.',
      severity: 'warning',
    },
    yellowish: {
      title: 'Water has a yellowish tint',
      explanation: 'Yellow water often indicates iron, manganese or organic matter. It can also come from rusty pipes. Not safe to drink without testing.',
      severity: 'danger',
    },
    brownish: {
      title: 'Water appears brown or rusty',
      explanation: 'Brown water often signals corroded pipes, iron deposits or disturbed sediment. This is a serious infrastructure or contamination concern.',
      severity: 'danger',
    },
    greenish: {
      title: 'Water has a greenish colour',
      explanation: 'Green water can indicate algae growth (especially in well/tank water) or copper corrosion in pipes. Avoid drinking without treatment.',
      severity: 'danger',
    },
    reddish: {
      title: 'Water appears reddish',
      explanation: 'Red or orange tints often mean high iron content or pipe corrosion. This is a sign to investigate your plumbing.',
      severity: 'danger',
    },
  };

  const m = msgs[color];
  if (m) issues.push({ id: uid(), category: 'aesthetics', ...m });
}

function smellToIssue(smell: string, issues: WaterIssue[]): void {
  const msgs: Record<string, { title: string; explanation: string; severity: WaterIssue['severity'] }> = {
    rotten_eggs: {
      title: 'Rotten egg smell detected',
      explanation: 'A rotten-egg smell means hydrogen sulphide gas — produced by bacteria in water with no oxygen, or by sulphur deposits. Do not drink without treatment.',
      severity: 'danger',
    },
    metallic: {
      title: 'Metallic smell or taste',
      explanation: 'A metallic odour often means high iron, copper or lead content, possibly from corroding pipes. Have your plumbing inspected.',
      severity: 'danger',
    },
    chlorine: {
      title: 'Strong chlorine smell',
      explanation: 'A strong chlorine smell usually means your tap water treatment plant has added more chlorine than usual. At normal levels it is safe, but if very strong, let water sit for a few minutes before drinking.',
      severity: 'warning',
    },
    earthy: {
      title: 'Earthy or musty smell',
      explanation: 'An earthy smell often comes from algae or organic matter — common in well water or surface water sources. May need filtration.',
      severity: 'warning',
    },
    chemical: {
      title: 'Chemical smell detected',
      explanation: 'A chemical odour can indicate industrial contamination or excessive disinfection by-products. Do NOT drink this water until tested.',
      severity: 'critical',
    },
  };

  const m = msgs[smell];
  if (m) issues.push({ id: uid(), category: 'safety', ...m });
}

function buildActions(issues: WaterIssue[], level: SafetyLevel, obs: Partial<ManualObservations>): WaterAction[] {
  const actions: WaterAction[] = [];

  if (level === 'dangerous' || level === 'unsafe') {
    actions.push({
      priority: 'immediate',
      action: 'Stop drinking this water immediately',
      reason: 'Serious quality issues were detected that could cause illness.',
      canDoAtHome: true,
    });
    actions.push({
      priority: 'immediate',
      action: 'Boil water for at least 3 minutes before any use',
      reason: 'Boiling kills most bacteria and parasites.',
      canDoAtHome: true,
    });
    actions.push({
      priority: 'immediate',
      action: 'Use bottled water or an alternative safe source for drinking and cooking',
      reason: 'Until the issue is resolved, bottled water is the safest option.',
      canDoAtHome: true,
    });
  }

  if (issues.some(i => i.parameter === 'bacterialCount')) {
    actions.push({
      priority: 'immediate',
      action: 'Boil water for at least 5 minutes or use water purification tablets',
      reason: 'Bacteria were detected. Boiling or chemical purification will make the water safe.',
      canDoAtHome: true,
    });
  }

  if (issues.some(i => i.category === 'infrastructure')) {
    actions.push({
      priority: 'immediate',
      action: 'Contact a plumber or your water authority to inspect your pipes',
      reason: 'Infrastructure issues (rust, leaks, stains) can contaminate water at the point of use.',
      canDoAtHome: false,
    });
  }

  if (obs.color && ['yellowish', 'brownish', 'reddish'].includes(obs.color)) {
    actions.push({
      priority: 'soon',
      action: 'Run your tap for 2–3 minutes before using water',
      reason: 'Flushing the pipes removes stagnant or rust-coloured water and brings fresher water from the main supply.',
      canDoAtHome: true,
    });
  }

  if (obs.smell === 'chlorine') {
    actions.push({
      priority: 'soon',
      action: 'Fill a jug with water and leave it uncovered for 30 minutes',
      reason: 'Chlorine naturally dissipates when exposed to air, reducing the taste and smell.',
      canDoAtHome: true,
    });
  }

  if (level === 'caution') {
    actions.push({
      priority: 'soon',
      action: 'Consider getting a certified water test from your local health authority',
      reason: 'A lab test will confirm exactly what is in your water so the right solution can be found.',
      canDoAtHome: false,
    });
  }

  if (obs.pipeAge && obs.pipeAge === '>20') {
    actions.push({
      priority: 'soon',
      action: 'Have an old pipe inspection done by a qualified plumber',
      reason: 'Pipes older than 20 years may contain lead solder or be corroding, which can contaminate drinking water.',
      canDoAtHome: false,
    });
  }

  if (level === 'safe') {
    actions.push({
      priority: 'eventually',
      action: 'Continue regular water testing every 6–12 months',
      reason: 'Even safe water can change over time due to pipe ageing, seasonal changes or local events.',
      canDoAtHome: false,
    });
  }

  if (obs.usedForDrinking) {
    actions.push({
      priority: 'eventually',
      action: 'Consider a home water filter (e.g. activated carbon jug filter)',
      reason: 'Filters can improve taste, remove chlorine odour, and catch trace contaminants.',
      canDoAtHome: true,
    });
  }

  // Always recommend Water Cliniq for professional confirmation
  actions.push({
    priority: level === 'safe' ? 'eventually' : 'soon',
    action: 'Contact Water Cliniq for a certified laboratory test and professional water treatment',
    reason: 'Water Cliniq provides accredited analysis and on-site treatment. Only a lab test can confirm exact contaminant levels and guarantee safety.',
    canDoAtHome: false,
  });

  return actions;
}

function buildSummary(level: SafetyLevel, issues: WaterIssue[], source: WaterSource, method: InputMethod): string {
  const sourceLabel: Record<WaterSource, string> = {
    tap: 'tap water', bottled: 'bottled water', well: 'well water',
    river: 'river water', lake: 'lake water', rainwater: 'rainwater', other: 'this water',
  };
  const src = sourceLabel[source] || 'this water';

  const issueCount = issues.filter(i => i.severity !== 'info').length;

  if (level === 'safe') {
    return `Your ${src} is safe to drink. ${issueCount === 0 ? 'All checked parameters are within WHO safe ranges.' : 'There are minor points to watch but nothing requiring immediate action.'} Continue testing periodically.`;
  }
  if (level === 'caution') {
    return `Your ${src} is NOT safe to drink without treatment. ${issueCount} concern${issueCount !== 1 ? 's' : ''} found. Boil or filter before drinking.`;
  }
  if (level === 'unsafe') {
    return `Your ${src} is NOT safe to drink. Do not consume it without boiling or purification first. ${issueCount} serious issue${issueCount !== 1 ? 's' : ''} identified — see the actions below.`;
  }
  return `Your ${src} is DANGEROUS. Stop drinking it immediately. ${issueCount} critical issue${issueCount !== 1 ? 's' : ''} detected — find an alternative water source now.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — one function per input method
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse from manual questionnaire responses.
 */
export function analyzeManual(obs: ManualObservations): WaterQualityResult {
  const issues: WaterIssue[] = [];
  const summaries: ParameterSummary[] = [];
  const riskAcc = { v: SOURCE_BASE_RISK[obs.source] ?? 10 };

  // Visual checks
  riskAcc.v += COLOR_RISK[obs.color] ?? 10;
  if (obs.color !== 'clear') colorToIssue(obs.color, issues);

  riskAcc.v += SMELL_RISK[obs.smell] ?? 10;
  if (obs.smell !== 'none') smellToIssue(obs.smell, issues);

  riskAcc.v += TASTE_RISK[obs.taste] ?? 10;
  if (obs.taste !== 'none') {
    issues.push({
      id: uid(),
      category: 'health',
      severity: obs.taste === 'chemical' ? 'critical' : 'warning',
      title: `Unusual ${obs.taste} taste`,
      explanation: getTasteExplanation(obs.taste),
    });
  }

  if (obs.hasParticles) {
    riskAcc.v += 15;
    issues.push({
      id: uid(),
      category: 'aesthetics',
      severity: 'warning',
      title: 'Visible particles or sediment',
      explanation: `Particles in drinking water can be sediment, rust flakes, or debris. ${obs.particleDescription ? '(' + obs.particleDescription + ')' : ''} Filter through a clean cloth or use a water filter before drinking.`,
    });
  }

  if (obs.hasFoam) {
    riskAcc.v += 10;
    issues.push({
      id: uid(),
      category: 'safety',
      severity: 'warning',
      title: 'Foam or froth on water surface',
      explanation: 'Foam can indicate detergent contamination, sewage or high organic matter. Avoid using this water until the source is identified.',
    });
  }

  if (obs.hasOilSheen) {
    riskAcc.v += 20;
    issues.push({
      id: uid(),
      category: 'safety',
      severity: 'danger',
      title: 'Oily sheen on water surface',
      explanation: 'An oily layer on water strongly suggests hydrocarbon or chemical contamination. Do not use this water.',
    });
  }

  // Measurement checks
  if (obs.ph !== undefined) checkParameter('ph', obs.ph, issues, summaries, riskAcc);
  if (obs.tds !== undefined) checkParameter('tds', obs.tds, issues, summaries, riskAcc);
  if (obs.temperature !== undefined) checkParameter('temperature', obs.temperature, issues, summaries, riskAcc);
  if (obs.turbidity !== undefined) checkParameter('turbidity', obs.turbidity, issues, summaries, riskAcc);
  if (obs.chlorine !== undefined) checkParameter('chlorine', obs.chlorine, issues, summaries, riskAcc);
  if (obs.conductivity !== undefined) checkParameter('conductivity', obs.conductivity, issues, summaries, riskAcc);
  if (obs.hardness !== undefined) checkParameter('hardness', obs.hardness, issues, summaries, riskAcc);

  // Infrastructure checks
  let infraSeverity: WaterQualityResult['infrastructureAlert'] = undefined;
  if (obs.pipeCondition && obs.pipeCondition !== 'good' && obs.pipeCondition !== 'unknown') {
    riskAcc.v += obs.pipeCondition === 'cracked' ? 25 : 15;
    issues.push({
      id: uid(),
      category: 'infrastructure',
      severity: obs.pipeCondition === 'cracked' ? 'danger' : 'warning',
      title: `Pipe condition: ${obs.pipeCondition}`,
      explanation: 'Damaged or corroded pipes can contaminate water even if the source is clean. This should be repaired.',
    });
    infraSeverity = {
      hasIssue: true,
      severity: obs.pipeCondition === 'cracked' ? 'major' : 'moderate',
      description: `Pipe condition reported as ${obs.pipeCondition}. Have a plumber inspect your plumbing.`,
    };
  }

  if (obs.visibleLeakage && obs.visibleLeakage !== 'none') {
    const lkRisk = { minor: 10, moderate: 20, major: 35 }[obs.visibleLeakage] ?? 10;
    riskAcc.v += lkRisk;
    issues.push({
      id: uid(),
      category: 'infrastructure',
      severity: obs.visibleLeakage === 'major' ? 'critical' : 'danger',
      title: `Water leakage: ${obs.visibleLeakage}`,
      explanation: 'Leaks waste water and can allow contaminants to enter pipes. Urgent plumbing repair needed.',
    });
    infraSeverity = {
      hasIssue: true,
      severity: obs.visibleLeakage as any,
      description: `${obs.visibleLeakage.charAt(0).toUpperCase() + obs.visibleLeakage.slice(1)} leakage detected. Contact a plumber immediately.`,
    };
  }

  const risk = Math.min(riskAcc.v, 100);
  const level = riskToLevel(risk);
  const quality = riskToQuality(risk);
  const actions = buildActions(issues, level, obs);

  const id = uid();
  return {
    id,
    timestamp: Date.now(),
    date: new Date().toLocaleDateString(),
    inputMethod: 'manual',
    source: obs.source,
    location: obs.location,
    safetyLevel: level,
    safetyLabel: safetyLabelFor(level, obs.usedForDrinking),
    riskScore: risk,
    confidence: 75,  // manual is moderately confident
    qualityScore: 100 - risk,
    qualityLevel: quality,
    issues,
    actions,
    parameterSummaries: summaries,
    headline: safetyLabelFor(level, obs.usedForDrinking),
    summary: buildSummary(level, issues, obs.source, 'manual'),
    infrastructureAlert: infraSeverity,
    // Legacy fields
    qualityLevel_legacy: quality,
    issues_legacy: issues.map(i => i.title),
    recommendations: actions.map(a => a.action),
    urgencyLevel: level === 'dangerous' || level === 'unsafe' ? 'high' : level === 'caution' ? 'medium' : 'low',
  };
}

/**
 * Analyse from AI image analysis results.
 */
export function analyzeFromImage(img: ImageObservations): WaterQualityResult {
  const issues: WaterIssue[] = [];
  const summaries: ParameterSummary[] = [];
  const riskAcc = { v: SOURCE_BASE_RISK[img.source ?? 'tap'] ?? 10 };

  const aiRisk = img.aiRiskScore ?? 50;
  // AI risk drives the base score when confidence is high
  const confidence = img.aiConfidence ?? 60;
  if (confidence >= 50) {
    riskAcc.v = Math.round(riskAcc.v * 0.3 + aiRisk * 0.7);
  }

  // Map AI safety level
  if (img.aiSafetyLevel === 'DANGEROUS') riskAcc.v = Math.max(riskAcc.v, 75);
  if (img.aiSafetyLevel === 'UNSAFE') riskAcc.v = Math.max(riskAcc.v, 55);
  if (img.aiSafetyLevel === 'SAFE') riskAcc.v = Math.min(riskAcc.v, 30);

  // Visual from AI
  if (img.aiColor && img.aiColor !== 'clear') {
    riskAcc.v += COLOR_RISK[img.aiColor] ?? 10;
    colorToIssue(img.aiColor, issues);
  }

  // Leakage
  let infraSeverity: WaterQualityResult['infrastructureAlert'] = undefined;
  if (img.aiLeakageDetected && img.aiLeakageSeverity && img.aiLeakageSeverity !== 'none') {
    const lkRisk = { minor: 10, moderate: 20, major: 35, burst: 50 }[img.aiLeakageSeverity] ?? 15;
    riskAcc.v += lkRisk;
    issues.push({
      id: uid(),
      category: 'infrastructure',
      severity: img.aiLeakageSeverity === 'burst' ? 'critical' : img.aiLeakageSeverity === 'major' ? 'danger' : 'warning',
      title: `Leakage detected: ${img.aiLeakageSeverity}`,
      explanation: 'The image shows signs of water leakage. This can contaminate your water supply and wastes water. Contact a plumber.',
    });
    infraSeverity = {
      hasIssue: true,
      severity: img.aiLeakageSeverity === 'burst' ? 'critical' : img.aiLeakageSeverity as any,
      description: `${img.aiLeakageSeverity.charAt(0).toUpperCase() + img.aiLeakageSeverity.slice(1)} leakage visible in photo. Urgent repair recommended.`,
    };
  }

  // Pipe condition
  if (img.aiPipeCondition && !['good', 'unknown'].includes(img.aiPipeCondition)) {
    riskAcc.v += 15;
    issues.push({
      id: uid(),
      category: 'infrastructure',
      severity: 'warning',
      title: `Pipe condition: ${img.aiPipeCondition}`,
      explanation: 'The image shows pipe deterioration. Corroded or rusty pipes can contaminate water. Have a plumber inspect.',
    });
  }

  // AI contamination sources
  (img.aiContaminationSources ?? []).forEach(src => {
    issues.push({
      id: uid(),
      category: 'safety',
      severity: 'warning',
      title: `Potential contamination source: ${src}`,
      explanation: `The AI analysis identified "${src}" as a potential contamination source based on the image.`,
    });
  });

  // Supplement with user observations if provided
  const userObs = img.userObservations ?? {};
  if (userObs.smell && userObs.smell !== 'none') {
    riskAcc.v += SMELL_RISK[userObs.smell] ?? 10;
    smellToIssue(userObs.smell, issues);
  }
  if (userObs.taste && userObs.taste !== 'none') {
    riskAcc.v += TASTE_RISK[userObs.taste] ?? 10;
  }
  if (userObs.ph !== undefined) checkParameter('ph', userObs.ph, issues, summaries, riskAcc);
  if (userObs.tds !== undefined) checkParameter('tds', userObs.tds, issues, summaries, riskAcc);
  if (userObs.turbidity !== undefined) checkParameter('turbidity', userObs.turbidity, issues, summaries, riskAcc);
  if (userObs.chlorine !== undefined) checkParameter('chlorine', userObs.chlorine, issues, summaries, riskAcc);

  const risk = Math.min(riskAcc.v, 100);
  const level = riskToLevel(risk);
  const quality = riskToQuality(risk);
  const actions = buildActions(issues, level, userObs as ManualObservations);

  // Augment with AI recommended actions
  (img.aiImmediateActions ?? []).forEach(act => {
    if (!actions.some(a => a.action.toLowerCase().includes(act.toLowerCase().slice(0, 20)))) {
      actions.unshift({ priority: 'immediate', action: act, reason: 'Recommended by AI image analysis.', canDoAtHome: true });
    }
  });

  const id = uid();
  return {
    id,
    timestamp: Date.now(),
    date: new Date().toLocaleDateString(),
    inputMethod: 'image',
    source: img.source ?? 'tap',
    location: img.location,
    imageUris: img.imageUris,
    safetyLevel: level,
    safetyLabel: safetyLabelFor(level, userObs.usedForDrinking ?? true),
    riskScore: risk,
    confidence,
    qualityScore: 100 - risk,
    qualityLevel: quality,
    issues,
    actions,
    parameterSummaries: summaries,
    headline: safetyLabelFor(level, userObs.usedForDrinking ?? true),
    summary: buildSummary(level, issues, img.source ?? 'tap', 'image'),
    infrastructureAlert: infraSeverity,
    qualityLevel_legacy: quality,
    issues_legacy: issues.map(i => i.title),
    recommendations: actions.map(a => a.action),
    urgencyLevel: level === 'dangerous' || level === 'unsafe' ? 'high' : level === 'caution' ? 'medium' : 'low',
  };
}

/**
 * Analyse from IoT sensor / test kit readings.
 */
export function analyzeSensor(sensor: SensorReadings): WaterQualityResult {
  const issues: WaterIssue[] = [];
  const summaries: ParameterSummary[] = [];
  const riskAcc = { v: SOURCE_BASE_RISK[sensor.source ?? 'tap'] ?? 5 };

  // Sensor data — higher confidence
  if (sensor.ph !== undefined) checkParameter('ph', sensor.ph, issues, summaries, riskAcc);
  if (sensor.tds !== undefined) checkParameter('tds', sensor.tds, issues, summaries, riskAcc);
  if (sensor.temperature !== undefined) checkParameter('temperature', sensor.temperature, issues, summaries, riskAcc);
  if (sensor.turbidity !== undefined) checkParameter('turbidity', sensor.turbidity, issues, summaries, riskAcc);
  if (sensor.chlorine !== undefined) checkParameter('chlorine', sensor.chlorine, issues, summaries, riskAcc);
  if (sensor.conductivity !== undefined) checkParameter('conductivity', sensor.conductivity, issues, summaries, riskAcc);
  if (sensor.dissolvedOxygen !== undefined) checkParameter('dissolvedOxygen', sensor.dissolvedOxygen, issues, summaries, riskAcc);
  if (sensor.hardness !== undefined) checkParameter('hardness', sensor.hardness, issues, summaries, riskAcc);
  if (sensor.bacterialCount !== undefined) checkParameter('bacterialCount', sensor.bacterialCount, issues, summaries, riskAcc);

  // ORP check (oxidation-reduction potential; < 200 mV = concern)
  if (sensor.orp !== undefined) {
    summaries.push({
      name: 'Oxidation-Reduction Potential',
      value: sensor.orp,
      unit: 'mV',
      status: sensor.orp < 200 ? 'low' : 'ok',
      safeRange: 'above 200 mV',
      plainStatus: sensor.orp < 200 ? 'Too low — may indicate contamination' : 'Within safe range',
    });
    if (sensor.orp < 200) {
      riskAcc.v += 20;
      issues.push({
        id: uid(),
        category: 'chemical',
        severity: 'warning',
        title: 'Low oxidation-reduction potential (ORP)',
        explanation: 'Low ORP can indicate the water lacks disinfection capacity and may contain reducing agents or contaminants.',
        parameter: 'orp',
        measuredValue: sensor.orp,
        safeRange: '> 200 mV',
      });
    }
  }

  // Supplement with user visual observations if present
  const userObs = sensor.userObservations ?? {};
  if (userObs.smell && userObs.smell !== 'none') {
    riskAcc.v += SMELL_RISK[userObs.smell] ?? 10;
    smellToIssue(userObs.smell, issues);
  }
  if (userObs.color && userObs.color !== 'clear') {
    riskAcc.v += COLOR_RISK[userObs.color] ?? 10;
    colorToIssue(userObs.color, issues);
  }

  const risk = Math.min(riskAcc.v, 100);
  const level = riskToLevel(risk);
  const quality = riskToQuality(risk);

  // Sensor confidence is higher
  const paramCount = summaries.length;
  const confidence = Math.min(60 + paramCount * 5, 98);

  const actions = buildActions(issues, level, userObs as ManualObservations);

  const id = uid();
  return {
    id,
    timestamp: sensor.timestamp ?? Date.now(),
    date: new Date(sensor.timestamp ?? Date.now()).toLocaleDateString(),
    inputMethod: 'sensor',
    source: sensor.source ?? 'tap',
    location: sensor.location,
    safetyLevel: level,
    safetyLabel: safetyLabelFor(level, userObs.usedForDrinking ?? true),
    riskScore: risk,
    confidence,
    qualityScore: 100 - risk,
    qualityLevel: quality,
    issues,
    actions,
    parameterSummaries: summaries,
    headline: safetyLabelFor(level, userObs.usedForDrinking ?? true),
    summary: buildSummary(level, issues, sensor.source ?? 'tap', 'sensor'),
    infrastructureAlert: undefined,
    qualityLevel_legacy: quality,
    issues_legacy: issues.map(i => i.title),
    recommendations: actions.map(a => a.action),
    urgencyLevel: level === 'dangerous' || level === 'unsafe' ? 'high' : level === 'caution' ? 'medium' : 'low',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function getTasteExplanation(taste: string): string {
  const map: Record<string, string> = {
    bitter: 'A bitter taste can indicate high mineral content, chlorination by-products, or contamination. Avoid drinking until checked.',
    salty: 'Salty-tasting water may have high sodium or chloride content — sometimes from saltwater intrusion or softener run-off.',
    metallic: 'A metallic taste usually means high iron, copper or lead — often from ageing pipes. Have your plumbing tested.',
    sweet: 'A sweet taste is unusual and could indicate algae or dissolved minerals. Investigate the source.',
    chemical: 'A chemical taste is a serious warning sign of industrial contamination or disinfection by-products. Do NOT drink.',
    other: 'An unusual taste warrants investigation — have the water tested by a certified lab.',
  };
  return map[taste] ?? 'Unusual taste detected — have the water tested.';
}
