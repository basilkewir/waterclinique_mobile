import * as FileSystem from 'expo-file-system';
import SecureStorage from '@/services/SecureStorage';

const AI_KEY_STORAGE = 'openai_api_key';
const CLAUDE_KEY_STORAGE = 'claude_api_key';
const DEFAULT_MODEL = 'gpt-4o-mini';

export interface AIAnalysisResult {
  success: boolean;
  method: 'openai_direct' | 'claude_direct' | 'local_fallback';
  model?: string;
  processingTimeMs?: number;
  tokensUsed?: number;
  result: any;
  error?: string;
}

export interface DirectAIConfig {
  apiKey?: string;
  model?: string;
  provider?: 'openai' | 'claude';
}

class DirectAIService {
  private apiKey: string | null = null;

  async init(apiKey?: string): Promise<void> {
    if (apiKey) {
      this.apiKey = apiKey;
      await SecureStorage.setItem(AI_KEY_STORAGE, apiKey);
      return;
    }
    try {
      this.apiKey = await SecureStorage.getItem(AI_KEY_STORAGE);
    } catch {
      this.apiKey = null;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async imageToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { base64, mimeType };
  }

  private buildPrompt(observations?: Record<string, string>): string {
    const obsText = observations
      ? Object.entries(observations).filter(([, v]) => v && v !== 'undefined')
          .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
      : 'None provided';

    return `You are a certified water quality analyst with expertise in WHO Drinking Water Guidelines 2022, EPA standards, and field water safety assessment in Sub-Saharan Africa. You respond ONLY with valid JSON — no markdown, no preamble.

═══════════════════════════════════════════
MANDATORY PRE-ANALYSIS VALIDATION (execute in order — be STRICT)
═══════════════════════════════════════════

CHECK 1 — GLASS / CONTAINER DETECTION:
Examine the ENTIRE image carefully. Is there a clear transparent drinking glass (glass cup, glass tumbler, laboratory glass beaker) visibly present?
- ACCEPT: clear transparent drinking glass (most common), glass laboratory beaker/flask, clear glass cup, any TRANSPARENT glass container
- REJECT IMMEDIATELY: plastic bottles (opaque or transparent), plastic cups, metal cups/flasks, ceramic mugs, paper cups, styrofoam cups, clay pots, wooden cups, cans, any non-glass container, any non-transparent container, NO container at all
→ If NO acceptable glass/container is visible:
   Return ONLY: { "retake_required": true, "retake_reason": "no_glass", "retake_message": "No glass detected. Please pour the water sample into a CLEAR TRANSPARENT DRINKING GLASS (not plastic, not ceramic, not metal) and retake the photo against a plain white or light background.", "container_verification": { "passed": false, "container_type": "none detected", "reason": "No suitable transparent glass container found in the image. The container must be a clear glass cup — not plastic, ceramic, metal, or paper.", "suggested_action": "Use a clean transparent drinking glass, fill it at least 3/4 full with water, and photograph it against a white wall or plain background." } }

CHECK 2 — WATER PRESENCE:
Look at the glass carefully. Is it clearly filled with a liquid (water sample) to at least 50% capacity?
- ACCEPT: glass filled with water (any clarity — clear, cloudy, coloured), visible meniscus/water surface, liquid level at least halfway up the glass
- REJECT: empty glass (no liquid visible), dry glass with no water surface, glass with ice only (no liquid water), glass with non-water liquid clearly present
→ If the glass is empty, dry, or contains no visible water:
   Return ONLY: { "retake_required": true, "retake_reason": "no_water", "retake_message": "The glass appears empty or contains insufficient water. Fill the glass at least 3/4 full with the water sample you want to test and retake the photo.", "container_verification": { "passed": false, "container_type": "glass found", "reason": "Glass was detected but contains no visible water or is less than half full. A clear meniscus/water surface must be visible.", "suggested_action": "Fill the glass at least 3/4 full with the water sample, hold it against a white background, and photograph it in good lighting." } }

CHECK 3 — IMAGE QUALITY:
Is the water sample clearly visible and the image in focus?
- ACCEPT: well-lit, in-focus, water visible through the glass, glass sits against a plain background
- REJECT: too dark/underexposed, severely blurred/out of focus, water not discernible through the glass, extreme glare or reflections obscuring the water, glass too far away (<30% of frame)
→ If the image quality is insufficient:
   Return ONLY: { "retake_required": true, "retake_reason": "poor_quality", "retake_message": "Image quality is too poor for accurate analysis. Ensure good lighting, hold the camera steady, and place the glass against a white background.", "container_verification": { "passed": false, "container_type": "unclear", "reason": "Image too blurry, dark, or poorly framed for reliable analysis. The water must be clearly visible through the glass.", "suggested_action": "Retake in natural daylight or bright indoor light against a white background. Hold the camera steady and fill at least 50% of the frame with the glass." } }

═══════════════════════════════════════════
FULL WATER QUALITY ANALYSIS (only if all 3 checks pass)
═══════════════════════════════════════════

User observations:
${obsText}

Analyse the water sample against WHO Drinking Water Guidelines 2022. Be precise, scientific, and honest. Do NOT inflate scores. A glass of clear water with no abnormalities scores 85-95. Visibly cloudy or discoloured water should score proportionally lower.

Return EXACTLY this JSON (every field required, no nulls):

{
  "retake_required": false,
  "safety_level": "SAFE|CAUTION|UNSAFE|DANGEROUS",
  "risk_score": <integer 0-100 where 0=perfectly safe, 100=extremely dangerous>,
  "safety_verdict": "<concise 4-8 word verdict e.g. 'Safe for drinking with standard treatment'>",
  "six_dimensions": {
    "colour_score": <0-100>,
    "colour_detail": "<specific observation e.g. 'Water appears colourless and transparent — no discolouration detected'>",
    "clarity_score": <0-100>,
    "clarity_detail": "<specific observation on turbidity e.g. 'Water is clear with NTU estimated <1 — excellent clarity'>",
    "particles_score": <0-100>,
    "particles_detail": "<specific observation e.g. 'No visible suspended particles or sediment detected'>",
    "rust_score": <0-100>,
    "rust_detail": "<specific observation e.g. 'No metallic discolouration or rust indicators visible'>",
    "contamination_score": <0-100>,
    "contamination_detail": "<specific observation e.g. 'No visible biological or chemical contamination indicators'>",
    "who_compliance_score": <0-100>,
    "who_compliance_detail": "<specific WHO compliance note e.g. 'Visual parameters meet WHO 2022 aesthetic guidelines'>",
    "overall_six_dimension_score": <weighted average 0-100>
  },
  "visual_assessment": {
    "clarity": "clear|slightly_cloudy|cloudy|very_turbid",
    "color": "<precise colour description e.g. 'colourless', 'pale yellow', 'light brown'>",
    "particles": <true|false>,
    "particle_description": "<description if present, or 'None detected'>",
    "surface_condition": "clean|foam|oil_film|debris|normal",
    "estimated_turbidity_ntu": "<estimated range e.g. '<1 NTU', '1-4 NTU', '>10 NTU'>"
  },
  "leakage_assessment": {
    "leakage_detected": <true|false>,
    "leakage_severity": "none|minor|moderate|major|burst",
    "leakage_type": "<type or 'N/A — water sample image only'>",
    "pipe_condition": "good|rusty|corroded|cracked|unknown",
    "urgency": "low|medium|high|critical",
    "estimated_water_loss_liters_per_day": "N/A"
  },
  "contamination_analysis": {
    "bacterial_risk": "LOW|MEDIUM|HIGH|CRITICAL",
    "bacterial_indicators": ["<visual indicator or 'No visual indicators of bacterial contamination'>"],
    "chemical_signs": <true|false>,
    "chemical_indicators": ["<indicator or 'None visually detectable'>"],
    "physical_contamination": <true|false>,
    "physical_indicators": ["<indicator or 'None detected'>"],
    "environmental_factors": ["<relevant factor based on source type and observations>"],
    "health_implications": ["<specific health risk or 'No immediate health concerns identified from visual analysis'>"]
  },
  "safety_assessment": {
    "safety_level": "SAFE|CAUTION|UNSAFE|DANGEROUS",
    "risk_score": <0-100>,
    "primary_concerns": ["<specific concern or 'Water appears visually acceptable'>"],
    "safety_verdict": "<same as top-level safety_verdict>"
  },
  "recommendations": {
    "immediate_actions": ["<specific actionable recommendation>", "<second recommendation>"],
    "treatment_methods": ["<specific treatment e.g. 'Boil for 1 minute at sea level (3 minutes above 2000m)'>"],
    "boiling_required": <true|false>,
    "filtering_required": <true|false>,
    "alternative_source": <true|false>,
    "long_term_solutions": ["<long-term recommendation>"]
  },
  "community_guidance": {
    "warning_signs": ["<warning sign to watch for>"],
    "preventive_measures": ["<preventive measure>"],
    "contact_authorities": <true|false>,
    "community_message": "<plain-language 1-sentence summary suitable for sharing with non-technical users>"
  }
}

SCORING CALIBRATION (be precise — do NOT inflate scores):
- Crystal clear colourless water in clean glass: colour=90-98, clarity=90-98, overall=85-95
- Very slightly hazy/mineral haze: clarity=65-78, colour=80-90
- Slightly hazy water (visible but not severe): clarity=50-65
- Visibly cloudy/turbid (easily seen): clarity=15-40
- Yellow tint (moderate): colour=35-55
- Brown tint (significant): colour=15-35
- Green tint (algae possible): colour=10-30
- Red/pink tint (likely contamination): colour=5-20
- Visible particles (many): particles=10-30
- Visible rust/orange sediment: rust=5-25
- Oily film on surface: contamination=5-20, surface_condition='oil_film'

risk_score and safety_level:
- risk_score must be INVERSE of quality (high quality = LOW risk)
- SAFE: risk_score 0-25 (clean, clear water with no visible issues)
- CAUTION: risk_score 26-50 (slight haze or minor aesthetic issues — boil as precaution)
- UNSAFE: risk_score 51-75 (visible turbidity, discolouration, or particles — do not drink untreated)
- DANGEROUS: risk_score 76-100 (severe contamination, sewage, heavy turbidity — seek alternative source immediately)

AFRICAN CONTEXT NOTES:
- In Sub-Saharan Africa, common risks include: cholera, typhoid, pipe corrosion, pesticide runoff, and fluoride
- Rural/well water: higher biological risk, score bacterial_risk accordingly
- Municipal tap: check for chlorine residual and pipe rust indicators
- Rainwater: usually cleaner visually but assess container hygiene
- Spring/borehole: check for mineral discolouration (iron, manganese, fluoride)`;
  }

  async analyzeOpenAI(imageUris: string[], observations?: Record<string, string>): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      await this.init();
      if (!this.apiKey) {
        return { success: false, method: 'local_fallback', error: 'OpenAI API key not configured', result: null };
      }
    }

