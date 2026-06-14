import { VisionObject, VisionLabel, VisionColor, VisionTextBlock } from './GoogleVisionService';

export interface VisionExtractedContainer {
  glass_detected: boolean;
  water_detected: boolean;
  plastic_detected: boolean;
  container_type: string;
  passed: boolean;
  reason: string;
  suggested_action: string;
}

export interface VisionExtractedColor {
  dominant_name: string;
  is_clear: boolean;
  is_yellow: boolean;
  is_brown: boolean;
  is_green: boolean;
  is_red: boolean;
  darkness: number;
  saturation: number;
}

export interface VisionExtractedColorFull {
  red: number;
  green: number;
  blue: number;
  score: number;
  pixel_fraction: number;
}

export interface VisionBackgroundColor {
  name: string;
  rgb: { r: number; g: number; b: number };
  pixel_fraction: number;
  is_neutral: boolean;        // white / light grey / sky — does NOT tint water
  may_tint_water: boolean;    // coloured background that can cast colour into the glass
  tint_warning: string;       // human-readable warning if may_tint_water is true
}

export interface VisionTurbidityEstimate {
  ntu_estimate: number;       // 0–200 rough NTU estimate from pixel analysis
  clarity_grade: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  color_code: string;         // WHO-aligned hex color code for UI
  confidence: number;         // 0–100
}

export interface VisionDetectedReading {
  raw_text: string;           // e.g. "pH 7.2" or "TDS 320 mg/L"
  parameter?: string;         // e.g. "pH"
  value?: number;             // numeric value extracted
  unit?: string;              // e.g. "mg/L"
  confidence: number;
}

export interface VisionExtractedData {
  container: VisionExtractedContainer;
  colors: {
    dominant: VisionExtractedColorFull[];
    analysis: VisionExtractedColor;
    background: VisionBackgroundColor;
    water_corrected: VisionExtractedColor;
  };
  labels: { description: string; score: number; topicality: number }[];
  objects: { name: string; score: number }[];
  particles: {
    detected: boolean;
    severity: 'none' | 'minor' | 'moderate' | 'heavy';
    description: string;
  };
  turbidity: VisionTurbidityEstimate;
  detected_readings: VisionDetectedReading[];
  full_text: string;
  color_confidence: number;   // 0–100: how confident the color analysis is
}

const GLASS_KEYWORDS = [
  'glass', 'cup', 'tumbler', 'drinkware', 'drinking glass',
  'wine glass', 'beaker', 'lab glass', 'glass bottle',
  'clear glass', 'transparent container',
];

const WATER_KEYWORDS = [
  'water', 'liquid', 'drink', 'beverage', 'fluid',
  'drinking water', 'mineral water', 'tap water',
  'aqua', 'h2o', 'ice water',
];

const PLASTIC_KEYWORDS = [
  'plastic bottle', 'plastic cup', 'plastic container',
  'bottle', 'water bottle', 'pet bottle',
];

const PARTICLE_KEYWORDS = [
  'particle', 'sediment', 'debris', 'precipitate', 'silt', 'sand',
  'floating', 'suspension', 'turbidity', 'solid', 'granule',
  'dust', 'flakes', 'rust flake', 'mineral deposit',
];

