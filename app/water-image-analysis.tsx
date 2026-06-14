import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import CustomCamera from '@/components/ui/CustomCamera';
import SourcePicker from '@/components/ui/SourcePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import WaterAnalysisResult from '@/components/water-analysis/WaterAnalysisResult';
import type { UserFriendlyResult, DetailedAnalysisResult } from '@/types/api';
import { AquaColors, lightTheme, Spacing } from '@/constants/theme-constants';
import type { WaterSource } from '@/services/WaterDataService';
import ApiService from '@/services/ApiService';
import GoogleVisionService from '@/services/GoogleVisionService';
import { extractVisionData } from '@/services/VisionWaterAnalyzer';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type Step = 'setup' | 'color' | 'clarity' | 'smell' | 'taste' | 'particles' | 'analyzing' | 'result';

interface UserAnswers {
  source_type: string;
  color: string;
  clarity: string;
  smell: string;
  taste: string;
  particles: string;
}

type PhotoSlot = 'water' | 'pipes' | 'environment';

interface Photos {
  water: string | null;
  pipes: string | null;
  environment: string | null;
}

// ── Option lists ──────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { key: 'clear',       label: 'Clear',      icon: 'drop.fill',           color: '#22c55e' },
  { key: 'yellowish',   label: 'Yellowish',  icon: 'drop.fill',           color: '#eab308' },
  { key: 'brownish',    label: 'Brownish',    icon: 'drop.fill',           color: '#f97316' },
  { key: 'cloudy',      label: 'Cloudy',      icon: 'drop.fill',           color: '#64748b' },
  { key: 'greenish',    label: 'Greenish',    icon: 'drop.fill',           color: '#16a34a' },
  { key: 'reddish',     label: 'Reddish',     icon: 'drop.fill',           color: '#dc2626' },
  { key: 'black',       label: 'Black/Dark',  icon: 'drop.fill',           color: '#1f2937' },
];

const CLARITY_OPTIONS = [
  { key: 'clear',           label: 'Clear',     icon: 'circle.fill',        color: '#22c55e' },
  { key: 'slightly_cloudy', label: 'Slightly Hazy', icon: 'circle.lefthalf.fill', color: '#84cc16' },
  { key: 'cloudy',          label: 'Cloudy',     icon: 'circle.lefthalf.fill',    color: '#eab308' },
  { key: 'turbid',          label: 'Turbid',     icon: 'circle.lefthalf.fill',    color: '#f97316' },
  { key: 'very_turbid',     label: 'Very Turbid', icon: 'xmark.circle.fill',     color: '#ef4444' },
];

const SMELL_OPTIONS = [
  { key: 'none',     label: 'No Smell',    icon: 'checkmark.circle.fill', color: '#22c55e' },
  { key: 'chlorine', label: 'Chlorine',    icon: 'flask.fill',            color: '#0ea5e9' },
  { key: 'earthy',   label: 'Earthy',      icon: 'leaf.fill',             color: '#84cc16' },
  { key: 'fishy',    label: 'Fishy',       icon: 'fish.fill',             color: '#f97316' },
  { key: 'chemical', label: 'Chemical',    icon: 'exclamationmark.triangle.fill', color: '#ef4444' },
  { key: 'sewage',   label: 'Sewage',      icon: 'xmark.circle.fill',    color: '#7f1d1d' },
  { key: 'sulphur',  label: 'Rotten Egg',  icon: 'trash.fill',           color: '#92400e' },
  { key: 'musty',    label: 'Musty',       icon: 'humidity.fill',        color: '#64748b' },
];

const TASTE_OPTIONS = [
  { key: 'normal',   label: 'Normal',    color: '#22c55e' },
  { key: 'chlorine', label: 'Chlorine',  color: '#0ea5e9' },
  { key: 'metallic', label: 'Metallic',  color: '#64748b' },
  { key: 'salty',    label: 'Salty',     color: '#0e7490' },
  { key: 'bitter',   label: 'Bitter',    color: '#f97316' },
  { key: 'chemical', label: 'Chemical',  color: '#ef4444' },
];

const PARTICLE_OPTIONS = [
  { key: 'none',      label: 'None',         color: '#22c55e' },
  { key: 'few',       label: 'A Few',         color: '#84cc16' },
  { key: 'some',      label: 'Some',          color: '#eab308' },
  { key: 'many',      label: 'Many',          color: '#f97316' },
  { key: 'sediment',  label: 'Sludge / Mud', color: '#ef4444' },
];

