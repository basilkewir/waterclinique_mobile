import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { AquaCard, AquaButton, AquaBadge } from '@/components/ui/AquaComponents';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing, lightTheme, BorderRadius } from '@/constants/theme-constants';
import WaterCliniqAnalysisService, {
  WaterCliniqAnalysisResult,
  WaterCliniqObservations,
} from '@/services/WaterCliniqAnalysisService';
import GoogleVisionService from '@/services/GoogleVisionService';
import { extractVisionData, VisionExtractedData } from '@/services/VisionWaterAnalyzer';

interface ImageAnalysisFormProps {
  onSubmit: (data: WaterCliniqAnalysisResult) => void;
}

const SAFETY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  SAFE:      { color: '#22c55e', icon: 'checkmark.seal.fill', label: 'SAFE' },
  CAUTION:   { color: '#eab308', icon: 'exclamationmark.triangle.fill', label: 'CAUTION' },
  UNSAFE:    { color: '#f97316', icon: 'xmark.octagon.fill', label: 'NOT SAFE' },
  DANGEROUS: { color: '#ef4444', icon: 'exclamationmark.octagon.fill', label: 'DANGEROUS' },
};

const CLARITY_GRADES: Record<string, { color: string; label: string }> = {
  excellent: { color: '#22c55e', label: 'Excellent (<1 NTU)' },
  good:      { color: '#84cc16', label: 'Good (1–4 NTU)' },
  acceptable:{ color: '#eab308', label: 'Acceptable (4–10 NTU)' },
  poor:      { color: '#f97316', label: 'Poor (>10 NTU)' },
  critical:  { color: '#ef4444', label: 'Critical (>50 NTU)' },
};

