import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import LeakageDetectionService, { LeakageAnalysisResult } from '@/services/LeakageDetectionService';
import ApiService from '@/services/ApiService';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SEVERITY_COLORS: Record<string, string> = {
  none: AquaColors.success,
  low: AquaColors.aquaDeep,
  medium: AquaColors.warning,
  high: '#E63946',
  critical: '#7C0000',
};

const SEVERITY_ICONS: Record<string, string> = {
  none: 'checkmark.circle.fill',
  low: 'info.circle.fill',
  medium: 'exclamationmark.triangle.fill',
  high: 'xmark.circle.fill',
  critical: 'exclamationmark.octagon.fill',
};

export default function LeakageDetectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pipeCondition, setPipeCondition] = useState('unknown');
  const [corrosionLevel, setCorrosionLevel] = useState('unknown');
  const [jointCondition, setJointCondition] = useState('unknown');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LeakageAnalysisResult | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to photograph pipes.');
      return;
    }

    Alert.alert('Add Pipe Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: async () => {
        const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!r.canceled) setImageUri(r.assets[0].uri);
      }},
      { text: 'From Gallery', onPress: async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (!r.canceled) setImageUri(r.assets[0].uri);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Try backend API first (with or without image)
      if (imageUri) {
        const compressed = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        const backendResult = await ApiService.analyzeLeakage(compressed.uri, {
          pipe_condition: pipeCondition !== 'unknown' ? pipeCondition : undefined,
          corrosion_level: corrosionLevel !== 'unknown' ? corrosionLevel : undefined,
          joint_condition: jointCondition !== 'unknown' ? jointCondition : undefined,
        });
        if (backendResult?.success && backendResult?.analysis) {
          // Map backend response to LeakageAnalysisResult shape for the result view
          const a = backendResult.analysis;
          setResult({
            severity: a.severity ?? 'medium',
            severityLabel: a.severity_label ?? a.severity ?? 'Unknown',
            urgencyLabel: a.urgency_label ?? a.urgency_level ?? 'Review recommended',
            estimatedWaterLossLitersPerDay: a.estimated_water_loss_liters ?? 0,
            estimatedWaterLossLitersPerMonth: (a.estimated_water_loss_liters ?? 0) * 30,
            pipeConditionScore: a.pipe_condition_score ?? 50,
            pipeConditionLabel: a.pipe_condition_label ?? pipeCondition,
            corrosionAnalysis: a.corrosion_analysis ?? { recommendation: 'Inspect regularly.', riskFactor: 'medium', affectsStructuralIntegrity: false },
            jointIntegrity: a.joint_integrity ?? { recommendation: 'Monitor joints.', needsRepair: false },
            recommendedActions: a.recommended_actions ?? ['Inspect visually', 'Contact utility if leak worsens'],
            shouldReportToUtility: a.should_report_to_utility ?? false,
          } as LeakageAnalysisResult);
          return;
        }
      }
      // Fallback: local analysis
      const localResult = LeakageDetectionService.analyze({ pipeCondition, corrosionLevel, jointCondition, imageUri: imageUri ?? undefined });
      setResult(localResult);
    } catch {
      // Fallback on network errors
      const localResult = LeakageDetectionService.analyze({ pipeCondition, corrosionLevel, jointCondition, imageUri: imageUri ?? undefined });
      setResult(localResult);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReportToUtility = () => {
    Alert.alert(
      'Report to Utility',
      'Send this leakage report to your local water utility?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report via WhatsApp',
          onPress: () => Linking.openURL(`whatsapp://send?text=Water%20Leakage%20Alert%3A%20${result?.severityLabel}%20at%20location`),
        },
        { text: 'Call Utility', onPress: () => Linking.openURL('tel:+237651327274') },
      ]
    );
  };

  const reset = () => {
    setImageUri(null);
    setPipeCondition('unknown');
    setCorrosionLevel('unknown');
    setJointCondition('unknown');
    setResult(null);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <View style={[styles.resultBadge, { backgroundColor: SEVERITY_COLORS[result.severity] + '20', borderColor: SEVERITY_COLORS[result.severity] }]}>
            <IconSymbol name={SEVERITY_ICONS[result.severity] as any} size={48} color={SEVERITY_COLORS[result.severity]} />
            <Text style={[styles.resultBadgeText, { color: SEVERITY_COLORS[result.severity] }]}>
              {result.severityLabel}
            </Text>
          </View>
          <Text style={styles.resultUrgency}>{result.urgencyLabel}</Text>
        </View>

        <View style={styles.content}>
          <AquaCard style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.estimatedWaterLossLitersPerDay.toFixed(0)}L</Text>
              <Text style={styles.statLbl}>Water Loss / Day</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: SEVERITY_COLORS[result.severity] }]}>{result.severity.toUpperCase()}</Text>
              <Text style={styles.statLbl}>Severity</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.pipeConditionScore}</Text>
              <Text style={styles.statLbl}>Pipe Score /100</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.estimatedWaterLossLitersPerMonth.toFixed(0)}L</Text>
              <Text style={styles.statLbl}>Monthly Loss</Text>
            </View>
          </AquaCard>

          <AquaCard style={styles.section}>
            <Text style={styles.sectionTitle}>Pipe Condition</Text>
            <Text style={styles.sectionText}>{result.pipeConditionLabel}</Text>
          </AquaCard>

          <AquaCard style={styles.section}>
            <Text style={styles.sectionTitle}>Corrosion Assessment</Text>
            <Text style={styles.sectionText}>{result.corrosionAnalysis.recommendation}</Text>
            <Text style={styles.detailText}>Risk Factor: {result.corrosionAnalysis.riskFactor.toUpperCase()}</Text>
            {result.corrosionAnalysis.affectsStructuralIntegrity && (
              <Text style={styles.warningText}>Warning: Affects structural integrity</Text>
            )}
          </AquaCard>

          <AquaCard style={styles.section}>
            <Text style={styles.sectionTitle}>Joint Integrity</Text>
            <Text style={styles.sectionText}>{result.jointIntegrity.recommendation}</Text>
            {result.jointIntegrity.needsRepair && (
              <Text style={styles.warningText}>Joint repair needed</Text>
            )}
          </AquaCard>

          <AquaCard style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {result.recommendedActions.map((action, i) => (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.actionBullet}>{i + 1}.</Text>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </AquaCard>

          {result.shouldReportToUtility && (
            <AquaButton
              title="Report to Utility"
              onPress={handleReportToUtility}
              variant="primary"
              style={styles.reportBtn}
            />
          )}

          <AquaButton
            title="New Leakage Check"
            onPress={reset}
            variant="outline"
            style={styles.resetBtn}
          />
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Leakage Detection</Text>
        <Text style={styles.subtitle}>
          Scan pipes, joints, and infrastructure to detect leaks, assess severity, and report to utilities.
        </Text>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <IconSymbol name="camera.fill" size={40} color={AquaColors.aquaMedium} />
              <Text style={styles.imagePlaceholderText}>Tap to photograph pipe</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Pipe Condition</Text>
        <View style={styles.chipRow}>
          {['good', 'fair', 'poor', 'corroded', 'cracked'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, pipeCondition === opt && styles.chipSelected]}
              onPress={() => setPipeCondition(opt)}
            >
              <Text style={[styles.chipText, pipeCondition === opt && styles.chipTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Corrosion Level</Text>
        <View style={styles.chipRow}>
          {['none', 'light', 'moderate', 'heavy'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, corrosionLevel === opt && styles.chipSelected]}
              onPress={() => setCorrosionLevel(opt)}
            >
              <Text style={[styles.chipText, corrosionLevel === opt && styles.chipTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Joint Condition</Text>
        <View style={styles.chipRow}>
          {['intact', 'weeping', 'dripping', 'spraying'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, jointCondition === opt && styles.chipSelected]}
              onPress={() => setJointCondition(opt)}
            >
              <Text style={[styles.chipText, jointCondition === opt && styles.chipTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AquaButton
          title={analyzing ? 'Analyzing...' : 'Analyze for Leaks'}
          onPress={runAnalysis}
          variant="primary"
          disabled={analyzing}
          style={styles.analyzeBtn}
        />

        {analyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AquaColors.aquaDeep} />
            <Text style={styles.loadingText}>Scanning pipe image and analyzing condition...</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.primary },
  content: { padding: Spacing.md },
  title: { fontSize: 24, fontWeight: 'bold', color: AquaColors.surface, marginBottom: Spacing.sm },
  subtitle: { fontSize: 14, color: AquaColors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  imagePicker: { marginBottom: Spacing.lg },
  previewImage: { width: '100%', height: 220, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AquaColors.border },
  imagePlaceholder: {
    width: '100%', height: 220, borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.aquaLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: AquaColors.aquaMedium, borderStyle: 'dashed',
  },
  imagePlaceholderText: { marginTop: Spacing.sm, fontSize: 14, color: AquaColors.aquaMedium },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: AquaColors.surface, marginTop: Spacing.md, marginBottom: Spacing.sm },
  sectionText: { fontSize: 14, color: AquaColors.textSecondary, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(0,119,182,0.15)', borderWidth: 1, borderColor: 'rgba(0,180,216,0.2)',
  },
  chipSelected: { backgroundColor: AquaColors.aquaDeep, borderColor: AquaColors.aquaDeep },
  chipText: { fontSize: 13, color: AquaColors.textSecondary },
  chipTextSelected: { color: AquaColors.surface, fontWeight: '600' },
  analyzeBtn: { marginTop: Spacing.lg },
  loadingContainer: { alignItems: 'center', marginTop: Spacing.lg },
  loadingText: { marginTop: Spacing.sm, fontSize: 14, color: AquaColors.textSecondary },
  resultHeader: { alignItems: 'center', paddingVertical: Spacing.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(0,180,216,0.2)' },
  resultBadge: { alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 2 },
  resultBadgeText: { fontSize: 16, fontWeight: 'bold', marginTop: Spacing.sm, textAlign: 'center' },
  resultUrgency: { fontSize: 14, color: AquaColors.textSecondary, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md },
  statItem: { width: '50%', paddingVertical: Spacing.sm, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: 'bold', color: AquaColors.aquaDeep },
  statLbl: { fontSize: 11, color: AquaColors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.md, padding: Spacing.md },
  detailText: { fontSize: 12, color: AquaColors.textSecondary, marginTop: Spacing.xs },
  warningText: { fontSize: 12, color: '#E63946', fontWeight: '600', marginTop: Spacing.xs },
  actionRow: { flexDirection: 'row', marginBottom: Spacing.sm, gap: Spacing.xs },
  actionBullet: { fontSize: 13, color: AquaColors.aquaMedium, fontWeight: '600', width: 20 },
  actionText: { fontSize: 13, color: AquaColors.textSecondary, flex: 1, lineHeight: 18 },
  reportBtn: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  resetBtn: { marginBottom: Spacing.xl },
});