    const startTime = Date.now();

    try {
      const images = await Promise.all(
        imageUris.map(async (uri) => {
          const { base64, mimeType } = await this.imageToBase64(uri);
          return {
            type: 'image_url' as const,
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' as const },
          };
        })
      );

      const promptText = this.buildPrompt(observations);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert water quality analyst. Always respond with valid JSON only. No markdown, no explanation outside the JSON object.',
            },
            {
              role: 'user',
              content: [{ type: 'text', text: promptText }, ...images],
            },
          ],
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        return { success: false, method: 'local_fallback', error: `OpenAI API error: ${response.status} — ${errBody.slice(0, 200)}`, result: null };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      return {
        success: true,
        method: 'openai_direct',
        model: data.model || DEFAULT_MODEL,
        processingTimeMs: Date.now() - startTime,
        tokensUsed: data.usage?.total_tokens,
        result: parsed,
      };
    } catch (err: any) {
      return { success: false, method: 'local_fallback', error: err.message || 'AI analysis failed', result: null };
    }
  }

  async analyzeClaude(imageUris: string[], observations?: Record<string, string>, apiKey?: string): Promise<AIAnalysisResult> {
    const key = apiKey || this.apiKey;
    if (!key) {
      return { success: false, method: 'local_fallback', error: 'Claude API key not configured', result: null };
    }

    const startTime = Date.now();

    try {
      const images = await Promise.all(
        imageUris.map(async (uri) => {
          const { base64, mimeType } = await this.imageToBase64(uri);
          return {
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: mimeType, data: base64 },
          };
        })
      );

      const promptText = this.buildPrompt(observations);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: promptText }, ...images],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        return { success: false, method: 'local_fallback', error: `Claude API error: ${response.status}`, result: null };
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      const parsed = JSON.parse(content);

      return {
        success: true,
        method: 'claude_direct',
        model: data.model || 'claude-3-5-sonnet',
        processingTimeMs: Date.now() - startTime,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        result: parsed,
      };
    } catch (err: any) {
      return { success: false, method: 'local_fallback', error: err.message || 'Claude analysis failed', result: null };
    }
  }

  async analyze(imageUris: string[], observations?: Record<string, string>): Promise<AIAnalysisResult> {
    await this.init();

    if (this.apiKey) {
      const result = await this.analyzeOpenAI(imageUris, observations);
      if (result.success) return result;
    }

    const claudeKey = await SecureStorage.getItem(CLAUDE_KEY_STORAGE);
    if (claudeKey) {
      const result = await this.analyzeClaude(imageUris, observations, claudeKey);
      if (result.success) return result;
    }

    return { success: false, method: 'local_fallback', error: 'No AI provider available', result: null };
  }
}

export default new DirectAIService();