function hasKeyword(list: string[], items: { name: string }[]): boolean {
  return items.some(item =>
    list.some(kw => item.name.toLowerCase().includes(kw.toLowerCase()))
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function nameColor(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l > 90 && s < 12) return 'colourless';
  if (l > 78 && s < 18) return 'very pale';
  if (h >= 30 && h <= 70 && s > 20) return 'yellow';
  if (h >= 10 && h <= 30 && s > 20 && l < 60) return 'brown';
  if (h >= 80 && h <= 160 && s > 20) return 'green';
  if ((h >= 0 && h <= 10 || h >= 340) && s > 30 && l > 40) return 'red';
  if (h >= 180 && h <= 260 && s > 15) return 'blue';
  if (l < 30) return 'dark';
  return 'colourless';
}

/** Determine if an RGB color is a neutral background (white, light grey, sky blue). */
function isNeutralBackground(r: number, g: number, b: number): boolean {
  const { h, s, l } = rgbToHsl(r, g, b);
  // White / light grey
  if (l > 75 && s < 20) return true;
  // Open sky — light blue with low saturation or mid-light
  if (h >= 195 && h <= 230 && s < 55 && l > 45) return true;
  return false;
}

/**
 * Identify the background color — the color with the LARGEST pixel_fraction
 * that is NOT part of the glass/water area.
 *
 * Heuristic: background colors tend to have very high pixel_fraction (they fill
 * most of the frame). The glass + water typically occupies 20–50% of the frame.
 * We treat the single color cluster with the highest pixel_fraction as the
 * background candidate if it covers > 25% of pixels.
 */
function extractBackground(colors: VisionColor[]): VisionBackgroundColor {
  if (colors.length === 0) {
    return { name: 'unknown', rgb: { r: 255, g: 255, b: 255 }, pixel_fraction: 0, is_neutral: true, may_tint_water: false, tint_warning: '' };
  }

  // Sort by pixel_fraction descending
  const sorted = [...colors].sort((a, b) => (b.pixelFraction || 0) - (a.pixelFraction || 0));
  const bg = sorted[0];
  const { r, g, b: bv } = bg.color;
  const name = nameColor(r, g, bv);
  const neutral = isNeutralBackground(r, g, bv);
  const mayTint = !neutral && (bg.pixelFraction > 0.15);

  let tintWarning = '';
  if (mayTint) {
    tintWarning = `Background is ${name} (RGB ${r},${g},${bv}) covering ~${Math.round((bg.pixelFraction || 0) * 100)}% of the image. ` +
      `This coloured background may cast a ${name} tint onto the water through the glass. ` +
      `The AI must subtract this background tint when assessing true water colour.`;
  }

  return {
    name,
    rgb: { r, g, b: bv },
    pixel_fraction: bg.pixelFraction || 0,
    is_neutral: neutral,
    may_tint_water: mayTint,
    tint_warning: tintWarning,
  };
}

/**
 * Compute a background-corrected water colour estimate.
 *
 * Strategy: exclude the highest-pixel-fraction color cluster (background) and
 * re-run the weighted average on the remaining clusters. These remaining clusters
 * are more likely to represent the glass + water.
 */
function analyzeWaterColor(colors: VisionColor[], bgPixelFraction: number): VisionExtractedColor {
  if (colors.length === 0) {
    return { dominant_name: 'unknown', is_clear: false, is_yellow: false, is_brown: false, is_green: false, is_red: false, darkness: 50, saturation: 0 };
  }

  // Sort and exclude the dominant background cluster if it covers > 20% of pixels
  const sorted = [...colors].sort((a, b) => (b.pixelFraction || 0) - (a.pixelFraction || 0));
  const waterColors = bgPixelFraction > 0.20 ? sorted.slice(1) : sorted;

  // Fall back to all colors if exclusion leaves nothing
  const pool = waterColors.length > 0 ? waterColors : sorted;

  let totalWeight = 0;
  let wR = 0, wG = 0, wB = 0, wS = 0, wL = 0;

  for (const c of pool) {
    const w = c.pixelFraction || c.score || 1;
    totalWeight += w;
    const { r, g, b } = c.color;
    wR += r * w; wG += g * w; wB += b * w;
    const { s, l } = rgbToHsl(r, g, b);
    wS += s * w; wL += l * w;
  }

  if (totalWeight === 0) {
    return { dominant_name: 'unknown', is_clear: false, is_yellow: false, is_brown: false, is_green: false, is_red: false, darkness: 50, saturation: 0 };
  }

  const r = wR / totalWeight;
  const g = wG / totalWeight;
  const b = wB / totalWeight;
  const avgS = wS / totalWeight;
  const avgL = wL / totalWeight;
  const name = nameColor(Math.round(r), Math.round(g), Math.round(b));

  return {
    dominant_name: name,
    is_clear: name === 'colourless' || name === 'very pale',
    is_yellow: name === 'yellow',
    is_brown: name === 'brown',
    is_green: name === 'green',
    is_red: name === 'red',
    darkness: 100 - avgL,
    saturation: avgS,
  };
}

/** Full-image weighted average (kept for reference / AI context). */
function analyzeColors(colors: VisionColor[]): VisionExtractedColor {
  if (colors.length === 0) {
    return { dominant_name: 'unknown', is_clear: false, is_yellow: false, is_brown: false, is_green: false, is_red: false, darkness: 50, saturation: 0 };
  }
  let totalWeight = 0, wR = 0, wG = 0, wB = 0, wS = 0, wL = 0;
  for (const c of colors) {
    const w = c.pixelFraction || c.score || 1;
    totalWeight += w;
    const { r, g, b } = c.color;
    wR += r * w; wG += g * w; wB += b * w;
    const { s, l } = rgbToHsl(r, g, b);
    wS += s * w; wL += l * w;
  }
  if (totalWeight === 0) return { dominant_name: 'unknown', is_clear: false, is_yellow: false, is_brown: false, is_green: false, is_red: false, darkness: 50, saturation: 0 };
  const r = wR / totalWeight, g = wG / totalWeight, b = wB / totalWeight;
  const name = nameColor(Math.round(r), Math.round(g), Math.round(b));
  return {
    dominant_name: name,
    is_clear: name === 'colourless' || name === 'very pale',
    is_yellow: name === 'yellow',
    is_brown: name === 'brown',
    is_green: name === 'green',
    is_red: name === 'red',
    darkness: 100 - (wL / totalWeight),
    saturation: wS / totalWeight,
  };
}

// ── Turbidity estimation ──────────────────────────────────────────────────────
/**
 * Estimate turbidity (NTU) from color cluster analysis.
 * Uses pixel fraction weighted standard deviation of brightness across clusters.
 * Calibrated against WHO thresholds:
 *   < 1 NTU  = excellent (crystal clear)
 *   1–4 NTU  = good
 *   4–10 NTU = acceptable
 *   > 10 NTU = poor / critical
 */
function estimateTurbidity(colors: VisionColor[], waterCorrected: VisionExtractedColor): VisionTurbidityEstimate {
  if (colors.length === 0) {
    return { ntu_estimate: 0, clarity_grade: 'excellent', color_code: '#22c55e', confidence: 20 };
  }

  // Weighted standard deviation of brightness across clusters → proxy for turbidity
  const sorted = [...colors].sort((a, b) => (b.pixelFraction || 0) - (a.pixelFraction || 0));
  const pool = sorted.length > 1 ? sorted.slice(1) : sorted; // exclude dominant background

  let totalW = 0, wSum = 0, wSumSq = 0;
  for (const c of pool) {
    const w = c.pixelFraction || c.score || 1;
    const brightness = (c.color.red * 0.299 + c.color.green * 0.587 + c.color.blue * 0.114);
    totalW += w;
    wSum += brightness * w;
    wSumSq += brightness * brightness * w;
  }

  let stdDev = 0;
  if (totalW > 0) {
    const mean = wSum / totalW;
    const variance = (wSumSq / totalW) - (mean * mean);
    stdDev = Math.sqrt(Math.max(0, variance));
  }

  // Saturation boost — tinted water inflates turbidity perception
  const satBoost = waterCorrected.saturation * 0.3;
  const darknessBoost = waterCorrected.darkness * 0.1;
  const rawNtu = stdDev * 0.8 + satBoost + darknessBoost;
  const ntu = Math.min(200, Math.round(rawNtu * 10) / 10);

  let clarity_grade: VisionTurbidityEstimate['clarity_grade'];
  let color_code: string;

  if (ntu < 1)       { clarity_grade = 'excellent'; color_code = '#22c55e'; }
  else if (ntu < 4)  { clarity_grade = 'good';      color_code = '#84cc16'; }
  else if (ntu < 10) { clarity_grade = 'acceptable'; color_code = '#eab308'; }
  else if (ntu < 50) { clarity_grade = 'poor';      color_code = '#f97316'; }
  else               { clarity_grade = 'critical';  color_code = '#ef4444'; }

  // Confidence: higher when we have more color clusters
  const confidence = Math.min(90, 40 + colors.length * 8);

  return { ntu_estimate: ntu, clarity_grade, color_code, confidence };
}

// ── Test-strip / reading text extraction ──────────────────────────────────────
const PARAM_PATTERNS: { param: string; unit: string; pattern: RegExp }[] = [
  { param: 'pH',          unit: '',       pattern: /pH\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'TDS',         unit: 'mg/L',   pattern: /TDS\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'turbidity',   unit: 'NTU',    pattern: /(?:turbidity|NTU)\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'chlorine',    unit: 'mg/L',   pattern: /(?:Cl|chlorine)\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'temperature', unit: '°C',     pattern: /(?:temp|°C|°F)\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'conductivity', unit: 'µS/cm', pattern: /(?:cond|EC|µS)\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'nitrate',     unit: 'mg/L',   pattern: /NO3\s*[:\-]?\s*(\d+\.?\d*)/i },
  { param: 'iron',        unit: 'mg/L',   pattern: /Fe\s*[:\-]?\s*(\d+\.?\d*)/i },
];

function extractReadings(fullText: string, textBlocks: VisionTextBlock[]): VisionDetectedReading[] {
  const readings: VisionDetectedReading[] = [];
  if (!fullText) return readings;

  for (const { param, unit, pattern } of PARAM_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        // Find the matching text block for confidence
        const block = textBlocks.find(b => b.text && pattern.test(b.text));
        readings.push({
          raw_text: match[0],
          parameter: param,
          value,
          unit,
          confidence: block?.confidence ? Math.round(block.confidence * 100) : 75,
        });
      }
    }
  }

  return readings;
}

