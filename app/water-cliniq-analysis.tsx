/**
 * Water Cliniq AI Analysis — Multi-image capture & AI analysis
 *
 * Flow: Photo(s) → Observations → AI Analysis → Results (save + share)
 * Supports: water sample, pipe, and environment images
 */

import { AquaButton, AquaCard, AquaBadge } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Shadows, Spacing } from '@/constants/theme-constants';
import WaterCliniqAnalysisService, {
  WaterCliniqAnalysisResult, WaterCliniqObservations, SixDimensions,
} from '@/services/WaterCliniqAnalysisService';
import WaterQualityRing from '@/components/ui/WaterQualityRing';
import CustomCamera from '@/components/ui/CustomCamera';
import SourcePicker from '@/components/ui/SourcePicker';
import { WaterSource } from '@/services/WaterDataService';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'photo' | 'observe' | 'analyzing' | 'results';

function useOptionLabels(t: (k: string) => string) {
  return {
    COLOR_OPTIONS: [
      { key: 'clear', label: t('waterCliniqAnalysis.colours.clear'), chip: '#E3F2FD' },
      { key: 'slightly_cloudy', label: t('waterCliniqAnalysis.colours.slightly_cloudy'), chip: '#F5F5F5' },
      { key: 'cloudy', label: t('waterCliniqAnalysis.colours.cloudy'), chip: '#E0E0E0' },
      { key: 'yellow', label: t('waterCliniqAnalysis.colours.yellow'), chip: '#FFF9C4' },
      { key: 'brown', label: t('waterCliniqAnalysis.colours.brown'), chip: '#D7CCC8' },
      { key: 'green', label: t('waterCliniqAnalysis.colours.green'), chip: '#C8E6C9' },
      { key: 'red', label: t('waterCliniqAnalysis.colours.red'), chip: '#FFCDD2' },
      { key: 'black', label: t('waterCliniqAnalysis.colours.black'), chip: '#CFD8DC' },
    ],
    SMELL_OPTIONS: [
      { key: 'none', label: t('waterCliniqAnalysis.smells.none') }, { key: 'chlorine', label: t('waterCliniqAnalysis.smells.chlorine') },
      { key: 'earthy', label: t('waterCliniqAnalysis.smells.earthy') }, { key: 'sulphur', label: t('waterCliniqAnalysis.smells.sulphur') },
      { key: 'sewage', label: t('waterCliniqAnalysis.smells.sewage') }, { key: 'chemical', label: t('waterCliniqAnalysis.smells.chemical') },
      { key: 'fishy', label: t('waterCliniqAnalysis.smells.fishy') }, { key: 'rotten', label: t('waterCliniqAnalysis.smells.rotten') },
    ],
    PARTICLES_OPTIONS: [
      { key: 'none', label: t('waterCliniqAnalysis.particles.none') },
      { key: 'few', label: t('waterCliniqAnalysis.particles.few') },
      { key: 'some', label: t('waterCliniqAnalysis.particles.some') },
      { key: 'many', label: t('waterCliniqAnalysis.particles.many') },
      { key: 'sediment', label: t('waterCliniqAnalysis.particles.sediment') },
    ],
    TASTE_OPTIONS: [
      { key: 'normal',   label: t('waterQuality.normal') },
      { key: 'chlorine', label: t('waterQuality.chlorine') },
      { key: 'metallic', label: t('waterQuality.metallic') },
      { key: 'salty',    label: t('waterQuality.salty') },
      { key: 'bitter',   label: t('waterQuality.bitter') },
      { key: 'chemical', label: t('waterQuality.chemical') },
    ],
    FOAM_OPTIONS: [
      { key: 'none',      label: t('waterQuality.noFoam') },
      { key: 'slight',    label: t('waterQuality.slightFoam') },
      { key: 'moderate',  label: t('waterQuality.moderate') },
      { key: 'heavy',     label: t('waterQuality.heavyFoam') },
      { key: 'excessive', label: t('waterQuality.excessive') },
    ],
    CLARITY_OPTIONS: [
      { key: 'crystal_clear',  label: t('waterQuality.crystalClear') },
      { key: 'clear',          label: t('waterQuality.clear') },
      { key: 'slightly_hazy',  label: t('waterQuality.slightlyHazy') },
      { key: 'hazy',           label: t('waterQuality.hazy') },
      { key: 'cloudy',         label: t('waterQuality.cloudy') },
      { key: 'very_cloudy',    label: t('waterQuality.veryCloudy') },
    ],
    LEAKAGE_OPTIONS: [
      { key: 'none', label: t('waterCliniqAnalysis.leakage.none'), color: '#22c55e' },
      { key: 'minor', label: t('waterCliniqAnalysis.leakage.minor'), color: '#eab308' },
      { key: 'moderate', label: t('waterCliniqAnalysis.leakage.moderate'), color: '#f97316' },
      { key: 'major', label: t('waterCliniqAnalysis.leakage.major'), color: '#ef4444' },
      { key: 'seepage', label: t('waterCliniqAnalysis.leakage.seepage'), color: '#a855f7' },
    ],
    SOURCE_OPTIONS: [
      { key: 'tap', label: t('waterCliniqAnalysis.sources.tap') }, { key: 'borehole', label: t('waterCliniqAnalysis.sources.borehole') },
      { key: 'well', label: t('waterCliniqAnalysis.sources.well') }, { key: 'river', label: t('waterCliniqAnalysis.sources.river') },
      { key: 'spring', label: t('waterCliniqAnalysis.sources.spring') }, { key: 'rain', label: t('waterCliniqAnalysis.sources.rain') },
      { key: 'bottled', label: t('waterCliniqAnalysis.sources.bottled') }, { key: 'tank', label: t('waterCliniqAnalysis.sources.tank') },
    ],
    PIPE_OPTIONS: [
      { key: 'good', label: t('waterCliniqAnalysis.pipes.good') }, { key: 'rusty', label: t('waterCliniqAnalysis.pipes.rusty') },
      { key: 'corroded', label: t('waterCliniqAnalysis.pipes.corroded') }, { key: 'cracked', label: t('waterCliniqAnalysis.pipes.cracked') },
      { key: 'dirty', label: t('waterCliniqAnalysis.pipes.dirty') }, { key: 'calcified', label: t('waterCliniqAnalysis.pipes.calcified') },
    ],
  };
}

