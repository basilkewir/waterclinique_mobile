export interface WaterStandard {
  parameter: string;
  epa: {
    mclg?: number;
    mcl?: number;
    unit: string;
    healthEffects: string;
    sources: string;
  };
  who: {
    guidelineValue?: number;
    unit: string;
    healthBasis: string;
    notes: string;
  };
  category: 'microbiological' | 'disinfection' | 'inorganic' | 'organic' | 'radiological' | 'aesthetic';
  epaType: 'MCL' | 'MCLG' | 'TT' | 'MRDL' | 'MRDLG' | 'Action Level';
  whoType: 'Guideline Value' | 'No Guideline' | 'Provisional Guideline';
  acceptableRange?: [number, number];
  warningRange?: [number, number];
  criticalRange?: [number, number];
  healthRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  testingMethod: string;
  frequency: string;
  epaLastUpdated: string;
  whoLastUpdated: string;
}

export const WATER_STANDARDS: WaterStandard[] = [
  // pH Standards
  {
    parameter: 'pH',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'pH units',
      healthEffects: 'No direct health effects, but affects corrosion and disinfection',
      sources: 'Water chemistry and treatment processes'
    },
    who: {
      guidelineValue: undefined,
      unit: 'pH units',
      healthBasis: 'No health-based guideline value',
      notes: 'pH usually has no direct impact on health. However, pH above 8 can cause skin problems, and pH above 11 can cause eye irritation. Low pH can cause corrosion of pipes and may lead to mobilization of metals.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [6.5, 8.5],
    warningRange: [6.0, 6.5, 8.5, 9.0],
    criticalRange: [0, 6.0, 9.0, 14],
    healthRiskLevel: 'low',
    testingMethod: 'pH meter, litmus paper',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Turbidity Standards
  {
    parameter: 'Turbidity',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'NTU',
      healthEffects: 'Higher turbidity can harbor pathogens and reduce disinfection effectiveness',
      sources: 'Soil runoff, organic matter, microorganisms'
    },
    who: {
      guidelineValue: 1,
      unit: 'NTU',
      healthBasis: 'For effective disinfection',
      notes: 'Turbidity should be <1 NTU for effective disinfection. <5 NTU is acceptable for aesthetic reasons.'
    },
    category: 'microbiological',
    epaType: 'TT',
    whoType: 'Guideline Value',
    acceptableRange: [0, 1],
    warningRange: [1, 5],
    criticalRange: [5, 1000],
    healthRiskLevel: 'medium',
    testingMethod: 'Turbidimeter, nephelometer',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Free Chlorine Standards
  {
    parameter: 'Chlorine',
    epa: {
      mclg: 4,
      mcl: 4,
      unit: 'mg/L',
      healthEffects: 'Eye/nose irritation; stomach discomfort',
      sources: 'Water additive used to control microbes'
    },
    who: {
      guidelineValue: 5,
      unit: 'mg/L',
      healthBasis: 'Taste and acceptability',
      notes: 'Taste threshold is about 5 mg/L. No health-based guideline value proposed.'
    },
    category: 'disinfection',
    epaType: 'MRDL',
    whoType: 'Guideline Value',
    acceptableRange: [0.2, 4],
    warningRange: [4, 5],
    criticalRange: [5, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Colorimeter, DPD test',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Total Dissolved Solids (TDS)
  {
    parameter: 'TDS',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'mg/L',
      healthEffects: 'No direct health effects, but affects taste and water quality',
      sources: 'Natural mineral dissolution, agricultural runoff'
    },
    who: {
      guidelineValue: 1000,
      unit: 'mg/L',
      healthBasis: 'Acceptability aspects',
      notes: 'For drinking-water, palatability is poor above 1000 mg/L. TDS <600 mg/L is regarded as good.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'Guideline Value',
    acceptableRange: [0, 600],
    warningRange: [600, 1000],
    criticalRange: [1000, 2000],
    healthRiskLevel: 'low',
    testingMethod: 'Conductivity meter, gravimetric analysis',
    frequency: 'Monthly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Conductivity
  {
    parameter: 'Conductivity',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'µS/cm',
      healthEffects: 'No direct health effects, indicator of dissolved solids',
      sources: 'Mineral content, dissolved salts'
    },
    who: {
      guidelineValue: undefined,
      unit: 'µS/cm',
      healthBasis: 'No health-based guideline value',
      notes: 'Conductivity is an indirect indicator of water quality. No specific health guideline.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1000],
    warningRange: [1000, 2000],
    criticalRange: [2000, 5000],
    healthRiskLevel: 'low',
    testingMethod: 'Conductivity meter',
    frequency: 'Monthly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Temperature
  {
    parameter: 'Temperature',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: '°C',
      healthEffects: 'No direct health effects, affects microbial growth',
      sources: 'Environmental conditions, water source'
    },
    who: {
      guidelineValue: undefined,
      unit: '°C',
      healthBasis: 'No health-based guideline value',
      notes: 'No specific health guideline. Temperature affects taste and microbial growth.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 25],
    warningRange: [25, 35],
    criticalRange: [35, 100],
    healthRiskLevel: 'low',
    testingMethod: 'Thermometer, temperature probe',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Color
  {
    parameter: 'Color',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'color units',
      healthEffects: 'No direct health effects, aesthetic concern',
      sources: 'Organic matter, minerals, industrial discharge'
    },
    who: {
      guidelineValue: undefined,
      unit: 'color units',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. <15 color units is acceptable for consumers.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 15],
    warningRange: [15, 30],
    criticalRange: [30, 100],
    healthRiskLevel: 'low',
    testingMethod: 'Color comparator, spectrophotometer',
    frequency: 'Weekly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Clarity
  {
    parameter: 'Clarity',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'visual scale',
      healthEffects: 'No direct health effects, aesthetic concern',
      sources: 'Suspended particles, microorganisms'
    },
    who: {
      guidelineValue: undefined,
      unit: 'visual scale',
      healthBasis: 'No health-based guideline value',
      notes: 'No specific health guideline. Clarity is related to turbidity and aesthetics.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1],
    warningRange: [1, 3],
    criticalRange: [3, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Visual inspection',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Foam
  {
    parameter: 'Foam',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'visual scale',
      healthEffects: 'No direct health effects, may indicate pollution',
      sources: 'Detergents, organic matter, industrial discharge'
    },
    who: {
      guidelineValue: undefined,
      unit: 'visual scale',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. Persistent foam may indicate pollution.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1],
    warningRange: [1, 3],
    criticalRange: [3, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Visual inspection',
    frequency: 'Weekly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Smell
  {
    parameter: 'Smell',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'threshold odor number',
      healthEffects: 'No direct health effects, may indicate contamination',
      sources: 'Organic matter, chemicals, microorganisms'
    },
    who: {
      guidelineValue: undefined,
      unit: 'threshold odor number',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. Water should be free of objectionable odors.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1],
    warningRange: [1, 3],
    criticalRange: [3, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Sensory evaluation',
    frequency: 'Weekly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Taste
  {
    parameter: 'Taste',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'taste units',
      healthEffects: 'No direct health effects, aesthetic concern',
      sources: 'Minerals, organic matter, chemicals'
    },
    who: {
      guidelineValue: undefined,
      unit: 'taste units',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. Water should be free of objectionable tastes.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1],
    warningRange: [1, 3],
    criticalRange: [3, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Sensory evaluation',
    frequency: 'Weekly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Particles
  {
    parameter: 'Particles',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'visual scale',
      healthEffects: 'No direct health effects, may indicate contamination',
      sources: 'Suspended solids, microorganisms'
    },
    who: {
      guidelineValue: undefined,
      unit: 'visual scale',
      healthBasis: 'No health-based guideline value',
      notes: 'No specific health guideline. Visible particles may indicate need for filtration.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 1],
    warningRange: [1, 3],
    criticalRange: [3, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Visual inspection',
    frequency: 'Daily',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Total Coliforms
  {
    parameter: 'Total Coliforms',
    epa: {
      mclg: 0,
      mcl: '5% of samples',
      unit: 'CFU/100mL',
      healthEffects: 'Indicator of potential pathogen presence',
      sources: 'Human and animal fecal waste'
    },
    who: {
      guidelineValue: 0,
      unit: 'CFU/100mL',
      healthBasis: 'Indicator of fecal contamination',
      notes: 'E. coli or thermotolerant coliform bacteria must not be detectable in any 100 mL sample.'
    },
    category: 'microbiological',
    epaType: 'MCL',
    whoType: 'Guideline Value',
    acceptableRange: [0, 0],
    warningRange: [0, 1],
    criticalRange: [1, 100],
    healthRiskLevel: 'high',
    testingMethod: 'Membrane filtration, multiple tube fermentation',
    frequency: 'Monthly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Nitrate
  {
    parameter: 'Nitrate',
    epa: {
      mclg: 10,
      mcl: 10,
      unit: 'mg/L (as N)',
      healthEffects: 'Methemoglobinemia ("blue baby syndrome") in infants',
      sources: 'Runoff from fertilizer use, leaching from septic tanks'
    },
    who: {
      guidelineValue: 50,
      unit: 'mg/L (as NO3)',
      healthBasis: 'Methemoglobinemia',
      notes: 'Short-term exposure: 50 mg/L as NO3. Long-term exposure: 3 mg/L as NO2.'
    },
    category: 'inorganic',
    epaType: 'MCL',
    whoType: 'Guideline Value',
    acceptableRange: [0, 10],
    warningRange: [10, 50],
    criticalRange: [50, 100],
    healthRiskLevel: 'medium',
    testingMethod: 'Ion chromatography, colorimetry',
    frequency: 'Quarterly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Lead
  {
    parameter: 'Lead',
    epa: {
      mclg: 0,
      mcl: 0.015,
      unit: 'mg/L',
      healthEffects: 'Developmental delays in children, kidney problems in adults',
      sources: 'Corrosion of household plumbing systems'
    },
    who: {
      guidelineValue: 0.01,
      unit: 'mg/L',
      healthBasis: 'Developmental neurotoxicity',
      notes: 'Provisional guideline value. Lead is highly toxic, especially to children.'
    },
    category: 'inorganic',
    epaType: 'Action Level',
    whoType: 'Provisional Guideline',
    acceptableRange: [0, 0.01],
    warningRange: [0.01, 0.015],
    criticalRange: [0.015, 0.05],
    healthRiskLevel: 'high',
    testingMethod: 'Atomic absorption spectroscopy, ICP-MS',
    frequency: 'Annual',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Arsenic
  {
    parameter: 'Arsenic',
    epa: {
      mclg: 0,
      mcl: 0.010,
      unit: 'mg/L',
      healthEffects: 'Skin damage, circulatory problems, increased cancer risk',
      sources: 'Erosion of natural deposits, runoff from orchards'
    },
    who: {
      guidelineValue: 0.01,
      unit: 'mg/L',
      healthBasis: 'Cancer and skin lesions',
      notes: 'Provisional guideline value. Arsenic is a known carcinogen.'
    },
    category: 'inorganic',
    epaType: 'MCL',
    whoType: 'Provisional Guideline',
    acceptableRange: [0, 0.01],
    warningRange: [0.01, 0.05],
    criticalRange: [0.05, 0.1],
    healthRiskLevel: 'high',
    testingMethod: 'Atomic absorption spectroscopy, ICP-MS',
    frequency: 'Annual',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Fluoride
  {
    parameter: 'Fluoride',
    epa: {
      mclg: 4,
      mcl: 4,
      unit: 'mg/L',
      healthEffects: 'Bone disease, mottled teeth in children',
      sources: 'Water additive, natural deposits, industrial discharge'
    },
    who: {
      guidelineValue: 1.5,
      unit: 'mg/L',
      healthBasis: 'Dental and skeletal fluorosis',
      notes: 'Climate-dependent. Higher temperatures may require lower limits.'
    },
    category: 'inorganic',
    epaType: 'MCL',
    whoType: 'Guideline Value',
    acceptableRange: [0, 1.5],
    warningRange: [1.5, 4],
    criticalRange: [4, 10],
    healthRiskLevel: 'medium',
    testingMethod: 'Ion-selective electrode, colorimetry',
    frequency: 'Quarterly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Iron
  {
    parameter: 'Iron',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'mg/L',
      healthEffects: 'No direct health effects, aesthetic concern',
      sources: 'Corrosion of iron pipes, natural deposits'
    },
    who: {
      guidelineValue: undefined,
      unit: 'mg/L',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. <0.3 mg/L for acceptability.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 0.3],
    warningRange: [0.3, 1],
    criticalRange: [1, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Colorimetry, atomic absorption',
    frequency: 'Monthly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Manganese
  {
    parameter: 'Manganese',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'mg/L',
      healthEffects: 'Neurological effects',
      sources: 'Natural deposits, industrial discharge'
    },
    who: {
      guidelineValue: 0.4,
      unit: 'mg/L',
      healthBasis: 'Neurological effects',
      notes: 'Provisional guideline value. Can cause neurological effects.'
    },
    category: 'inorganic',
    epaType: 'MCL',
    whoType: 'Provisional Guideline',
    acceptableRange: [0, 0.1],
    warningRange: [0.1, 0.4],
    criticalRange: [0.4, 1],
    healthRiskLevel: 'medium',
    testingMethod: 'Atomic absorption, ICP-MS',
    frequency: 'Quarterly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Copper
  {
    parameter: 'Copper',
    epa: {
      mclg: 1.3,
      mcl: 'Action Level 1.3',
      unit: 'mg/L',
      healthEffects: 'Gastrointestinal distress, liver or kidney damage',
      sources: 'Corrosion of household plumbing systems'
    },
    who: {
      guidelineValue: 2,
      unit: 'mg/L',
      healthBasis: 'Gastrointestinal effects',
      notes: 'Short-term exposure guideline. No long-term health effects expected.'
    },
    category: 'inorganic',
    epaType: 'Action Level',
    whoType: 'Guideline Value',
    acceptableRange: [0, 1.3],
    warningRange: [1.3, 2],
    criticalRange: [2, 5],
    healthRiskLevel: 'medium',
    testingMethod: 'Atomic absorption, ICP-MS',
    frequency: 'Annual',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Zinc
  {
    parameter: 'Zinc',
    epa: {
      mclg: undefined,
      mcl: undefined,
      unit: 'mg/L',
      healthEffects: 'No direct health effects, aesthetic concern',
      sources: 'Natural deposits, industrial discharge'
    },
    who: {
      guidelineValue: undefined,
      unit: 'mg/L',
      healthBasis: 'No health-based guideline value',
      notes: 'No health-based guideline. <3 mg/L for acceptability.'
    },
    category: 'aesthetic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 3],
    warningRange: [3, 5],
    criticalRange: [5, 10],
    healthRiskLevel: 'low',
    testingMethod: 'Atomic absorption, ICP-MS',
    frequency: 'Monthly',
    epaLastUpdated: '2023',
    whoLastUpdated: '2022'
  },

  // Perchlorate (New 2026 Standard)
  {
    parameter: 'Perchlorate',
    epa: {
      mclg: 0.02,
      mcl: 0.02,
      unit: 'mg/L',
      healthEffects: 'Thyroid hormone disruption',
      sources: 'Industrial discharge, fireworks, rocket fuel'
    },
    who: {
      guidelineValue: undefined,
      unit: 'mg/L',
      healthBasis: 'No guideline value',
      notes: 'No WHO guideline value established. EPA added in 2024, monitoring starts 2026.'
    },
    category: 'inorganic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 0.02],
    warningRange: [0.02, 0.05],
    criticalRange: [0.05, 0.1],
    healthRiskLevel: 'high',
    testingMethod: 'Ion chromatography, LC-MS',
    frequency: 'Quarterly',
    epaLastUpdated: '2024',
    whoLastUpdated: '2022'
  },

  // PFAS (New 2024 Standard)
  {
    parameter: 'PFAS',
    epa: {
      mclg: 0,
      mcl: 0.000004,
      unit: 'mg/L',
      healthEffects: 'Increased cholesterol, decreased vaccine response, cancer',
      sources: 'Industrial discharge, firefighting foam, consumer products'
    },
    who: {
      guidelineValue: undefined,
      unit: 'mg/L',
      healthBasis: 'No guideline value',
      notes: 'No WHO guideline value established. EPA added in 2024, monitoring starts 2026.'
    },
    category: 'organic',
    epaType: 'MCL',
    whoType: 'No Guideline',
    acceptableRange: [0, 0.000004],
    warningRange: [0.000004, 0.00001],
    criticalRange: [0.00001, 0.0001],
    healthRiskLevel: 'critical',
    testingMethod: 'LC-MS/MS, EPA Method 533/537',
    frequency: 'Quarterly',
    epaLastUpdated: '2024',
    whoLastUpdated: '2022'
  }
];

import ApiService from './ApiService';

// Cache for API standards
let cachedStandards: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface ApiWaterStandard {
  id: number;
  parameter_key: string;
  parameter_name: string;
  unit: string;
  description: string;
  who_min: number | null;
  who_max: number | null;
  who_ideal: number | null;
  cameroon_min: number | null;
  cameroon_max: number | null;
  cameroon_ideal: number | null;
  excellent_max: number | null;
  good_max: number | null;
  acceptable_max: number | null;
  poor_max: number | null;
  risk_weight: number;
  health_impacts: string | null;
  treatment_methods: string | null;
  is_active: boolean;
}

export interface AssessmentResult {
  parameter_key: string;
  parameter_name: string;
  unit: string;
  value: number;
  quality_level: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  quality_score: number;
  is_safe: boolean;
  message: string;
  recommendations?: string[];
}

export function getStandard(parameter: string): WaterStandard | undefined {
  return WATER_STANDARDS.find(s => s.parameter.toLowerCase() === parameter.toLowerCase());
}

/**
 * Fetch all standards from API with caching
 */
export async function fetchStandardsFromAPI(forceRefresh = false): Promise<ApiWaterStandard[]> {
  const now = Date.now();
  
  if (!forceRefresh && cachedStandards && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedStandards;
  }

  try {
    const response = await ApiService.getStandards({ active: true });
    if (response.success && response.data) {
      cachedStandards = response.data;
      lastFetchTime = now;
      return cachedStandards;
    }
  } catch (error) {
    console.warn('Failed to fetch standards from API, using local data:', error);
  }

  return [];
}

/**
 * Get standards as a map keyed by parameter_key
 */
export async function getStandardsMap(): Promise<Record<string, ApiWaterStandard>> {
  try {
    const response = await ApiService.getStandardsMap();
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to fetch standards map from API:', error);
  }

  // Fallback to local data converted to map format
  const map: Record<string, ApiWaterStandard> = {};
  WATER_STANDARDS.forEach(s => {
    const key = s.parameter.toLowerCase().replace(/\s+/g, '_');
    map[key] = convertLocalToApiStandard(s);
  });
  return map;
}

/**
 * Assess a single parameter value against standards via API
 */
export async function assessParameterAPI(parameterKey: string, value: number): Promise<AssessmentResult | null> {
  try {
    const response = await ApiService.assessParameterValue(parameterKey, value);
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to assess parameter via API:', error);
  }

  // Fallback to local assessment
  return assessParameterLocal(parameterKey, value);
}

/**
 * Batch assess multiple parameters via API
 */
export async function batchAssessParametersAPI(parameters: { key: string; value: number }[]): Promise<{
  parameters: AssessmentResult[];
  overall_score: number;
  overall_quality: string;
} | null> {
  try {
    const response = await ApiService.batchAssessParameters(parameters);
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to batch assess via API:', error);
  }

  return null;
}

/**
 * Local fallback assessment
 */
function assessParameterLocal(parameterKey: string, value: number): AssessmentResult | null {
  const standard = getStandard(parameterKey);
  if (!standard) return null;

  let quality_level: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' = 'acceptable';
  let quality_score = 50;
  let is_safe = true;
  let message = '';

  // Check against ranges
  if (standard.acceptableRange) {
    const [min, max] = standard.acceptableRange;
    if (value >= min && value <= max) {
      quality_level = 'excellent';
      quality_score = 100;
      message = `${standard.parameter} is within acceptable range`;
    }
  }

  if (standard.warningRange && quality_level !== 'excellent') {
    const ranges = standard.warningRange;
    for (let i = 0; i < ranges.length - 1; i += 2) {
      if (value >= ranges[i] && value <= ranges[i + 1]) {
        quality_level = 'good';
        quality_score = 70;
        is_safe = true;
        message = `${standard.parameter} is in warning range`;
        break;
      }
    }
  }

  if (standard.criticalRange && quality_level === 'acceptable') {
    const ranges = standard.criticalRange;
    for (let i = 0; i < ranges.length - 1; i += 2) {
      if (value >= ranges[i] && value <= ranges[i + 1]) {
        quality_level = 'critical';
        quality_score = 20;
        is_safe = false;
        message = `${standard.parameter} is in critical range!`;
        break;
      }
    }
  }

  return {
    parameter_key: parameterKey,
    parameter_name: standard.parameter,
    unit: standard.epa.unit,
    value,
    quality_level,
    quality_score,
    is_safe,
    message: message || `${standard.parameter} assessed`,
  };
}

/**
 * Convert local WaterStandard to API format
 */
function convertLocalToApiStandard(local: WaterStandard): ApiWaterStandard {
  const key = local.parameter.toLowerCase().replace(/\s+/g, '_');
  return {
    id: 0,
    parameter_key: key,
    parameter_name: local.parameter,
    unit: local.epa.unit,
    description: local.epa.healthEffects,
    who_min: local.who.guidelineValue ? local.who.guidelineValue * 0.8 : null,
    who_max: local.who.guidelineValue || null,
    who_ideal: local.who.guidelineValue || null,
    cameroon_min: local.acceptableRange ? local.acceptableRange[0] : null,
    cameroon_max: local.acceptableRange ? local.acceptableRange[1] : null,
    cameroon_ideal: null,
    excellent_max: local.acceptableRange ? local.acceptableRange[1] * 0.5 : null,
    good_max: local.acceptableRange ? local.acceptableRange[1] * 0.75 : null,
    acceptable_max: local.acceptableRange ? local.acceptableRange[1] : null,
    poor_max: local.warningRange ? local.warningRange[1] : null,
    risk_weight: local.healthRiskLevel === 'critical' ? 5 : 
                 local.healthRiskLevel === 'high' ? 4 :
                 local.healthRiskLevel === 'medium' ? 3 : 1,
    health_impacts: local.epa.healthEffects,
    treatment_methods: null,
    is_active: true,
  };
}

export function compareAgainstStandards(observation: any): {
  parameter: string;
  status: 'low' | 'high' | 'ok' | 'unknown';
  message: string;
  epaCompliance: 'compliant' | 'non-compliant' | 'not-applicable';
  whoCompliance: 'compliant' | 'non-compliant' | 'not-applicable';
}[] {
  const results: any[] = [];

  for (const [key, value] of Object.entries(observation)) {
    if (typeof value === 'number' || typeof value === 'string') {
      const standard = getStandard(key);
      if (standard) {
        let status: 'low' | 'high' | 'ok' | 'unknown' = 'unknown';
        let message = '';
        let epaCompliance: 'compliant' | 'non-compliant' | 'not-applicable' = 'not-applicable';
        let whoCompliance: 'compliant' | 'non-compliant' | 'not-applicable' = 'not-applicable';

        if (typeof value === 'number') {
          if (standard.epa.mclg !== undefined && standard.epa.mcl !== undefined) {
            if (value < standard.epa.mclg) {
              status = 'low';
              message = `Below EPA MCLG of ${standard.epa.mclg} ${standard.epa.unit}`;
            } else if (value > standard.epa.mcl) {
              status = 'high';
              message = `Exceeds EPA MCL of ${standard.epa.mcl} ${standard.epa.unit}`;
              epaCompliance = 'non-compliant';
            } else {
              status = 'ok';
              message = `Within EPA limits (${standard.epa.mclg}-${standard.epa.mcl} ${standard.epa.unit})`;
              epaCompliance = 'compliant';
            }
          } else if (standard.epa.mclg !== undefined) {
            if (value < standard.epa.mclg) {
              status = 'low';
              message = `Below EPA MCLG of ${standard.epa.mclg} ${standard.epa.unit}`;
            } else {
              status = 'ok';
              message = `Above EPA MCLG of ${standard.epa.mclg} ${standard.epa.unit}`;
              epaCompliance = 'compliant';
            }
          } else if (standard.epa.mcl !== undefined) {
            if (value > standard.epa.mcl) {
              status = 'high';
              message = `Exceeds EPA MCL of ${standard.epa.mcl} ${standard.epa.unit}`;
              epaCompliance = 'non-compliant';
            } else {
              status = 'ok';
              message = `Within EPA MCL of ${standard.epa.mcl} ${standard.epa.unit}`;
              epaCompliance = 'compliant';
            }
          }

          if (standard.who.guidelineValue !== undefined) {
            if (value < standard.who.guidelineValue) {
              whoCompliance = 'compliant';
            } else {
              whoCompliance = 'non-compliant';
            }
          }
        } else {
          // For non-numeric parameters, mark as ok if value exists
          status = 'ok';
          message = 'Parameter measured';
          epaCompliance = 'compliant';
          whoCompliance = 'compliant';
        }

        results.push({
          parameter: key,
          status,
          message,
          epaCompliance,
          whoCompliance
        });
      } else {
        results.push({
          parameter: key,
          status: 'unknown',
          message: 'No standard available',
          epaCompliance: 'not-applicable',
          whoCompliance: 'not-applicable'
        });
      }
    }
  }

  return results;
}