// ── Color confidence ──────────────────────────────────────────────────────────
/**
 * How confident are we about the water color assessment?
 * High confidence = neutral background + many clusters + low tint risk.
 */
function computeColorConfidence(bg: VisionBackgroundColor, colors: VisionColor[], waterCorrected: VisionExtractedColor): number {
  let score = 50;
  if (bg.is_neutral) score += 30;
  if (!bg.may_tint_water) score += 10;
  score += Math.min(10, colors.length * 2);
  // Reduce confidence if background covers too much of the image
  if (bg.pixel_fraction > 0.6) score -= 20;
  if (bg.pixel_fraction > 0.8) score -= 20;
  return Math.max(10, Math.min(100, score));
}

export function extractVisionData(
  objects: VisionObject[],
  labels: VisionLabel[],
  colors: VisionColor[],
  fullText: string = '',
  textBlocks: VisionTextBlock[] = [],
): VisionExtractedData {
  const hasGlass = hasKeyword(GLASS_KEYWORDS, objects);
  const hasWater = hasKeyword(WATER_KEYWORDS, labels);
  const hasBottle = hasKeyword(PLASTIC_KEYWORDS, objects);

  let containerPassed = true;
  let containerType = 'clear_glass';
  let containerReason = '';
  let containerAction = '';

  if (!hasGlass && !hasWater) {
    containerPassed = false;
    containerType = 'none detected';
    containerReason = 'No glass container or water detected in the image. The image may not contain a water sample.';
    containerAction = 'Please take a photo of your water sample in a clear transparent glass cup, placed against a white background.';
  } else if (!hasGlass && hasWater) {
    containerPassed = false;
    containerType = 'unknown container';
    containerReason = 'Water/liquid was detected but no clear glass container was identified.';
    containerAction = 'Ensure the water sample is in a clear transparent drinking glass.';
  } else if (hasBottle) {
    containerPassed = false;
    containerType = 'plastic_bottle';
    containerReason = 'A plastic bottle was detected instead of a clear glass cup. Only clear glass containers are accepted.';
    containerAction = 'Pour the water into a clear transparent drinking glass and retake the photo.';
  } else if (hasGlass && !hasWater) {
    containerPassed = false;
    containerType = 'empty_glass';
    containerReason = 'A glass was detected but no water or liquid was identified inside it.';
    containerAction = 'Fill the glass at least 3/4 full with the water sample and retake the photo.';
  }

  // ── Background analysis ───────────────────────────────────────────────────
  const background = extractBackground(colors);

  // Full-image dominant color (includes background — for reference only)
  const fullImageColor = analyzeColors(colors);

  // Background-corrected water color estimate
  const waterCorrected = analyzeWaterColor(colors, background.pixel_fraction);

  // ── Particle / sediment detection ──────────────────────────────────────────
  const hasParticleLabel = hasKeyword(PARTICLE_KEYWORDS, labels);
  const hasParticleObject = hasKeyword(PARTICLE_KEYWORDS, objects);
  const particleDetected = hasParticleLabel || hasParticleObject;
  let particleSeverity: 'none' | 'minor' | 'moderate' | 'heavy' = 'none';
  let particleDesc = 'No visible particles detected by AI vision.';

  if (particleDetected) {
    const particleItems = [
      ...labels.filter(l => PARTICLE_KEYWORDS.some(kw => l.description.toLowerCase().includes(kw))),
      ...objects.filter(o => PARTICLE_KEYWORDS.some(kw => o.name.toLowerCase().includes(kw))),
    ];
    const avgScore = particleItems.reduce((s, i) => s + i.score, 0) / particleItems.length;
    if (avgScore > 0.8) {
      particleSeverity = 'heavy';
      particleDesc = 'High confidence particle/sediment detected — water likely contains visible particles.';
    } else if (avgScore > 0.5) {
      particleSeverity = 'moderate';
      particleDesc = 'Moderate confidence particle/sediment detected — water may contain visible particles.';
    } else {
      particleSeverity = 'minor';
      particleDesc = 'Low confidence particle/sediment detected — possible minor particles in water.';
    }
  }

  return {
    container: {
      glass_detected: hasGlass,
      water_detected: hasWater,
      plastic_detected: hasBottle,
      container_type: containerType,
      passed: containerPassed,
      reason: containerReason,
      suggested_action: containerAction,
    },
    colors: {
      dominant: colors.map(c => ({
        red: c.color.red,
        green: c.color.green,
        blue: c.color.blue,
        score: c.score,
        pixel_fraction: c.pixelFraction,
      })),
      analysis: fullImageColor,
      background,
      water_corrected: waterCorrected,
    },
    labels: labels.map(l => ({
      description: l.description,
      score: l.score,
      topicality: l.topicality,
    })),
    objects: objects.map(o => ({
      name: o.name,
      score: o.score,
    })),
    particles: {
      detected: particleDetected,
      severity: particleSeverity,
      description: particleDesc,
    },
    turbidity: estimateTurbidity(colors, waterCorrected),
    detected_readings: extractReadings(fullText, textBlocks),
    full_text: fullText,
    color_confidence: computeColorConfidence(background, colors, waterCorrected),
  };
}