function pillValueColor(type: string, value: string): string | undefined {
  const v = value?.toLowerCase() || '';
  if (type === 'clarity') {
    if (v.includes('clear') || v.includes('transparent')) return '#22c55e';
    if (v.includes('cloudy') || v.includes('turbid')) return '#ef4444';
    if (v.includes('slightly')) return '#eab308';
  }
  if (type === 'bacteria' || type === 'bacterialRisk') {
    if (v === 'low') return '#22c55e';
    if (v === 'medium') return '#eab308';
    if (v === 'high' || v === 'critical') return '#ef4444';
  }
  if (type === 'chemical' || type === 'physical') {
    if (v === 'no') return '#22c55e';
    if (v === 'yes') return '#ef4444';
  }
  if (type === 'detected') {
    if (v === 'no') return '#22c55e';
    if (v === 'yes') return '#ef4444';
  }
  if (type === 'particles') {
    if (v === 'no' || v === 'none') return '#22c55e';
    if (v === 'yes') return '#ef4444';
  }
  if (type === 'colour') {
    if (v.includes('clear') || v.includes('colourless') || v.includes('colorless')) return '#22c55e';
    if (v.includes('yellow') || v.includes('brown') || v.includes('green') || v.includes('red')) return '#ef4444';
  }
  return undefined;
}

