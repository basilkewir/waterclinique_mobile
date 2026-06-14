import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import SecureStorage from '@/services/SecureStorage';

const VISION_KEY_STORAGE = 'google_vision_api_key';
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface VisionObject {
  name: string;
  score: number;
  boundingBox?: { vertices: { x: number; y: number }[] };
}

export interface VisionLabel {
  description: string;
  score: number;
  topicality: number;
}

export interface VisionColor {
  color: { red: number; green: number; blue: number };
  score: number;
  pixelFraction: number;
}

export interface VisionTextBlock {
  text: string;
  confidence?: number;
  boundingBox?: { vertices: { x: number; y: number }[] };
}

export interface VisionSafeSearch {
  adult: string;
  medical: string;
  violence: string;
  racy: string;
}

export interface VisionApiResponse {
  success: boolean;
  objects: VisionObject[];
  labels: VisionLabel[];
  colors: VisionColor[];
  detectedText: VisionTextBlock[];
  fullText: string;
  safeSearch: VisionSafeSearch | null;
  fullResponse?: any;
  error?: string;
  processingTimeMs: number;
}

class GoogleVisionService {
  private apiKey: string | null = null;

  async init(apiKey?: string): Promise<void> {
    if (apiKey) {
      this.apiKey = apiKey;
      await SecureStorage.setItem(VISION_KEY_STORAGE, apiKey);
      return;
    }
    try {
      this.apiKey = await SecureStorage.getItem(VISION_KEY_STORAGE);
    } catch {
      this.apiKey = null;
    }
    if (!this.apiKey) {
      this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ?? null;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Pre-process image: resize to optimal resolution for Vision API.
   * Smaller = faster + cheaper; 1024px is the sweet spot for water detail.
   */
  private async prepareImage(uri: string): Promise<string> {
    try {
      const optimized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      return optimized.uri;
    } catch {
      return uri;
    }
  }

  async analyze(imageUris: string[]): Promise<VisionApiResponse> {
    if (!this.apiKey) {
      await this.init();
      if (!this.apiKey) {
        return {
          success: false,
          objects: [], labels: [], colors: [],
          detectedText: [], fullText: '', safeSearch: null,
          error: 'Google Vision API key not configured. Set it in Settings.',
          processingTimeMs: 0,
        };
      }
    }

    const startTime = Date.now();

    try {
      const preparedUri = await this.prepareImage(imageUris[0]);
      const image = await FileSystem.readAsStringAsync(preparedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
                { type: 'LABEL_DETECTION', maxResults: 30 },
                { type: 'IMAGE_PROPERTIES', maxResults: 1 },
                { type: 'TEXT_DETECTION', maxResults: 50 },
                { type: 'SAFE_SEARCH_DETECTION' },
              ],
              imageContext: {
                // Hint Vision API that this is a close-up water/beverage image
                webDetectionParams: { includeGeoResults: false },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        return {
          success: false,
          objects: [], labels: [], colors: [],
          detectedText: [], fullText: '', safeSearch: null,
          error: `Vision API error: ${response.status} — ${errBody.slice(0, 300)}`,
          processingTimeMs: Date.now() - startTime,
        };
      }

      const data = await response.json();
      const res = data.responses?.[0] || {};

      const objects: VisionObject[] = (res.localizedObjectAnnotations || []).map((o: any) => ({
        name: o.name,
        score: o.score,
        boundingBox: o.boundingPoly?.normalizedVertices
          ? { vertices: o.boundingPoly.normalizedVertices }
          : undefined,
      }));

      const labels: VisionLabel[] = (res.labelAnnotations || []).map((l: any) => ({
        description: l.description,
        score: l.score,
        topicality: l.topicality,
      }));

      const props = res.imagePropertiesAnnotation;
      const colors: VisionColor[] = props?.dominantColors?.colors || [];

      // TEXT_DETECTION: full text blocks (useful for test-kit strip values)
      const textAnnotations = res.textAnnotations || [];
      const fullText: string = textAnnotations[0]?.description?.trim() || '';
      const detectedText: VisionTextBlock[] = textAnnotations.slice(1).map((t: any) => ({
        text: t.description,
        confidence: t.confidence,
        boundingBox: t.boundingPoly?.vertices
          ? { vertices: t.boundingPoly.vertices }
          : undefined,
      }));

      // SAFE_SEARCH_DETECTION
      const ss = res.safeSearchAnnotation || null;
      const safeSearch: VisionSafeSearch | null = ss
        ? { adult: ss.adult, medical: ss.medical, violence: ss.violence, racy: ss.racy }
        : null;

      return {
        success: true,
        objects, labels, colors,
        detectedText, fullText, safeSearch,
        fullResponse: res,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        objects: [], labels: [], colors: [],
        detectedText: [], fullText: '', safeSearch: null,
        error: err.message || 'Vision API request failed',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }
}

export default new GoogleVisionService();