export const ImageAnalysisForm: React.FC<ImageAnalysisFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WaterCliniqAnalysisResult | null>(null);
  const [visionData, setVisionData] = useState<VisionExtractedData | null>(null);
  const [stage, setStage] = useState('');

  // ── Image capture ───────────────────────────────────────────────────────────

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to photograph water samples.');
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.9,
          });

      if (!result.canceled && result.assets[0]) {
        const optimized = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
        );
        setSelectedImage(optimized.uri);
        setResult(null);
        setVisionData(null);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  // ── Analysis pipeline ───────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please take or select a water sample photo first.');
      return;
    }
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Stage 1: Google Vision API
      setStage('Running Google Vision API analysis…');
      let extractedVision: VisionExtractedData | null = null;
      try {
        await GoogleVisionService.init();
        if (GoogleVisionService.isConfigured()) {
          const vr = await GoogleVisionService.analyze([selectedImage]);
          if (vr.success) {
            extractedVision = extractVisionData(
              vr.objects, vr.labels, vr.colors,
              vr.fullText, vr.detectedText,
            );
            setVisionData(extractedVision);

            if (!extractedVision.container.passed) {
              Alert.alert(
                'Retake Required',
                extractedVision.container.suggested_action || 'Please use a clear glass cup.',
              );
              setIsAnalyzing(false);
              setStage('');
              return;
            }
          }
        }
      } catch {
        // Vision unavailable — continue to backend
      }

      // Stage 2+: Full AI pipeline
      setStage('Sending to AI analysis engine…');
      const observations: WaterCliniqObservations = { context_mode: 'water' };
      const analysisResult = await WaterCliniqAnalysisService.analyze(
        [selectedImage],
        observations,
      );

      if (analysisResult.retake_required) {
        Alert.alert(
          'Retake Required',
          analysisResult.retake_message || 'Please retake the photo using a clear glass cup.',
        );
        setIsAnalyzing(false);
        setStage('');
        return;
      }

      setResult(analysisResult);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err?.message || 'Please try again.');
    } finally {
      setIsAnalyzing(false);
      setStage('');
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderImagePicker = () => (
    <AquaCard style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Water Sample Photo</ThemedText>
      <ThemedText style={styles.sectionHint}>
        Use a clear glass cup against any background. Google Vision will verify the container.
      </ThemedText>

      {selectedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.retakeOverlay} onPress={() => setSelectedImage(null)}>
            <IconSymbol name="xmark.circle.fill" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.captureButton} onPress={() => pickImage(true)}>
            <IconSymbol name="camera.fill" size={22} color="#fff" />
            <ThemedText style={styles.captureButtonText}>Take Photo</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={() => pickImage(false)}>
            <IconSymbol name="photo.fill" size={22} color={AquaColors.aquaDeep} />
            <ThemedText style={styles.galleryButtonText}>Gallery</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {selectedImage && (
        <AquaButton
          title={isAnalyzing ? 'Analysing…' : 'Analyse Water Sample'}
          onPress={runAnalysis}
          disabled={isAnalyzing}
          style={styles.analyzeButton}
        />
      )}
    </AquaCard>
  );

  const renderAnalysisStage = () => (
    <AquaCard style={styles.stagingCard}>
      <ActivityIndicator size="large" color={AquaColors.aquaDeep} />
      <ThemedText style={styles.stagingText}>{stage || 'Analysing…'}</ThemedText>
      <ThemedText style={styles.stagingHint}>
        Google Vision → AI Engine → WHO Standards
      </ThemedText>
    </AquaCard>
  );

  const renderVisionSummary = () => {
    if (!visionData) return null;
    const turb = visionData.turbidity;
    const turbConfig = CLARITY_GRADES[turb.clarity_grade] || CLARITY_GRADES.acceptable;

    return (
      <AquaCard style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Google Vision Analysis</ThemedText>

        {/* Turbidity row */}
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Estimated Turbidity</ThemedText>
          <View style={[styles.badge, { backgroundColor: turbConfig.color + '22', borderColor: turbConfig.color }]}>
            <ThemedText style={[styles.badgeText, { color: turbConfig.color }]}>
              {turb.ntu_estimate} NTU · {turbConfig.label}
            </ThemedText>
          </View>
        </View>

        {/* Water color row */}
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Water Colour</ThemedText>
          <ThemedText style={styles.metricValue}>
            {visionData.colors.water_corrected.dominant_name} (bg-corrected)
          </ThemedText>
        </View>

        {/* Color confidence */}
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Colour Confidence</ThemedText>
          <ThemedText style={styles.metricValue}>{visionData.color_confidence}%</ThemedText>
        </View>

        {/* Particles */}
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Particles</ThemedText>
          <View style={[styles.badge, {
            backgroundColor: visionData.particles.detected ? '#f9731622' : '#22c55e22',
            borderColor: visionData.particles.detected ? '#f97316' : '#22c55e',
          }]}>
            <ThemedText style={[styles.badgeText, { color: visionData.particles.detected ? '#f97316' : '#22c55e' }]}>
              {visionData.particles.severity.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* Detected readings from test strips */}
        {visionData.detected_readings.length > 0 && (
          <View style={styles.readingsSection}>
            <ThemedText style={styles.readingsSectionTitle}>Detected Readings</ThemedText>
            {visionData.detected_readings.map((r, i) => (
              <View key={i} style={styles.readingRow}>
                <ThemedText style={styles.readingParam}>{r.parameter}</ThemedText>
                <ThemedText style={styles.readingValue}>
                  {r.value} {r.unit}
                </ThemedText>
                <ThemedText style={styles.readingConf}>{r.confidence}%</ThemedText>
              </View>
            ))}
          </View>
        )}
      </AquaCard>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    const safety = result.safety_assessment;
    const sc = SAFETY_CONFIG[safety.safety_level] || SAFETY_CONFIG.CAUTION;
    const dims = result.six_dimensions;

    return (
      <View style={styles.resultContainer}>
        {/* Safety verdict */}
        <AquaCard style={[styles.safetyCard, { borderColor: sc.color }]}>
          <View style={styles.safetyHeader}>
            <IconSymbol name={sc.icon} size={36} color={sc.color} />
            <View style={styles.safetyTextBlock}>
              <ThemedText style={[styles.safetyLevel, { color: sc.color }]}>{sc.label}</ThemedText>
              <ThemedText style={styles.safetyVerdict}>
                {safety.safety_verdict || `Risk score: ${safety.risk_score}/100`}
              </ThemedText>
            </View>
          </View>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, { width: `${safety.risk_score}%` as any, backgroundColor: sc.color }]} />
          </View>
          <ThemedText style={styles.riskLabel}>Risk: {safety.risk_score}/100</ThemedText>
        </AquaCard>

        {/* 6-Dimension scores */}
        {dims && (
          <AquaCard style={styles.section}>
            <ThemedText style={styles.sectionTitle}>6-Dimension Assessment</ThemedText>
            {[
              { key: 'colour_score', label: 'Colour', detail: dims.colour_detail },
              { key: 'clarity_score', label: 'Clarity', detail: dims.clarity_detail },
              { key: 'particles_score', label: 'Particles', detail: dims.particles_detail },
              { key: 'rust_score', label: 'Rust', detail: dims.rust_detail },
              { key: 'contamination_score', label: 'Contamination', detail: dims.contamination_detail },
              { key: 'who_compliance_score', label: 'WHO Compliance', detail: dims.who_compliance_detail },
            ].map(({ key, label, detail }) => {
              const score = dims[key as keyof typeof dims] as number;
              const barColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
              return (
                <View key={key} style={styles.dimRow}>
                  <View style={styles.dimLabelRow}>
                    <ThemedText style={styles.dimLabel}>{label}</ThemedText>
                    <ThemedText style={[styles.dimScore, { color: barColor }]}>{score}/100</ThemedText>
                  </View>
                  <View style={styles.dimBar}>
                    <View style={[styles.dimFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
                  </View>
                  {detail ? <ThemedText style={styles.dimDetail}>{detail}</ThemedText> : null}
                </View>
              );
            })}
            <View style={styles.dimOverallRow}>
              <ThemedText style={styles.dimOverallLabel}>Overall Score</ThemedText>
              <ThemedText style={styles.dimOverallScore}>{dims.overall_six_dimension_score}/100</ThemedText>
            </View>
          </AquaCard>
        )}

        {/* Visual assessment */}
        <AquaCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Visual Assessment</ThemedText>
          {[
            { label: 'Clarity', value: result.visual_assessment.clarity },
            { label: 'Colour', value: result.visual_assessment.color },
            { label: 'Particles', value: result.visual_assessment.particles ? result.visual_assessment.particle_description || 'Detected' : 'None' },
            { label: 'Surface', value: result.visual_assessment.surface_condition },
          ].map(({ label, value }) => (
            <View key={label} style={styles.metricRow}>
              <ThemedText style={styles.metricLabel}>{label}</ThemedText>
              <ThemedText style={styles.metricValue}>{value || '—'}</ThemedText>
            </View>
          ))}
        </AquaCard>

        {/* Contamination */}
        <AquaCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contamination Analysis</ThemedText>
          {[
            { label: 'Bacterial Risk', value: result.contamination_analysis.bacterial_risk },
            { label: 'Chemical Signs', value: result.contamination_analysis.chemical_signs ? 'Yes' : 'No' },
            { label: 'Physical Contamination', value: result.contamination_analysis.physical_contamination ? 'Yes' : 'No' },
          ].map(({ label, value }) => {
            const isRisk = value === 'Yes' || value === 'HIGH' || value === 'CRITICAL';
            return (
              <View key={label} style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>{label}</ThemedText>
                <ThemedText style={[styles.metricValue, isRisk && { color: '#ef4444', fontWeight: '700' }]}>
                  {value}
                </ThemedText>
              </View>
            );
          })}
          {(result.contamination_analysis.bacterial_indicators ?? []).length > 0 && (
            <View style={styles.indicatorList}>
              {result.contamination_analysis.bacterial_indicators!.map((ind, i) => (
                <ThemedText key={i} style={styles.indicatorItem}>• {ind}</ThemedText>
              ))}
            </View>
          )}
        </AquaCard>

        {/* Recommendations */}
        <AquaCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
          {result.recommendations.immediate_actions.map((action, i) => (
            <View key={i} style={styles.actionItem}>
              <IconSymbol name="arrow.right.circle.fill" size={16} color={AquaColors.aquaDeep} />
              <ThemedText style={styles.actionText}>{action}</ThemedText>
            </View>
          ))}
          {result.recommendations.boiling_required && (
            <View style={[styles.alertBanner, { backgroundColor: '#fef3c7', borderColor: '#eab308' }]}>
              <IconSymbol name="flame.fill" size={16} color="#d97706" />
              <ThemedText style={[styles.alertText, { color: '#d97706' }]}>Boiling required before drinking</ThemedText>
            </View>
          )}
        </AquaCard>

        {/* AI metadata */}
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaText}>
            {result.ai_metadata.source} · {result.confidence_score}% confidence
          </ThemedText>
        </View>

        {/* Submit */}
        <AquaButton
          title="Save Analysis"
          onPress={() => onSubmit(result)}
          style={styles.submitButton}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {renderImagePicker()}
        {isAnalyzing && renderAnalysisStage()}
        {!isAnalyzing && renderVisionSummary()}
        {!isAnalyzing && renderResult()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightTheme.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  section: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: AquaColors.textSecondary, marginBottom: Spacing.sm },
  imageButtons: { flexDirection: 'row', gap: Spacing.sm },
  captureButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, backgroundColor: AquaColors.aquaDeep,
    borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  captureButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  galleryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, borderWidth: 2, borderColor: AquaColors.aquaDeep,
    borderRadius: BorderRadius.md, backgroundColor: AquaColors.surface, gap: Spacing.sm,
  },
  galleryButtonText: { fontSize: 15, fontWeight: '600', color: AquaColors.aquaDeep },
  imagePreviewContainer: { position: 'relative', borderRadius: BorderRadius.md, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 240, borderRadius: BorderRadius.md },
  retakeOverlay: { position: 'absolute', top: 8, right: 8 },
  analyzeButton: { marginTop: Spacing.sm },
  stagingCard: {
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
  },
  stagingText: { fontSize: 16, fontWeight: '600', color: AquaColors.text, textAlign: 'center' },
  stagingHint: { fontSize: 12, color: AquaColors.textSecondary, textAlign: 'center' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: AquaColors.borderLight },
  metricLabel: { fontSize: 13, color: AquaColors.textSecondary, flex: 1 },
  metricValue: { fontSize: 13, fontWeight: '600', color: AquaColors.text, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  readingsSection: { marginTop: Spacing.sm, gap: 4 },
  readingsSectionTitle: { fontSize: 13, fontWeight: '700', color: AquaColors.text, marginBottom: 4 },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  readingParam: { fontSize: 12, fontWeight: '600', color: AquaColors.text, width: 100 },
  readingValue: { fontSize: 12, color: AquaColors.aquaDeep, flex: 1 },
  readingConf: { fontSize: 11, color: AquaColors.textSecondary },
  resultContainer: { gap: Spacing.md },
  safetyCard: { padding: Spacing.md, borderLeftWidth: 4, gap: Spacing.sm },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  safetyTextBlock: { flex: 1 },
  safetyLevel: { fontSize: 20, fontWeight: '800' },
  safetyVerdict: { fontSize: 13, color: AquaColors.text, marginTop: 2 },
  riskBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: 4 },
  riskLabel: { fontSize: 11, color: AquaColors.textSecondary, textAlign: 'right' },
  dimRow: { gap: 2, marginBottom: Spacing.sm },
  dimLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dimLabel: { fontSize: 13, color: AquaColors.text },
  dimScore: { fontSize: 13, fontWeight: '700' },
  dimBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 3 },
  dimDetail: { fontSize: 11, color: AquaColors.textSecondary, marginTop: 1 },
  dimOverallRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: AquaColors.borderLight },
  dimOverallLabel: { fontSize: 14, fontWeight: '700', color: AquaColors.text },
  dimOverallScore: { fontSize: 14, fontWeight: '800', color: AquaColors.aquaDeep },
  indicatorList: { marginTop: 4 },
  indicatorItem: { fontSize: 12, color: AquaColors.textSecondary, paddingVertical: 1 },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 4 },
  actionText: { fontSize: 13, color: AquaColors.text, flex: 1 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, marginTop: Spacing.sm },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1 },
  metaRow: { alignItems: 'center' },
  metaText: { fontSize: 11, color: AquaColors.textSecondary },
  submitButton: { marginTop: Spacing.sm, marginBottom: Spacing.xl },
});