// ── PhotoSlotRow ─────────────────────────────────────────────────────────────

function PhotoSlotRow({
  label, hint, icon, iconColor, uri, onCamera, onGallery, onRemove, visionBadge,
}: {
  label: string; hint: string; icon: string; iconColor: string;
  uri: string | null; onCamera: () => void; onGallery: () => void; onRemove: () => void;
  visionBadge?: string | null;
}) {
  return (
    <View style={slotStyles.row}>
      <View style={slotStyles.labelRow}>
        <View style={[slotStyles.iconWrap, { backgroundColor: iconColor + '18' }]}>
          <IconSymbol name={icon as any} size={16} color={iconColor} />
        </View>
        <ThemedText style={slotStyles.label}>{label}</ThemedText>
        <ThemedText style={slotStyles.hint}>{hint}</ThemedText>
      </View>
      {uri ? (
        <View>
          <Image source={{ uri }} style={slotStyles.preview} />
          {visionBadge && (
            <View style={slotStyles.visionBadge}>
              <IconSymbol name="eye.fill" size={12} color="#22c55e" />
              <ThemedText style={slotStyles.visionText}>{visionBadge}</ThemedText>
            </View>
          )}
          <TouchableOpacity onPress={onRemove} style={slotStyles.removeBtn}>
            <ThemedText style={slotStyles.removeText}>Remove</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={slotStyles.actions}>
          <TouchableOpacity style={slotStyles.camBtn} onPress={onCamera}>
            <IconSymbol name="camera.fill" size={16} color="#fff" />
            <ThemedText style={slotStyles.camText}>Camera</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={slotStyles.gallBtn} onPress={onGallery}>
            <IconSymbol name="photo.fill" size={16} color={AquaColors.aquaDeep} />
            <ThemedText style={slotStyles.gallText}>Gallery</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  row:       { marginBottom: Spacing.md, borderWidth: 1, borderColor: AquaColors.border, borderRadius: 12, padding: Spacing.sm, backgroundColor: '#fafafa' },
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iconWrap:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 13, fontWeight: '700', color: AquaColors.textDark },
  hint:      { fontSize: 11, color: AquaColors.textSecondary, flex: 1, textAlign: 'right' },
  preview:   { width: '100%', height: 140, borderRadius: 10, marginBottom: 6, resizeMode: 'cover' },
  visionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dcfce7', padding: 6, borderRadius: 8, marginBottom: 4 },
  visionText:  { fontSize: 11, color: '#166534', fontWeight: '600', flex: 1 },
  removeBtn:   { alignItems: 'center', paddingVertical: 4 },
  removeText:  { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  actions:  { flexDirection: 'row', gap: 8 },
  camBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: AquaColors.primary, borderRadius: 10, paddingVertical: 10 },
  camText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  gallBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 2, borderColor: AquaColors.aquaDeep, borderRadius: 10, paddingVertical: 10 },
  gallText: { color: AquaColors.aquaDeep, fontWeight: '700', fontSize: 13 },
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function WaterImageAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('setup');
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [photos, setPhotos] = useState<Photos>({ water: null, pipes: null, environment: null });
  const [activeSlot, setActiveSlot] = useState<PhotoSlot>('water');
  const [showCamera, setShowCamera] = useState(false);
  const [visionData, setVisionData] = useState<any>(null);
  const [answers, setAnswers] = useState<UserAnswers>({ source_type: 'tap', color: 'clear', clarity: 'clear', smell: 'none', taste: 'normal', particles: 'none' });
  const [result, setResult] = useState<UserFriendlyResult | null>(null);
  const [detailed, setDetailed] = useState<DetailedAnalysisResult | null>(null);
  const [readingId, setReadingId] = useState<number | null>(null);
  const STEP_NUMS: Record<Step, number> = { setup: 1, color: 2, clarity: 3, smell: 4, taste: 5, particles: 6, analyzing: 7, result: 7 };
  const progress = `${Math.round(((STEP_NUMS[step] || 1) / 5) * 100)}%`;

  // Reset all state every time the screen comes into focus (new test)
  useFocusEffect(
    React.useCallback(() => {
      setStep('setup');
      setSelectedSource(null);
      setPhotos({ water: null, pipes: null, environment: null });
      setVisionData(null);
      setAnswers({ source_type: 'tap', color: 'clear', clarity: 'clear', smell: 'none', taste: 'normal', particles: 'none' });
      setResult(null);
      setDetailed(null);
      setReadingId(null);
    }, [])
  );

  // ── Image capture ───────────────────────────────────────────────────────────

  const handleCameraCapture = (uri: string) => {
    setShowCamera(false);
    setPhotos(p => ({ ...p, [activeSlot]: uri }));
    if (activeSlot === 'water') runVisionCheck(uri);
  };

  const handlePickGallery = async (slot: PhotoSlot) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.9,
    });
    if (!res.canceled) {
      setPhotos(p => ({ ...p, [slot]: res.assets[0].uri }));
      if (slot === 'water') runVisionCheck(res.assets[0].uri);
    }
  };

  const runVisionCheck = async (uri: string) => {
    try {
      await GoogleVisionService.init();
      if (!GoogleVisionService.isConfigured()) return;
      const vr = await GoogleVisionService.analyze([uri]);
      if (!vr.success) return;
      const extracted = extractVisionData(vr.objects, vr.labels, vr.colors, vr.fullText, vr.detectedText);
      setVisionData(extracted);
      if (extracted.container.plastic_detected) {
        Alert.alert('Wrong Container', 'A plastic bottle was detected. Please use a clear glass cup.', [
          { text: 'Retake', onPress: () => { setPhotos(p => ({ ...p, water: null })); setVisionData(null); } },
        ]);
      }
    } catch { /* Vision optional */ }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submitAnalysis = async (finalAnswers: UserAnswers) => {
    setStep('analyzing');
    try {
      let uploadUri = photos.water;
      if (uploadUri) {
        const compressed = await ImageManipulator.manipulateAsync(
          uploadUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        uploadUri = compressed.uri;
      }

      const data = await ApiService.analyzeWaterImage(
        uploadUri ?? '',
        {
          color: finalAnswers.color as any,
          clarity: finalAnswers.clarity as any,
          smell: finalAnswers.smell as any,
          taste: finalAnswers.taste as any,
          source_type: (selectedSource?.source_type ?? finalAnswers.source_type) as any,
          particles: finalAnswers.particles as any,
          context_mode: 'water',
          water_source_id: selectedSource?.id,
        },
        visionData ? JSON.stringify(visionData) : undefined
      );

      if (!data.success) throw new Error(data.message || 'Analysis failed');

      // Backend returns 422 with retake_required on container/observation mismatch
      if (data.retake_required) {
        Alert.alert('Retake Photo', data.retake_message || 'Please retake using a clear glass cup.', [
          { text: 'Retake', onPress: () => { setPhotos(p => ({ ...p, water: null })); setVisionData(null); setStep('setup'); } },
          { text: 'Continue Without Photo', onPress: () => { setPhotos(p => ({ ...p, water: null })); setVisionData(null); submitWithoutImage(finalAnswers); } },
        ]);
        return;
      }

      setResult(data.result);
      setDetailed(data.detailed ?? null);
      setReadingId(data.reading_id ?? null);
      setStep('result');
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'Check your connection and try again.', [
        { text: 'Retry', onPress: () => submitAnalysis(finalAnswers) },
        { text: 'Cancel', onPress: () => setStep('particles') },
      ]);
    }
  };

  const submitWithoutImage = async (finalAnswers: UserAnswers) => {
    setPhotos(p => ({ ...p, water: null }));
    setVisionData(null);
    await submitAnalysis(finalAnswers);
  };

  const resetAll = () => {
    setPhotos({ water: null, pipes: null, environment: null }); setVisionData(null); setResult(null); setDetailed(null);
    setReadingId(null); setAnswers({ source_type: 'tap', color: 'clear', clarity: 'clear', smell: 'none', taste: 'normal', particles: 'none' });
    setStep('setup');
  };
  const renderChips = (options: { key: string; label: string; color?: string }[], selected: string, onSelect: (k: string) => void) => (
    <View style={styles.chips}>
      {options.map(o => (
        <TouchableOpacity
          key={o.key}
          style={[styles.chip, selected === o.key && { backgroundColor: (o.color ?? AquaColors.primary) + '20', borderColor: o.color ?? AquaColors.primary, borderWidth: 2 }]}
          onPress={() => onSelect(o.key)}
        >
          <ThemedText style={[styles.chipText, selected === o.key && { color: o.color ?? AquaColors.primary, fontWeight: '700' }]}>
            {o.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (showCamera) return <CustomCamera onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} mode="water" />;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Water Quality Test</ThemedText>
            <ThemedText style={styles.subtitle}>Answer a few questions for AI analysis</ThemedText>
          </View>

          {/* Progress */}
          {step !== 'result' && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: progress }]} />
            </View>
          )}

          {/* ── SETUP: Source + optional image ── */}
          {step === 'setup' && (
            <AquaCard style={styles.card}>
              <SourcePicker onSelect={setSelectedSource} />

              <View style={styles.imageSectionHeader}>
                <ThemedText style={styles.sectionLabel}>Photos</ThemedText>
                <View style={styles.optionalBadge}><ThemedText style={styles.optionalText}>All Optional</ThemedText></View>
              </View>
              <ThemedText style={styles.imageHint}>
                Add any or all photos to improve accuracy. You can skip them all.
              </ThemedText>

              {/* Water Sample */}
              <PhotoSlotRow
                label="Water Sample"
                hint="Clear glass cup recommended"
                icon="drop.fill"
                iconColor={AquaColors.primary}
                uri={photos.water}
                onCamera={() => { setActiveSlot('water'); setShowCamera(true); }}
                onGallery={() => handlePickGallery('water')}
                onRemove={() => { setPhotos(p => ({ ...p, water: null })); setVisionData(null); }}
                visionBadge={visionData ? `${visionData.colors.water_corrected?.dominant_name} · ${visionData.turbidity.ntu_estimate} NTU · Container ${visionData.container.passed ? '✓' : '⚠️'}` : null}
              />

              {/* Pipes */}
              <PhotoSlotRow
                label="Pipes & Infrastructure"
                hint="Photograph pipes, taps or plumbing"
                icon="wrench.fill"
                iconColor="#d97706"
                uri={photos.pipes}
                onCamera={() => { setActiveSlot('pipes'); setShowCamera(true); }}
                onGallery={() => handlePickGallery('pipes')}
                onRemove={() => setPhotos(p => ({ ...p, pipes: null }))}
              />

              {/* Environment */}
              <PhotoSlotRow
                label="Environment"
                hint="Water source surroundings"
                icon="leaf.fill"
                iconColor="#16a34a"
                uri={photos.environment}
                onCamera={() => { setActiveSlot('environment'); setShowCamera(true); }}
                onGallery={() => handlePickGallery('environment')}
                onRemove={() => setPhotos(p => ({ ...p, environment: null }))}
              />

              <AquaButton
                title={selectedSource ? 'Continue →' : 'Select a source above to continue'}
                onPress={() => setStep('color')}
                disabled={!selectedSource}
                style={{ marginTop: Spacing.md }}
              />
              {!selectedSource && (
                <ThemedText style={styles.noSourceHint}>Select or create a water source above.</ThemedText>
              )}
            </AquaCard>
          )}

          {/* ── COLOR ── */}
          {step === 'color' && (
            <AquaCard style={styles.card}>
              {photos.water && <Image source={{ uri: photos.water }} style={styles.thumbImage} />}
              <View style={styles.bubble}>
                <ThemedText style={styles.stepLabel}>Step 1 of 5 — Colour</ThemedText>
                <ThemedText style={styles.bubbleText}>What colour is the water?</ThemedText>
              </View>
              {renderChips(COLOR_OPTIONS, answers.color, (key) => {
                setAnswers(a => ({ ...a, color: key }));
                setStep('clarity');
              })}
            </AquaCard>
          )}

          {/* ── CLARITY ── */}
          {step === 'clarity' && (
            <AquaCard style={styles.card}>
              <View style={styles.bubble}>
                <ThemedText style={styles.stepLabel}>Step 2 of 5 — Clarity</ThemedText>
                <ThemedText style={styles.bubbleText}>How clear is the water?</ThemedText>
              </View>
              {renderChips(CLARITY_OPTIONS, answers.clarity, (key) => {
                setAnswers(a => ({ ...a, clarity: key }));
                setStep('smell');
              })}
              <AquaButton title="Back" variant="outline" onPress={() => setStep('color')} style={styles.backBtn} />
            </AquaCard>
          )}

          {/* ── SMELL ── */}
          {step === 'smell' && (
            <AquaCard style={styles.card}>
              {photos.water && <Image source={{ uri: photos.water }} style={styles.thumbImage} />}
              <View style={styles.bubble}>
                <ThemedText style={styles.stepLabel}>Step 3 of 5 — Smell</ThemedText>
                <ThemedText style={styles.bubbleText}>Does the water have any smell?</ThemedText>
              </View>
              {renderChips(SMELL_OPTIONS, answers.smell, (key) => {
                setAnswers(a => ({ ...a, smell: key }));
                setStep('taste');
              })}
              <AquaButton title="Back" variant="outline" onPress={() => setStep('clarity')} style={styles.backBtn} />
            </AquaCard>
          )}

          {/* ── TASTE ── */}
          {step === 'taste' && (
            <AquaCard style={styles.card}>
              <View style={styles.bubble}>
                <ThemedText style={styles.stepLabel}>Step 4 of 5 — Taste</ThemedText>
                <ThemedText style={styles.bubbleText}>How does the water taste?</ThemedText>
              </View>
              {renderChips(TASTE_OPTIONS, answers.taste, (key) => {
                setAnswers(a => ({ ...a, taste: key }));
                setStep('particles');
              })}
              <AquaButton title="Back" variant="outline" onPress={() => setStep('smell')} style={styles.backBtn} />
            </AquaCard>
          )}

          {/* ── PARTICLES ── */}
          {step === 'particles' && (
            <AquaCard style={styles.card}>
              <View style={styles.bubble}>
                <ThemedText style={styles.stepLabel}>Step 5 of 5 — Particles</ThemedText>
                <ThemedText style={styles.bubbleText}>Can you see anything floating or settled in the water?</ThemedText>
              </View>
              {renderChips(PARTICLE_OPTIONS, answers.particles, (key) => {
                const final = { ...answers, particles: key };
                setAnswers(final);
                submitAnalysis(final);
              })}
              <AquaButton title="Back" variant="outline" onPress={() => setStep('taste')} style={styles.backBtn} />
            </AquaCard>
          )}

          {/* ── ANALYZING ── */}
          {step === 'analyzing' && (
            <AquaCard style={styles.card}>
              {photos.water && <Image source={{ uri: photos.water }} style={styles.previewImage} />}
              <View style={styles.analyzingBox}>
                <IconSymbol name="hourglass" size={32} color={AquaColors.primary} />
                <ThemedText style={styles.analyzingTitle}>Analysing your water…</ThemedText>
                <ThemedText style={styles.analyzingSubtitle}>Comparing against WHO standards</ThemedText>
              </View>
            </AquaCard>
          )}

          {/* RESULT — uses WaterAnalysisResult component */}
          {step === 'result' && result && (
            <WaterAnalysisResult
              result={result}
              detailed={detailed ?? undefined}
              readingId={readingId}
              onRetake={resetAll}
            />
          )}

          <AquaButton title="Cancel" variant="outline" onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: lightTheme.background },
  scroll:  { flex: 1 },
  content: { padding: Spacing.md, paddingTop: Spacing.xl },

  header:   { alignItems: 'center', marginBottom: Spacing.lg },
  title:    { fontSize: 26, fontWeight: '700', color: AquaColors.primary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: AquaColors.secondary, marginTop: 4, textAlign: 'center' },

  progressBar:  { height: 5, backgroundColor: AquaColors.light, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.lg },
  progressFill: { height: '100%', backgroundColor: AquaColors.primary, borderRadius: 3 },

  card: { padding: Spacing.lg, marginBottom: Spacing.md },

  imageSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: AquaColors.textDark },
  optionalBadge: { backgroundColor: '#e0f2fe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  optionalText: { fontSize: 11, color: '#0369a1', fontWeight: '600' },
  imageHint: { fontSize: 12, color: AquaColors.textSecondary, marginBottom: Spacing.sm },

  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: Spacing.sm, resizeMode: 'cover' },
  thumbImage:   { width: '100%', height: 110, borderRadius: 10, marginBottom: Spacing.sm, resizeMode: 'cover' },
  visionBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dcfce7', padding: 8, borderRadius: 8, marginBottom: 6 },
  visionBadgeText: { fontSize: 11, color: '#166534', fontWeight: '600', flex: 1 },
  removePhotoBtn: { alignItems: 'center', paddingVertical: 6 },
  removePhotoText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  noSourceHint: { fontSize: 11, color: '#d97706', textAlign: 'center', marginTop: 6 },

  bubble: { backgroundColor: '#f0f9ff', borderRadius: 14, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#bae6fd' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: AquaColors.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { fontSize: 17, color: AquaColors.textDark, fontWeight: '600' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip:  { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: AquaColors.border, backgroundColor: '#f8faff' },
  chipText: { fontSize: 13, color: AquaColors.textDark, fontWeight: '500' },

  backBtn: { marginTop: 4 },

  analyzingBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.primary },
  analyzingSubtitle: { fontSize: 13, color: AquaColors.secondary },
});