function InfoPill({ label, value, type }: { label: string; value: string; type?: string }) {
  const color = pillValueColor(type || label, value);
  return (
    <View style={[styles.pill, color ? { backgroundColor: color + '12', borderColor: color + '30', borderWidth: 1 } : {}]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, color ? { color } : {}]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

function DimGauge({ label, score, detail, color }: { label: string; score: number; detail: string; color: string }) {
  return (
    <View style={styles.dimRow}>
      <View style={styles.dimLeft}>
        <Text style={styles.dimLabel}>{label}</Text>
        <Text style={styles.dimDetail} numberOfLines={2}>{detail}</Text>
      </View>
      <View style={styles.dimRight}>
        <View style={styles.dimBarBg}>
          <View style={[styles.dimBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.dimScore, { color }]}>{score}</Text>
      </View>
    </View>
  );
}

// ── Main ──
export default function WaterClinicAnalysis() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { water_source_id } = useLocalSearchParams<{ water_source_id?: string }>();
  const { COLOR_OPTIONS, SMELL_OPTIONS, PARTICLES_OPTIONS, LEAKAGE_OPTIONS, SOURCE_OPTIONS, PIPE_OPTIONS, TASTE_OPTIONS, FOAM_OPTIONS, CLARITY_OPTIONS } = useOptionLabels(t);
  const [step, setStep] = useState<Step>('photo');
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [waterImage, setWaterImage] = useState<string | null>(null);
  const [pipeImage, setPipeImage] = useState<string | null>(null);
  const [envImage, setEnvImage] = useState<string | null>(null);
  const [obs, setObs] = useState<WaterCliniqObservations>({});
  const [result, setResult] = useState<WaterCliniqAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [cameraMode, setCameraMode] = useState<'water' | 'pipe' | 'environment' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const sectionAnims = useRef<Record<string, Animated.Value>>({}).current;

  const ANALYSIS_STEPS = [
    { key: 'image_quality', icon: 'photo.on.rectangle', label: t('waterCliniqAnalysis.analysisSteps.imageQuality') },
    { key: 'glass_detect', icon: 'cup.and.saucer.fill', label: t('waterCliniqAnalysis.analysisSteps.glassDetect') },
    { key: 'water_detect', icon: 'drop.fill', label: t('waterCliniqAnalysis.analysisSteps.waterDetect') },
    { key: 'six_dimensions', icon: 'target', label: t('waterCliniqAnalysis.analysisSteps.sixDimensions') },
    { key: 'who_standards', icon: 'list.clipboard.fill', label: t('waterCliniqAnalysis.analysisSteps.whoStandards') },
    { key: 'generating', icon: 'checkmark.circle.fill', label: t('waterCliniqAnalysis.analysisSteps.generating') },
  ];
  const [analysisStep, setAnalysisStep] = useState(0);
  const [stepRejected, setStepRejected] = useState(false);

  useEffect(() => {
    if (step !== 'analyzing') { setAnalysisStep(0); setStepRejected(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Steps 0 and 1 (image quality + glass detect) advance quickly; step 2 (water detect) pauses until result
    timers.push(setTimeout(() => setAnalysisStep(1), 1200));
    timers.push(setTimeout(() => setAnalysisStep(2), 2600));
    timers.push(setTimeout(() => setAnalysisStep(3), 4200));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const pickImage = async (setter: (u: string) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'livePhotos'] as any, allowsEditing: true, aspect: [4, 3], quality: 0.85,
    });
    if (!res.canceled) { setter(res.assets[0].uri); setResult(null); setError(null); }
  };

  const openCamera = (mode: 'water' | 'pipe' | 'environment') => {
    setCameraMode(mode);
  };

  const handleCameraCapture = (uri: string) => {
    if (cameraMode === 'water') setWaterImage(uri);
    else if (cameraMode === 'pipe') setPipeImage(uri);
    else if (cameraMode === 'environment') setEnvImage(uri);
    setResult(null);
    setError(null);
    setCameraMode(null);
  };

  const runAnalysis = async () => {
    setStep('analyzing'); setError(null); setStepRejected(false);
    try {
      const allImages = [waterImage, pipeImage, envImage].filter(Boolean) as string[];
      const r = await WaterCliniqAnalysisService.analyzeMultiImage(
        { waterImage: waterImage || undefined, pipeImage: pipeImage || undefined, environmentImage: envImage || undefined },
        { ...obs, water_source_id: selectedSource ? Number(selectedSource.id) : (water_source_id ? Number(water_source_id) : undefined) },
      );
      if (r.retake_required) {
        // Stop at the appropriate failed step
        const reason = r.container_verification?.reason || '';
        const retakeReason = (r as any).retake_reason || '';
        if (retakeReason === 'no_glass' || reason.includes('no_glass') || reason.includes('No transparent')) {
          setAnalysisStep(1); // stopped at glass detection
        } else if (retakeReason === 'no_water' || reason.includes('no_water') || reason.includes('empty')) {
          setAnalysisStep(2); // stopped at water detection
        } else {
          setAnalysisStep(1);
        }
        setStepRejected(true);
        const rejectionMsg = r.retake_message || t('waterCliniqAnalysis.verificationError');
        setError(rejectionMsg);
        // Stay on analyzing step to show the blocked step UI, then transition after delay
        setTimeout(() => { setStep('photo'); }, 3200);
        return;
      }
      // All steps passed — advance remaining steps
      setAnalysisStep(4);
      setTimeout(() => setAnalysisStep(5), 600);
      setTimeout(() => setAnalysisStep(6), 1200);
      setTimeout(() => {
        setResult(r);
        if (allImages.length > 0) {
          WaterCliniqAnalysisService.saveToHistory(r, {
            ...obs,
            water_source_id: selectedSource ? Number(selectedSource.id) : (water_source_id ? Number(water_source_id) : undefined),
          }, allImages).then(() => setSaved(true));
        }
        setStep('results');
      }, 1800);
    } catch (err: any) {
      setError(err.message || t('waterCliniqAnalysis.analysisError'));
      setStep('observe');
    }
  };

  const getSectionAnim = useCallback((key: string): Animated.Value => {
    if (!sectionAnims[key]) sectionAnims[key] = new Animated.Value(1);
    return sectionAnims[key];
  }, [sectionAnims]);

  const set = (k: keyof WaterCliniqObservations, v: string) => {
    setObs(p => ({ ...p, [k]: v }));
    if (!v) return;
    Animated.sequence([
      Animated.spring(getSectionAnim(k), { toValue: 0.96, useNativeDriver: true, friction: 8 }),
      Animated.spring(getSectionAnim(k), { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const sectionsComplete = useMemo(() => {
    let c = 0;
    if (obs.color) c++;
    if (obs.smell) c++;
    if (obs.particles) c++;
    return c;
  }, [obs.color, obs.smell, obs.particles]);
  const reset = () => { setStep('photo'); setWaterImage(null); setPipeImage(null); setEnvImage(null); setResult(null); setError(null); setSaved(false); setObs({}); setCameraMode(null); setShowManual(false); setShowAdvanced(false); };

  if (cameraMode) {
    return (
      <CustomCamera
        mode={cameraMode}
        onCapture={handleCameraCapture}
        onClose={() => setCameraMode(null)}
      />
    );
  }

  if (step === 'results' && result) {
    const { safety_assessment, visual_assessment, leakage_assessment, six_dimensions, contamination_analysis, recommendations, community_guidance } = result;
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.resultsBackBtn}>
            <IconSymbol name="chevron.left" size={18} color="#fff" />
            <Text style={styles.resultsBackText}>{t('waterCliniqAnalysis.home')}</Text>
          </TouchableOpacity>
          <Text style={styles.resultsHeaderTitle}>{t('waterCliniqAnalysis.resultsHeader')}</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={[styles.safetyBanner, { backgroundColor: result.safetyColor }]}>
            <View style={styles.bannerTopRow}>
              <WaterQualityRing
                score={100 - (safety_assessment.risk_score || 0)}
                size={90}
                color="#fff"
              />
              <View style={styles.bannerTextCol}>
                <View style={[styles.safetyLevelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <IconSymbol name="drop.fill" size={16} color="#fff" />
                  <Text style={styles.safetyLevel}>{safety_assessment.safety_level}</Text>
                </View>
                <Text style={styles.riskScore}>{t('readings.riskLevel')}: {safety_assessment.risk_score}/100</Text>
                {safety_assessment.safety_verdict && <Text style={styles.safetyVerdict} numberOfLines={2}>{safety_assessment.safety_verdict}</Text>}
              </View>
            </View>
            <View style={styles.metaRow}>
              <IconSymbol name={result.ai_metadata.method === 'local_engine' ? 'bolt.fill' : 'person.fill'} size={10} color="rgba(255,255,255,0.6)" />
              <Text style={styles.methodBadge}> {result.ai_metadata.method === 'local_engine' ? t('waterCliniqAnalysis.methodLocal') : t('waterCliniqAnalysis.methodAi')} · {result.ai_metadata.source}</Text>
              <Text style={styles.confBadge}>{t('waterCliniqAnalysis.confidencePercent', { value: result.confidence_score })}</Text>
              {result.ai_metadata.processingTimeMs != null && (
                <Text style={styles.confBadge}>{t('waterCliniqAnalysis.processingMs', { value: result.ai_metadata.processingTimeMs })}</Text>
              )}
            </View>
          </View>

          {result.observation_discrepancy?.has_discrepancy && result.observation_discrepancy.details?.length ? (
            <View style={styles.discrepancyBanner}>
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#f59e0b" />
              <Text style={styles.discrepancyText}>
                {result.observation_discrepancy.details[0]}
              </Text>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
            {[waterImage, pipeImage, envImage].filter(Boolean).map((uri, i) => (
              <Image key={i} source={{ uri: uri! }} style={styles.stripImg} />
            ))}
          </ScrollView>

          {six_dimensions && (
            <AquaCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <IconSymbol name="target" size={18} color={AquaColors.gold} />
                <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.sectionSixDimensions')}</Text>
              </View>
              <Text style={styles.overallScore}>{t('waterCliniqAnalysis.overallScore', { score: six_dimensions.overall_six_dimension_score })}</Text>
              <DimGauge label={t('waterCliniqAnalysis.dimensionColour')} score={six_dimensions.colour_score} detail={six_dimensions.colour_detail} color="#00B4D8" />
              <DimGauge label={t('waterCliniqAnalysis.dimensionClarity')} score={six_dimensions.clarity_score} detail={six_dimensions.clarity_detail} color="#02C39A" />
              <DimGauge label={t('waterCliniqAnalysis.dimensionParticles')} score={six_dimensions.particles_score} detail={six_dimensions.particles_detail} color="#F4A261" />
              <DimGauge label={t('waterCliniqAnalysis.dimensionRust')} score={six_dimensions.rust_score} detail={six_dimensions.rust_detail} color="#E63946" />
              <DimGauge label={t('waterCliniqAnalysis.dimensionContamination')} score={six_dimensions.contamination_score} detail={six_dimensions.contamination_detail} color="#7C3AED" />
              <DimGauge label={t('waterCliniqAnalysis.dimensionWhoCompliance')} score={six_dimensions.who_compliance_score} detail={six_dimensions.who_compliance_detail} color="#0077B6" />
            </AquaCard>
          )}

          <AquaCard style={styles.card}>
            <View style={styles.cardTitleRow}>
              <IconSymbol name="eye.fill" size={18} color={AquaColors.sky} />
              <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.sectionVisual')}</Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoPill type="clarity" label={t('waterCliniqAnalysis.pillClarity')} value={visual_assessment.clarity} />
              <InfoPill type="colour" label={t('waterCliniqAnalysis.pillColour')} value={visual_assessment.color} />
              <InfoPill type="particles" label={t('waterCliniqAnalysis.pillParticles')} value={visual_assessment.particles ? t('waterCliniqAnalysis.valueYes') : t('waterCliniqAnalysis.valueNo')} />
              <InfoPill label={t('waterCliniqAnalysis.pillSurface')} value={visual_assessment.surface_condition} />
            </View>
          </AquaCard>

          <AquaCard style={styles.card}>
            <View style={styles.cardTitleRow}>
              <IconSymbol name="wrench.fill" size={18} color={AquaColors.gold} />
              <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.sectionLeakage')}</Text>
            </View>
            {leakage_assessment.leakage_detected && (
              <View style={[styles.leakBadge, { backgroundColor: result.urgencyColor + '20', borderColor: result.urgencyColor }]}>
                <Text style={[styles.leakUrgency, { color: result.urgencyColor }]}>{t('waterCliniqAnalysis.pillUrgency', { value: leakage_assessment.urgency.toUpperCase() })}</Text>
                {leakage_assessment.estimated_water_loss_liters_per_day && (
                  <Text style={{ fontSize: 11, color: result.urgencyColor }}>{t('waterCliniqAnalysis.pillLoss', { value: leakage_assessment.estimated_water_loss_liters_per_day })}</Text>
                )}
              </View>
            )}
            <View style={styles.infoGrid}>
              <InfoPill type="detected" label={t('waterCliniqAnalysis.pillDetected')} value={leakage_assessment.leakage_detected ? t('waterCliniqAnalysis.valueYes') : t('waterCliniqAnalysis.valueNo')} />
              <InfoPill label={t('waterCliniqAnalysis.pillSeverity')} value={leakage_assessment.leakage_severity} />
              <InfoPill label={t('waterCliniqAnalysis.pillPipe')} value={leakage_assessment.pipe_condition} />
              <InfoPill label={t('waterCliniqAnalysis.pillMaterial')} value={leakage_assessment.pipe_material || t('waterCliniqAnalysis.valueUnknown')} />
            </View>
          </AquaCard>

          <AquaCard style={styles.card}>
            <View style={styles.cardTitleRow}>
              <IconSymbol name="bubbles.and.sparkles.fill" size={18} color="#7C3AED" />
              <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.sectionContamination')}</Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoPill type="bacterialRisk" label={t('waterCliniqAnalysis.pillBacteria')} value={contamination_analysis.bacterial_risk} />
              <InfoPill type="chemical" label={t('waterCliniqAnalysis.pillChemical')} value={contamination_analysis.chemical_signs ? t('waterCliniqAnalysis.valueYes') : t('waterCliniqAnalysis.valueNo')} />
              <InfoPill type="physical" label={t('waterCliniqAnalysis.pillPhysical')} value={contamination_analysis.physical_contamination ? t('waterCliniqAnalysis.valueYes') : t('waterCliniqAnalysis.valueNo')} />
            </View>
            {contamination_analysis.health_implications?.length ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                <IconSymbol name="exclamationmark.triangle.fill" size={12} color="#E63946" />
                <Text style={{ fontSize: 11, color: '#E63946', marginLeft: 4, flex: 1 }}>
                  {contamination_analysis.health_implications[0]}
                </Text>
              </View>
            ) : null}
          </AquaCard>

          <AquaCard style={styles.card}>
            <View style={styles.cardTitleRow}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
              <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.sectionRecommendations')}</Text>
            </View>
            {recommendations.immediate_actions.map((a, i) => (
              <Text key={i} style={styles.actionItem}>• {a}</Text>
            ))}
            {recommendations.treatment_methods.length > 0 && (
              <>
                <Text style={styles.subTitle}>{t('waterCliniqAnalysis.treatment')}</Text>
                {recommendations.treatment_methods.map((m, i) => (
                  <View key={i} style={styles.actionItemRow}>
                    <IconSymbol name="drop.fill" size={12} color={AquaColors.sky} />
                    <Text style={styles.actionItem}> {m}</Text>
                  </View>
                ))}
              </>
            )}
            {recommendations.long_term_solutions?.length ? (
              <>
                <Text style={styles.subTitle}>{t('waterCliniqAnalysis.longTerm')}</Text>
                {recommendations.long_term_solutions.map((s, i) => (
                  <View key={i} style={styles.actionItemRow}>
                    <IconSymbol name="calendar" size={12} color={AquaColors.gold} />
                    <Text style={styles.actionItem}> {s}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </AquaCard>

          <AquaCard style={[styles.card, { borderColor: '#0077B6', borderWidth: 1.5, backgroundColor: '#EFF6FF' }]}>
            <View style={styles.cardTitleRow}>
              <IconSymbol name="cross.case.fill" size={18} color="#0077B6" />
              <Text style={[styles.cardTitle, { color: '#0077B6' }]}> {t('waterCliniqAnalysis.certifiedCardTitle')}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#1e3a5f', lineHeight: 18, marginBottom: 10 }}>
              {t('waterCliniqAnalysis.certifiedCardBody')}
            </Text>
            <AquaButton title={t('waterCliniqAnalysis.certifiedCardButton')} icon="cross.case.fill" onPress={() => router.push('/contact-clinic')} variant="primary" />
          </AquaCard>

          <View style={styles.btnRow}>
            <AquaButton title={saved ? t('waterCliniqAnalysis.saved') : t('waterCliniqAnalysis.newAnalysis')} icon={saved ? 'checkmark' : 'arrow.clockwise'} onPress={reset} variant="primary" style={{ flex: 1 }} />
            <AquaButton title={t('waterCliniqAnalysis.home')} icon="house.fill" onPress={() => router.push('/(tabs)')} variant="outline" style={{ flex: 1 }} />
          </View>
          <View style={{ height: 40 + insets.bottom }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>{t('waterCliniqAnalysis.back')}</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('waterCliniqAnalysis.title')}</Text>
          <Text style={styles.headerSub}>{t('waterCliniqAnalysis.subtitle')}</Text>
        </View>

        <View style={styles.steps}>
          {(['photo', 'observe', 'results'] as const).map((s, i) => {
            const stepLabels: Record<string, string> = { photo: t('waterCliniqAnalysis.stepPhoto'), observe: t('waterCliniqAnalysis.stepObserve'), results: t('waterCliniqAnalysis.stepResults') };
            return (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, (step === ['photo', 'observe', 'results'][i] || (step === 'analyzing' && i === 1) || (step === 'results' && i < 2)) && styles.stepDotActive]}>
                  <Text style={styles.stepDotNum}>{i + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{stepLabels[s]}</Text>
              </View>
            );
          })}
        </View>

        {step === 'photo' && (
          <View style={styles.content}>
            {/* Required source picker */}
            <SourcePicker
              initialSourceId={water_source_id}
              onSelect={setSelectedSource}
            />

            {!selectedSource && (
              <View style={styles.sourceWarning}>
                <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#d97706" />
                <Text style={styles.sourceWarningText}>{t('waterCliniqAnalysis.sourceRequired')}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.errorTitle}>{t('waterCliniqAnalysis.imageRejected')}</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            )}
            <AquaCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <IconSymbol name="camera.fill" size={18} color={AquaColors.sky} />
                <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.photoSection.waterSample')}</Text>
                <View style={styles.optionalBadge}><Text style={styles.optionalText}>Optional</Text></View>
              </View>
              <Text style={styles.cardSub}>{t('waterCliniqAnalysis.photoSection.waterSampleDesc')}</Text>
              {waterImage ? <Image source={{ uri: waterImage }} style={styles.preview} /> : (
                <View style={styles.placeholder}>
                  <IconSymbol name="drop.fill" size={40} color="rgba(0,180,216,0.3)" />
                  <Text style={styles.placeholderText}>{t('waterCliniqAnalysis.photoSection.noWaterPhoto')}</Text>
                </View>
              )}
              <View style={styles.row}>
                <AquaButton title={t('waterCliniqAnalysis.photoSection.camera')} icon="camera.fill" onPress={() => openCamera('water')} variant="primary" style={{ flex: 1 }} />
                <AquaButton title={t('waterCliniqAnalysis.photoSection.gallery')} icon="photo.on.rectangle" onPress={() => pickImage(setWaterImage)} variant="secondary" style={{ flex: 1 }} />
              </View>
            </AquaCard>

            <AquaCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <IconSymbol name="wrench.fill" size={18} color={AquaColors.gold} />
                <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.photoSection.pipeSection')}</Text>
                <View style={styles.optionalBadge}><Text style={styles.optionalText}>Optional</Text></View>
              </View>
              <Text style={styles.cardSub}>{t('waterCliniqAnalysis.photoSection.pipeSectionDesc')}</Text>
              {pipeImage ? <Image source={{ uri: pipeImage }} style={styles.previewSmall} /> : (
                <View style={styles.placeholderSmall}>
                  <IconSymbol name="wrench.fill" size={28} color="rgba(244,162,97,0.3)" />
                </View>
              )}
              <View style={styles.row}>
                <AquaButton title={t('waterCliniqAnalysis.photoSection.camera')} icon="camera.fill" onPress={() => openCamera('pipe')} variant="primary" style={{ flex: 1 }} />
                <AquaButton title={t('waterCliniqAnalysis.photoSection.gallery')} icon="photo.on.rectangle" onPress={() => pickImage(setPipeImage)} variant="secondary" style={{ flex: 1 }} />
              </View>
              {pipeImage && <AquaButton title={t('waterCliniqAnalysis.photoSection.remove')} onPress={() => setPipeImage(null)} variant="outline" style={{ marginTop: 8 }} />}
            </AquaCard>

            <AquaCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <IconSymbol name="globe" size={18} color={AquaColors.sky} />
                <Text style={styles.cardTitle}> {t('waterCliniqAnalysis.photoSection.environmentSection')}</Text>
                <View style={styles.optionalBadge}><Text style={styles.optionalText}>Optional</Text></View>
              </View>
              <Text style={styles.cardSub}>{t('waterCliniqAnalysis.photoSection.environmentSectionDesc')}</Text>
              {envImage ? <Image source={{ uri: envImage }} style={styles.previewSmall} /> : (
                <View style={styles.placeholderSmall}>
                  <IconSymbol name="globe" size={28} color="rgba(0,180,216,0.3)" />
                </View>
              )}
              <View style={styles.row}>
                <AquaButton title={t('waterCliniqAnalysis.photoSection.camera')} icon="camera.fill" onPress={() => openCamera('environment')} variant="primary" style={{ flex: 1 }} />
                <AquaButton title={t('waterCliniqAnalysis.photoSection.gallery')} icon="photo.on.rectangle" onPress={() => pickImage(setEnvImage)} variant="secondary" style={{ flex: 1 }} />
              </View>
              {envImage && <AquaButton title={t('waterCliniqAnalysis.photoSection.remove')} onPress={() => setEnvImage(null)} variant="outline" style={{ marginTop: 8 }} />}
            </AquaCard>

            <AquaButton
              title={selectedSource ? t('waterCliniqAnalysis.continueToObserve') : t('waterCliniqAnalysis.selectSourceFirst')}
              onPress={() => setStep('observe')}
              variant={selectedSource ? 'primary' : 'outline'}
              disabled={!selectedSource}
            />
          </View>
        )}

        {step === 'observe' && (
          <View style={styles.content}>
            {error && (
              <View style={styles.errorBox}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.errorTitle}>{t('waterCliniqAnalysis.imageRejected')}</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            )}

            {/* ── Progress header ── */}
            <View style={styles.observeProgressBar}>
              {['color', 'smell', 'particles'].map((key, i) => {
                const done = !!obs[key as keyof WaterCliniqObservations];
                return (
                  <View key={key} style={styles.observeProgressStep}>
                    <View style={[styles.observeProgressDot, done && styles.observeProgressDotDone, sectionsComplete >= i + 1 && !done && styles.observeProgressDotNext]}>
                      {done ? (
                        <IconSymbol name="checkmark" size={10} color="#fff" />
                      ) : (
                        <Text style={[styles.observeProgressNum, done && { color: '#fff' }]}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={[styles.observeProgressLine, i < 2 && styles.observeProgressLineVisible]} />
                  </View>
                );
              })}
            </View>
            <Text style={styles.observeProgressText}>
              {t('waterCliniqAnalysis.observationsRecorded', { count: sectionsComplete })}
            </Text>

            {/* ── Water Colour ── */}
            <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('color') }] }]}>
              <View style={styles.obsCardHeader}>
                <View style={styles.obsCardIconWrap}>
                  <IconSymbol name="paintpalette.fill" size={16} color={AquaColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.waterColour')}</Text>
                  <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.waterColourDesc')}</Text>
                </View>
                {obs.color && (
                  <View style={styles.obsCardCheck}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
                  </View>
                )}
              </View>
              <View style={styles.obsOptionGrid}>
                {COLOR_OPTIONS.map(o => {
                  const sel = obs.color === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      onPress={() => set('color', o.key)}
                      style={[styles.obsColorChip, sel && { borderColor: AquaColors.primary, backgroundColor: o.chip }]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.obsColorSwatch, { backgroundColor: o.chip }]} />
                      <Text style={[styles.obsChipLabel, sel && { color: AquaColors.primary, fontWeight: '700' }]}>{o.label}</Text>
                      {sel && <IconSymbol name="checkmark" size={12} color={AquaColors.primary} style={{ position: 'absolute', top: 4, right: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Smell ── */}
            <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('smell') }] }]}>
              <View style={styles.obsCardHeader}>
                <View style={styles.obsCardIconWrap}>
                  <IconSymbol name="nose.fill" size={16} color={AquaColors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.smell')}</Text>
                  <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.smellDesc')}</Text>
                </View>
                {obs.smell && (
                  <View style={styles.obsCardCheck}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
                  </View>
                )}
              </View>
              <View style={styles.obsChipRow}>
                {SMELL_OPTIONS.map(o => {
                  const sel = obs.smell === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      onPress={() => set('smell', o.key)}
                      style={[styles.obsChip, sel && styles.obsChipSelected]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Particles ── */}
            <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('particles') }] }]}>
              <View style={styles.obsCardHeader}>
                <View style={styles.obsCardIconWrap}>
                  <IconSymbol name="water.waves" size={16} color={AquaColors.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.particles')}</Text>
                  <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.particlesDesc')}</Text>
                </View>
                {obs.particles && (
                  <View style={styles.obsCardCheck}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
                  </View>
                )}
              </View>
              <View style={styles.obsChipRow}>
                {PARTICLES_OPTIONS.map(o => {
                  const sel = obs.particles === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      onPress={() => set('particles', o.key)}
                      style={[styles.obsChip, sel && styles.obsChipSelected]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Manual Questionnaire (Taste / Clarity / Foam / Notes) ── */}
            <TouchableOpacity
              onPress={() => setShowManual(p => !p)}
              style={[styles.obsAdvancedToggle, { marginTop: 4 }]}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconSymbol name="list.bullet.clipboard.fill" size={14} color={AquaColors.primary} />
                <Text style={[styles.obsAdvancedToggleText, { color: AquaColors.primary }]}>
                  {t('waterCliniqAnalysis.observeSection.manualToggle', 'Manual Questionnaire')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {(obs.taste || obs.clarity || obs.foam || obs.notes) && (
                  <View style={styles.manualBadge}>
                    <IconSymbol name="checkmark" size={10} color="#fff" />
                  </View>
                )}
                <IconSymbol
                  name={showManual ? 'arrowtriangle.up.fill' : 'arrowtriangle.down.fill'}
                  size={14} color={AquaColors.primary}
                />
              </View>
            </TouchableOpacity>

            {showManual && (
              <>
                {/* Taste */}
                <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('taste') }] }]}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#fce7f3' }]}>
                      <IconSymbol name="mouth.fill" size={16} color="#db2777" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('readings.taste')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.tasteDesc', 'Only taste if already safe to do so.')}</Text>
                    </View>
                    {obs.taste && <View style={styles.obsCardCheck}><IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} /></View>}
                  </View>
                  <View style={styles.obsChipRow}>
                    {TASTE_OPTIONS.map(o => {
                      const sel = obs.taste === o.key;
                      return (
                        <TouchableOpacity key={o.key} onPress={() => set('taste', o.key)}
                          style={[styles.obsChip, sel && styles.obsChipSelected]} activeOpacity={0.7}>
                          <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Clarity */}
                <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('clarity') }] }]}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#e0f2fe' }]}>
                      <IconSymbol name="eye.fill" size={16} color={AquaColors.sky} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('readings.waterClarity')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.clarityDesc', 'How clear is the water when held up to light?')}</Text>
                    </View>
                    {obs.clarity && <View style={styles.obsCardCheck}><IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} /></View>}
                  </View>
                  <View style={styles.obsChipRow}>
                    {CLARITY_OPTIONS.map(o => {
                      const sel = obs.clarity === o.key;
                      return (
                        <TouchableOpacity key={o.key} onPress={() => set('clarity', o.key)}
                          style={[styles.obsChip, sel && styles.obsChipSelected]} activeOpacity={0.7}>
                          <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Foam */}
                <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('foam') }] }]}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#f0fdf4' }]}>
                      <IconSymbol name="bubble.left.fill" size={16} color={AquaColors.mint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('readings.foam')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.foamDesc', 'Any bubbles or foam on the water surface?')}</Text>
                    </View>
                    {obs.foam && <View style={styles.obsCardCheck}><IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} /></View>}
                  </View>
                  <View style={styles.obsChipRow}>
                    {FOAM_OPTIONS.map(o => {
                      const sel = obs.foam === o.key;
                      return (
                        <TouchableOpacity key={o.key} onPress={() => set('foam', o.key)}
                          style={[styles.obsChip, sel && styles.obsChipSelected]} activeOpacity={0.7}>
                          <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Notes */}
                <View style={styles.obsCard}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#fef9c3' }]}>
                      <IconSymbol name="pencil" size={16} color="#ca8a04" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.notes', 'Additional Notes')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.notesDesc', 'Anything else you notice about this water?')}</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.notesInput}
                    value={obs.notes ?? ''}
                    onChangeText={v => setObs(p => ({ ...p, notes: v }))}
                    placeholder={t('waterCliniqAnalysis.observeSection.notesPlaceholder', 'e.g. water is warm, source near farmland...')}
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ── Advanced: Leakage & Pipe ── */}
            <TouchableOpacity
              onPress={() => setShowAdvanced(p => !p)}
              style={styles.obsAdvancedToggle}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconSymbol name="wrench.fill" size={14} color={AquaColors.gray} />
                <Text style={styles.obsAdvancedToggleText}>{t('waterCliniqAnalysis.observeSection.advancedToggle')}</Text>
              </View>
              <IconSymbol
                name={showAdvanced ? 'arrowtriangle.up.fill' : 'arrowtriangle.down.fill'}
                size={14}
                color={AquaColors.gray}
              />
            </TouchableOpacity>

            {showAdvanced && (
              <>
                <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('leakage') }] }]}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#fef3c7' }]}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#d97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.leakage')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.leakageDesc')}</Text>
                    </View>
                    {obs.leakage && (
                      <View style={styles.obsCardCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
                      </View>
                    )}
                  </View>
                  <View style={styles.obsChipRow}>
                    {LEAKAGE_OPTIONS.map(o => {
                      const sel = obs.leakage === o.key;
                      return (
                        <TouchableOpacity
                          key={o.key}
                          onPress={() => set('leakage', o.key)}
                          style={[styles.obsChip, sel && { borderColor: o.color, backgroundColor: o.color + '18' }]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.obsChipLabel, sel && { color: o.color, fontWeight: '700' }]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>

                <Animated.View style={[styles.obsCard, { transform: [{ scale: getSectionAnim('pipe_condition') }] }]}>
                  <View style={styles.obsCardHeader}>
                    <View style={[styles.obsCardIconWrap, { backgroundColor: '#e0f2fe' }]}>
                      <IconSymbol name="wrench.fill" size={14} color={AquaColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsCardTitle}>{t('waterCliniqAnalysis.observeSection.pipeCondition')}</Text>
                      <Text style={styles.obsCardDesc}>{t('waterCliniqAnalysis.observeSection.pipeConditionDesc')}</Text>
                    </View>
                    {obs.pipe_condition && (
                      <View style={styles.obsCardCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
                      </View>
                    )}
                  </View>
                  <View style={styles.obsChipRow}>
                    {PIPE_OPTIONS.map(o => {
                      const sel = obs.pipe_condition === o.key;
                      return (
                        <TouchableOpacity
                          key={o.key}
                          onPress={() => set('pipe_condition', o.key)}
                          style={[styles.obsChip, sel && styles.obsChipSelected]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.obsChipLabel, sel && styles.obsChipLabelSelected]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              </>
            )}

            <View style={styles.obsFooter}>
              <AquaButton
                title={t('waterCliniqAnalysis.backToPhotos')}
                icon="chevron.left"
                onPress={() => setStep('photo')}
                variant="outline"
                style={{ flex: 1 }}
              />
              <AquaButton
                title={sectionsComplete < 2 ? t('waterCliniqAnalysis.optionallyFillMore') : t('waterCliniqAnalysis.runAnalysis')}
                icon={sectionsComplete >= 3 ? 'bubbles.and.sparkles.fill' : undefined}
                onPress={runAnalysis}
                variant={sectionsComplete >= 2 ? 'primary' : 'outline'}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {step === 'analyzing' && (
          <AquaCard style={[styles.card, { alignItems: 'flex-start', paddingVertical: 28 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              {!stepRejected
                ? <ActivityIndicator size="small" color={AquaColors.aquaDeep} />
                : <IconSymbol name="xmark.circle.fill" size={20} color="#dc2626" />}
              <Text style={[styles.analyzingTitle, stepRejected && { color: '#dc2626' }]}>
                {stepRejected ? t('waterCliniqAnalysis.verificationFailed') : t('waterCliniqAnalysis.analysisInProgress')}
              </Text>
            </View>
            {ANALYSIS_STEPS.map((s, i) => {
              const done = !stepRejected && analysisStep > i + 1;
              const current = analysisStep === i + 1;
              const blocked = stepRejected && analysisStep === i + 1;
              const pending = !done && !current && !blocked;
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, opacity: done || current || blocked ? 1 : 0.3 }}>
                  <View style={[styles.stepCircle, done && styles.stepDone, blocked && styles.stepBlocked, current && !stepRejected && styles.stepActive]}>
                    {done
                      ? <Text style={styles.stepCircleText}>✓</Text>
                      : blocked
                        ? <Text style={styles.stepCircleText}>✕</Text>
                        : current && !stepRejected
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={[styles.stepCircleText, { color: '#9ca3af' }]}>{i + 1}</Text>}
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[
                      styles.stepLabel2,
                      done && { color: '#16a34a' },
                      blocked && { color: '#dc2626', fontWeight: '700' },
                      current && !stepRejected && { color: AquaColors.textDark, fontWeight: '600' },
                    ]}>{s.label}</Text>
                    {blocked && <Text style={styles.stepRejectedMsg}>{error}</Text>}
                  </View>
                </View>
              );
            })}
            {stepRejected && (
              <Text style={styles.retryMsg}>{t('waterCliniqAnalysis.returningToPhoto')}</Text>
            )}
          </AquaCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AquaColors.background },
  container: { flex: 1 },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: AquaColors.primary },
  backBtn: { color: '#fff', fontSize: 15, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  steps: { flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: AquaColors.white },
  stepItem: { alignItems: 'center', marginHorizontal: 24 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: AquaColors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotActive: { backgroundColor: AquaColors.primary },
  stepDotNum: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepLabel: { fontSize: 11, color: AquaColors.gray },
  content: { padding: Spacing.md },

  card: { marginBottom: Spacing.sm, padding: Spacing.lg },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark, flex: 1 },
  cardSub: { fontSize: 12, color: AquaColors.gray, marginBottom: 12 },
  subTitle: { fontSize: 13, fontWeight: '700', color: AquaColors.textDark, marginTop: 10, marginBottom: 4 },

  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },
  previewSmall: { width: '100%', height: 120, borderRadius: 12, marginBottom: 10 },
  placeholder: { height: 200, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(0,180,216,0.2)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,119,182,0.06)', marginBottom: 12 },
  placeholderSmall: { height: 120, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,180,216,0.2)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,119,182,0.06)', marginBottom: 10 },
  placeholderText: { color: AquaColors.gray, fontSize: 13, marginTop: 8 },

  row: { flexDirection: 'row', gap: 10, marginTop: 8 },

  // ── Observe step ──
  observeProgressBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, paddingHorizontal: 40,
  },
  observeProgressStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  observeProgressDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: AquaColors.bgAccent,
    alignItems: 'center', justifyContent: 'center',
  },
  observeProgressDotDone: { backgroundColor: AquaColors.mint },
  observeProgressDotNext: { backgroundColor: AquaColors.primaryLight },
  observeProgressNum: { fontSize: 13, fontWeight: '700', color: AquaColors.gray },
  observeProgressLine: { flex: 1, height: 3, backgroundColor: AquaColors.bgAccent, marginHorizontal: 0 },
  observeProgressLineVisible: { backgroundColor: AquaColors.bgAccent },
  observeProgressText: { fontSize: 13, color: AquaColors.gray, textAlign: 'center', marginBottom: 20, fontWeight: '600' },

  obsCard: {
    backgroundColor: AquaColors.white, borderRadius: BorderRadius.lg,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: AquaColors.cardBorder,
    ...Shadows.sm,
  },
  obsCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  obsCardIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: AquaColors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginTop: 1,
  },
  obsCardTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark },
  obsCardDesc: { fontSize: 12, color: AquaColors.gray, marginTop: 2, lineHeight: 17 },
  obsCardCheck: { marginLeft: 10, marginTop: 3 },

  obsOptionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  obsColorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: AquaColors.cardBorder,
    backgroundColor: AquaColors.bgSecondary,
    minWidth: '46%', flex: 1,
  },
  obsColorSwatch: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  obsChipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  obsChip: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5, borderColor: AquaColors.cardBorder,
    backgroundColor: AquaColors.bgSecondary,
  },
  obsChipSelected: {
    borderColor: AquaColors.primary,
    backgroundColor: AquaColors.primaryLight,
  },
  obsChipLabel: { fontSize: 14, color: AquaColors.textDark, fontWeight: '500' },
  obsChipLabelSelected: { color: AquaColors.primary, fontWeight: '700' },

  obsAdvancedToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: AquaColors.bgTertiary, borderRadius: BorderRadius.lg,
    marginBottom: 14,
  },
  obsAdvancedToggleText: { fontSize: 14, fontWeight: '600', color: AquaColors.grayDark },

  obsFooter: {
    flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 40,
  },

  errorBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1.5, borderColor: '#FCA5A5', padding: 14, marginBottom: 14 },
  errorTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 3 },
  errorText: { color: '#DC2626', fontSize: 12, lineHeight: 18 },

  analyzingTitle: { fontSize: 17, fontWeight: '700', color: AquaColors.sky, marginLeft: 8 },
  analyzingSub: { fontSize: 12, color: AquaColors.gray, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: '#16a34a' },
  stepBlocked: { backgroundColor: '#dc2626' },
  stepActive: { backgroundColor: AquaColors.primary },
  stepCircleText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepLabel2: { fontSize: 13, color: '#9ca3af' },
  stepRejectedMsg: { fontSize: 11, color: '#dc2626', marginTop: 3, lineHeight: 16 },
  retryMsg: { fontSize: 12, color: AquaColors.gray, fontStyle: 'italic', marginTop: 12, alignSelf: 'center' },
  sourceWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' },
  sourceWarningText: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 17 },

  // ── Results header ──
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: AquaColors.primary,
  },
  resultsBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultsBackText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultsHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Results ──
  safetyBanner: { padding: 24, alignItems: 'center' },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  bannerTextCol: { flex: 1, gap: 4 },
  safetyLevelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start',
  },
  safetyLevel: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  riskScore: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  safetyVerdict: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600', lineHeight: 17 },
  methodBadge: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  confBadge: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  imageStrip: { paddingHorizontal: Spacing.md, paddingVertical: 8 },
  stripImg: { width: 180, height: 130, borderRadius: 12, marginRight: 8 },
  overallScore: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark, marginBottom: 12, textAlign: 'center' },
  dimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dimLeft: { flex: 1 },
  dimLabel: { fontSize: 12, fontWeight: '600', color: AquaColors.textDark },
  dimDetail: { fontSize: 10, color: AquaColors.gray, marginTop: 2 },
  dimRight: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 100 },
  dimBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: AquaColors.primaryLight },
  dimBarFill: { height: '100%', borderRadius: 3 },
  dimScore: { fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: 'rgba(0,119,182,0.04)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: '45%', flex: 1 },
  pillLabel: { fontSize: 9, color: AquaColors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillValue: { fontSize: 12, fontWeight: '600', color: AquaColors.textDark, marginTop: 2 },

  leakBadge: { borderWidth: 1.5, borderRadius: 8, padding: 10, marginBottom: 10 },
  leakUrgency: { fontSize: 13, fontWeight: '700' },

  actionItem: { fontSize: 12, color: AquaColors.textDark, marginBottom: 4, paddingLeft: 4 },
  actionItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  discrepancyBanner: { backgroundColor: '#fef3c7', borderRadius: 8, marginHorizontal: Spacing.md, marginBottom: 10, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  discrepancyText: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 17 },

  btnRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.md, marginBottom: 20 },

  notesInput: {
    borderWidth: 1.5,
    borderColor: AquaColors.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: AquaColors.textDark,
    minHeight: 80,
    backgroundColor: AquaColors.bgSecondary,
  },
  manualBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: AquaColors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  optionalBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  optionalText: { fontSize: 11, color: '#0369a1', fontWeight: '600' },
});
