import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import ApiService from './ApiService';
import API_CONFIG from '@/config/api';

export interface ImageAnalysisResult {
  detectedColor: string;
  detectedClarity: string;
  detectedParticles: string;
  confidence: number;
  visualIssues: string[];
  suggestions: string[];
}

/**
 * Analyze water image to extract visual properties
 * This service attempts to analyze the image locally and optionally uses backend AI
 */
class ImageAnalysisService {
  /**
   * Analyze water image and extract visual properties
   */
  async analyzeWaterImage(imageUri: string): Promise<ImageAnalysisResult> {
    try {
      // First, try to get image dimensions and basic info
      const imageInfo = await this.getImageInfo(imageUri);
      
      // Try backend API analysis if available
      try {
        const backendAnalysis = await this.analyzeWithBackend(imageUri);
        if (backendAnalysis) {
          return backendAnalysis;
        }
      } catch (error) {
        console.log('Backend analysis not available, using local analysis:', error);
      }

      // Fallback to local analysis based on image properties
      return this.analyzeLocally(imageUri, imageInfo);
    } catch (error) {
      console.error('Image analysis error:', error);
      // Return default safe analysis
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Get basic image information
   */
  private async getImageInfo(imageUri: string): Promise<{ width: number; height: number; uri: string }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height, uri: imageUri });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Try to analyze image using backend API
   */
  private async analyzeWithBackend(imageUri: string): Promise<ImageAnalysisResult | null> {
    try {
      // Check if we have API endpoint available
      const formData = new FormData();
      
      // Convert image URI to blob/file format for upload
      const filename = imageUri.split('/').pop() || 'water_image.jpg';
      const fileType = filename.split('.').pop() || 'jpg';
      
      formData.append('water_image', {
        uri: imageUri,
        type: `image/${fileType}`,
        name: filename,
      } as any);

      // Use fetch directly for FormData
      const apiBaseUrl = API_CONFIG.baseURL;
      const token = await ApiService.getToken();
      
      const headers: any = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/water-image/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.analysis) {
          return this.parseBackendAnalysis(data.analysis);
        }
      }
    } catch (error) {
      // Backend not available or error - will use local analysis
      console.log('Backend analysis failed, using local fallback:', error);
    }
    return null;
  }

  /**
   * Parse backend analysis response
   */
  private parseBackendAnalysis(analysis: any): ImageAnalysisResult {
    const visual = analysis.visual_assessment || {};
    const safety = analysis.safety_assessment || {};

    return {
      detectedColor: this.mapColor(visual.color || 'clear'),
      detectedClarity: this.mapClarity(visual.clarity || 'clear'),
      detectedParticles: this.mapParticles(visual.particles || 'none'),
      confidence: safety.confidence || 70,
      visualIssues: visual.issues || [],
      suggestions: analysis.recommendations || [],
    };
  }

  /**
   * Local image analysis based on heuristics
   * This is a fallback when backend is not available
   */
  private async analyzeLocally(
    imageUri: string,
    imageInfo: { width: number; height: number; uri: string }
  ): Promise<ImageAnalysisResult> {
    // For local analysis, we can't do actual image processing without additional libraries
    // So we return a conservative analysis that prompts user for more information
    return {
      detectedColor: 'clear', // Default - user will provide actual color
      detectedClarity: 'clear', // Default - user will provide actual clarity
      detectedParticles: 'none', // Default - user will provide actual particles
      confidence: 30, // Low confidence for local-only analysis
      visualIssues: [
        'Image analysis requires additional information. Please answer the questions about smell, taste, and visual observations for a more accurate assessment.',
      ],
      suggestions: [
        'Provide detailed answers to all questions for better analysis',
        'Compare the water color against a white background',
        'Check for visible particles by holding the glass against light',
      ],
    };
  }

  /**
   * Map backend color to our color options
   */
  private mapColor(backendColor: string): string {
    const colorMap: Record<string, string> = {
      'clear': 'clear',
      'transparent': 'clear',
      'white': 'clear',
      'slightly cloudy': 'slightly_cloudy',
      'cloudy': 'cloudy',
      'turbid': 'cloudy',
      'muddy': 'muddy',
      'brown': 'brown',
      'yellow': 'yellow',
      'green': 'green',
      'blue-green': 'green',
      'red': 'red',
      'orange': 'yellow',
    };

    const normalized = backendColor.toLowerCase().trim();
    return colorMap[normalized] || 'clear';
  }

  /**
   * Map backend clarity to our clarity options
   */
  private mapClarity(backendClarity: string): string {
    const clarityMap: Record<string, string> = {
      'clear': 'clear',
      'transparent': 'clear',
      'slightly cloudy': 'slightly_cloudy',
      'cloudy': 'cloudy',
      'turbid': 'cloudy',
      'opaque': 'cloudy',
    };

    const normalized = backendClarity.toLowerCase().trim();
    return clarityMap[normalized] || 'clear';
  }

  /**
   * Map backend particles to our particle options
   */
  private mapParticles(backendParticles: string): string {
    const particleMap: Record<string, string> = {
      'none': 'none',
      'no particles': 'none',
      'few': 'few',
      'some': 'some',
      'many': 'many',
      'excessive': 'excessive',
      'visible sediment': 'many',
      'heavy sediment': 'excessive',
    };

    const normalized = backendParticles.toLowerCase().trim();
    return particleMap[normalized] || 'none';
  }

  /**
   * Default analysis when image analysis fails
   */
  private getDefaultAnalysis(): ImageAnalysisResult {
    return {
      detectedColor: 'clear',
      detectedClarity: 'clear',
      detectedParticles: 'none',
      confidence: 20,
      visualIssues: [
        'Unable to analyze image automatically. Please provide detailed answers to all questions.',
      ],
      suggestions: [
        'Answer all questions about smell, taste, and visual observations',
        'For best results, take photo in good lighting against a white background',
      ],
    };
  }

  /**
   * Enhance analysis with image-derived properties
   * This merges image analysis results with user observations
   */
  enhanceObservationWithImage(
    observation: any,
    imageAnalysis: ImageAnalysisResult
  ): any {
    // Use image-detected values if user hasn't provided them
    if (!observation.color && imageAnalysis.detectedColor !== 'clear') {
      observation.color = imageAnalysis.detectedColor;
    }
    if (!observation.clarity && imageAnalysis.detectedClarity !== 'clear') {
      observation.clarity = imageAnalysis.detectedClarity;
    }
    if (!observation.particles && imageAnalysis.detectedParticles !== 'none') {
      observation.particles = imageAnalysis.detectedParticles;
    }

    // Add image-derived issues
    if (imageAnalysis.visualIssues.length > 0) {
      observation.imageIssues = imageAnalysis.visualIssues;
    }

    return observation;
  }
}

export default new ImageAnalysisService();
