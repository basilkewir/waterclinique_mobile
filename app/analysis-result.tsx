/**
 * analysis-result.tsx
 *
 * Universal result screen for all three input methods:
 *   - manual questionnaire
 *   - image / AI analysis
 *   - sensor / test-kit readings
 *
 * Uses the unified WaterQualityResult from WaterQualityEngine when available
 * (stored in imageAnalysis field), otherwise falls back to legacy fields.
 */
import { AquaButton, AquaCard, WaveHeader } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import ApiService from '@/services/ApiService';
import { WaterAnalysisData } from '@/services/StorageService';
import { useAuth } from '@/contexts/AuthContext';
import { WaterIssue, WaterAction, WaterQualityResult, ParameterSummary } from '@/services/WaterQualityEngine';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── colour helpers ──────────────────────────────────────────────────────────

const SAFETY_COLORS: Record<string, string> = {
  safe:      '#16A34A',
  caution:   '#D97706',
  unsafe:    '#DC2626',
  dangerous: '#7C0000',
};

const SAFETY_BG: Record<string, string> = {
  safe:      '#F0FDF4',
  caution:   '#FFFBEB',
  unsafe:    '#FEF2F2',
  dangerous: '#FFF1F2',
};

const SEVERITY_COLORS: Record<string, string> = {
  info:     AquaColors.info,
  warning:  '#D97706',
  danger:   '#DC2626',
  critical: '#7C0000',
};

const METHOD_ICONS: Record<string, string> = {
  manual: 'list.clipboard',
  image:  'camera.fill',
  sensor: 'sensor.fill',
  test:   'flask.fill',
};

// ─── component ───────────────────────────────────────────────────────────────

export default function AnalysisResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<WaterAnalysisData | null>(null);
  const [engine, setEngine] = useState<WaterQualityResult | null>(null);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();

  useFocusEffect(useCallback(() => { loadAnalysis(); }, [id]));

  const loadAnalysis = async () => {
    if (!id) { Alert.alert(t('common.error'), t('analysisResult.notFoundId')); router.back(); return; }
    try {
      let data: WaterAnalysisData | null = null;

      if (isAuthenticated) {
        try {
          const res = await ApiService.getWaterAnalysis(Number(id));
          if (res?.success && res.data) {
            const a = res.data;
            const result = a.result || {};
            const observations = a.observations || {};
            const safetyLevel = a.safety_level || 'CAUTION';
            data = {
              id: String(a.id),
              date: a.created_at || new Date().toISOString(),
              source: a.source_type || 'other',
              location: a.location || '',
              qualityScore: Math.max(0, Math.min(100, 100 - (a.risk_score || 50))),
              qualityLevel: (safetyLevel === 'SAFE' ? 'excellent'
                : safetyLevel === 'CAUTION' ? 'good'
                : safetyLevel === 'UNSAFE' ? 'fair' : 'poor') as any,
              riskScore: a.risk_score || 50,
              urgencyLevel: (safetyLevel === 'DANGEROUS' ? 'high'
                : safetyLevel === 'UNSAFE' ? 'medium'
                : safetyLevel === 'CAUTION' ? 'low' : 'low') as any,
              inputMethod: a.image_path ? 'image' : 'manual',
              color: observations.color || '',
              smell: observations.smell || '',
              taste: observations.taste || '',
              hasParticles: false,
              particles: 'none',
              issues: result?.safety_assessment?.primary_concerns || [],
              recommendations: result?.recommendations?.immediate_actions || [],
              imageUris: a.image_path ? [`${ApiService.getBaseURL().replace('/api', '')}/storage/${a.image_path}`] : undefined,
              imageAnalysis: result ? ({
                safetyLevel: safetyLevel.toLowerCase(),
                safetyLabel: result?.safety_assessment?.safety_verdict || safetyLevel,
                riskScore: a.risk_score || 50,
                confidence: a.confidence_score || 70,
                summary: result?.summaryText || '',
                issues: (result?.safety_assessment?.primary_concerns || []).map((c: string, i: number) => ({
                  id: String(i), category: 'health' as any, severity: 'warning' as any, title: c, explanation: '',
                })),
                actions: (result?.recommendations?.immediate_actions || []).map((a: string) => ({
                  priority: 'immediate' as const, action: a, reason: '', canDoAtHome: true,
                })),
                parameterSummaries: [],
                headline: result?.safety_assessment?.safety_verdict || safetyLevel,
              } as WaterQualityResult) : undefined,
            };
          }
        } catch {}
      }

      if (!data) { Alert.alert(t('common.error'), t('analysisResult.notFound')); router.back(); return; }
      setAnalysis(data);
      if (data.imageAnalysis && data.imageAnalysis.safetyLevel) {
        setEngine(data.imageAnalysis as WaterQualityResult);
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('analysisResult.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!analysis) return;
    Alert.alert(t('analysisResult.deleteTitle'), t('analysisResult.deleteConfirm'), [
      { text: t('analysisResult.cancel'), style: 'cancel' },
      {
        text: t('analysisResult.delete'), style: 'destructive',
        onPress: async () => {
          try {
            if (isAuthenticated) {
              await ApiService.request_(`/water-analyses/${id}`, { method: 'DELETE' });
            }
            router.back();
          } catch { Alert.alert(t('common.error'), t('analysisResult.failedToDelete')); }
        },
      },
    ]);
  };

  // ── loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AquaColors.aquaDeep} />
        <Text style={styles.loadingText}>{t('analysisResult.loading')}</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('analysisResult.notFound')}</Text>
        <AquaButton title={t('analysisResult.goBack')} onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  // ── derive display values ────────────────────────────────────────────────

  const safetyLevel  = engine?.safetyLevel  ?? (analysis.qualityLevel === 'excellent' || analysis.qualityLevel === 'good' ? 'safe' : analysis.qualityLevel === 'fair' ? 'caution' : 'unsafe');
  const safetyLabel  = engine?.safetyLabel  ?? `${t('analysisResult.waterQuality')}: ${analysis.qualityLevel}`;
  const riskScore    = engine?.riskScore    ?? (100 - analysis.qualityScore);
  const confidence   = engine?.confidence   ?? 70;
  const qualityScore = analysis.qualityScore;
  const summary      = engine?.summary      ?? '';

  const issues: WaterIssue[]   = engine?.issues ?? analysis.issues.map((i, idx) => ({
    id: String(idx), category: 'health' as any, severity: 'warning' as any,
    title: i, explanation: '',
  }));

  const actions: WaterAction[] = engine?.actions ?? analysis.recommendations.map((r, idx) => ({
    priority: 'soon' as any, action: r, reason: '', canDoAtHome: true,
  }));

  const parameters: ParameterSummary[] = engine?.parameterSummaries ?? [];

  const infra = engine?.infrastructureAlert;

  const safetyColor = SAFETY_COLORS[safetyLevel] ?? AquaColors.gray;
  const safetyBg    = SAFETY_BG[safetyLevel]    ?? AquaColors.background;

  // ── render ────────────────────────────────────────────────────────────────

  const formattedDate = analysis.date
    ? new Date(analysis.date).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={18} color={AquaColors.textDark} />
          <Text style={styles.backBtnText}>{t('analysisResult.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('analysisResult.title')}</Text>
        <View style={{ width: 60 }} />
      </View>
      <WaveHeader
        title={t('analysisResult.waterAnalysisResult')}
        subtitle={`${t('analysisResult.analysedOn')} ${formattedDate}`}
        height={160}
      />

      <View style={styles.content}>

        {/* ── Safety verdict card ─────────────────────────────────────── */}
        <View style={[styles.verdictCard, { backgroundColor: safetyBg, borderColor: safetyColor }]}>
          <View style={styles.verdictRow}>
            <View style={[styles.verdictBadge, { backgroundColor: safetyColor }]}>
              <Text style={styles.verdictBadgeText}>{safetyLevel.toUpperCase()}</Text>
            </View>
            <View style={styles.verdictScores}>
              <Text style={styles.verdictScore}>{qualityScore}</Text>
              <Text style={styles.verdictScoreLabel}>{t('analysisResult.scoreOutOf')}</Text>
            </View>
          </View>
          <Text style={[styles.verdictLabel, { color: safetyColor }]}>{safetyLabel}</Text>
          {summary !== '' && <Text style={styles.verdictSummary}>{summary}</Text>}

          {/* confidence + method */}
          <View style={styles.verdictMeta}>
            <View style={styles.metaPill}>
              <IconSymbol name={METHOD_ICONS[analysis.inputMethod] ?? 'questionmark.circle'} size={13} color={AquaColors.aquaDeep} />
              <Text style={styles.metaText}>{t(`analysisResult.methods.${analysis.inputMethod}`) || analysis.inputMethod}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{t('analysisResult.confidence', { value: confidence })}</Text>
            </View>
          </View>
        </View>

        {/* ── Infrastructure alert ────────────────────────────────────── */}
        {infra?.hasIssue && (
          <View style={[styles.infraCard, { borderColor: SEVERITY_COLORS['danger'] }]}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol name="wrench.fill" size={18} color="#DC2626" />
              <Text style={styles.infraTitle}> {t('analysisResult.infrastructureAlert')}</Text>
            </View>
            <Text style={styles.infraText}>{infra.description}</Text>
          </View>
        )}

        {/* ── Images (if photo method) ────────────────────────────────── */}
        {analysis.imageUris && analysis.imageUris.length > 0 && (
          <AquaCard style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol name="camera.fill" size={18} color={AquaColors.aquaDeep} />
              <Text style={styles.sectionTitle}> {t('analysisResult.photosAnalysed')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {analysis.imageUris.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
              ))}
            </ScrollView>
          </AquaCard>
        )}

        {/* ── Issues ─────────────────────────────────────────────────── */}
        {issues.length > 0 && (
          <AquaCard style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={AquaColors.warning} />
              <Text style={styles.sectionTitle}> {t('analysisResult.issuesFound', { count: issues.length })}</Text>
            </View>
            {issues.map((issue, i) => (
              <View key={issue.id ?? i} style={[styles.issueRow, { borderLeftColor: SEVERITY_COLORS[issue.severity] ?? AquaColors.warning }]}>
                <View style={styles.issueTitleRow}>
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[issue.severity] ?? AquaColors.warning }]} />
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                </View>
                {issue.explanation !== '' && (
                  <Text style={styles.issueExplanation}>{issue.explanation}</Text>
                )}
                {issue.measuredValue !== undefined && (
                  <Text style={styles.issueMeta}>
                    {t('analysisResult.measured', { value: issue.measuredValue })}
                    {issue.safeRange ? t('analysisResult.safeRange', { range: issue.safeRange }) : ''}
                  </Text>
                )}
              </View>
            ))}
          </AquaCard>
        )}

        {/* ── Parameter summaries ─────────────────────────────────────── */}
        {parameters.length > 0 && (
          <AquaCard style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol name="chart.bar.fill" size={18} color={AquaColors.aquaDeep} />
              <Text style={styles.sectionTitle}> {t('analysisResult.parameterReadings')}</Text>
            </View>
            {parameters.map((p, i) => {
              const statusColor = p.status === 'ok' ? '#16A34A' : p.status === 'unknown' ? AquaColors.gray : '#DC2626';
              return (
                <View key={i} style={styles.paramRow}>
                  <View style={styles.paramLeft}>
                    <Text style={styles.paramName}>{p.name}</Text>
                    <Text style={[styles.paramStatus, { color: statusColor }]}>{p.plainStatus}</Text>
                  </View>
                  <View style={styles.paramRight}>
                    <Text style={styles.paramValue}>{p.value}</Text>
                    <Text style={styles.paramUnit}>{p.unit}</Text>
                  </View>
                </View>
              );
            })}
          </AquaCard>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        {actions.length > 0 && (
          <AquaCard style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.mint} />
              <Text style={styles.sectionTitle}> {t('analysisResult.whatToDo')}</Text>
            </View>
            {(['immediate', 'soon', 'eventually'] as const).map(priority => {
              const group = actions.filter(a => a.priority === priority);
              if (group.length === 0) return null;
              return (
                  <View key={priority} style={styles.actionGroup}>
                    <View style={styles.actionGroupTitleRow}>
                      <IconSymbol 
                        name={priority === 'immediate' ? 'exclamationmark.triangle.fill' : priority === 'soon' ? 'calendar' : 'lightbulb.fill'} 
                        size={14} 
                        color={priority === 'immediate' ? AquaColors.error : priority === 'soon' ? AquaColors.gold : AquaColors.sky} 
                      />
                      <Text style={styles.actionGroupLabel}>
                        {priority === 'immediate' ? t('analysisResult.doThisNow') :
                         priority === 'soon'      ? t('analysisResult.doThisSoon') :
                                                    t('analysisResult.goodToKnow')}
                      </Text>
                    </View>
                  {group.map((act, j) => (
                    <View key={j} style={styles.actionRow}>
                      <View style={styles.actionDot} />
                      <View style={styles.actionBody}>
                        <Text style={styles.actionText}>{act.action}</Text>
                        {act.reason !== '' && <Text style={styles.actionReason}>{act.reason}</Text>}
                        {act.canDoAtHome && (
                          <View style={styles.actionHomeRow}>
                            <IconSymbol name="house.fill" size={12} color={AquaColors.sky} />
                            <Text style={styles.actionHome}> {t('analysisResult.youCanDoAtHome')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </AquaCard>
        )}

        {/* ── Details ─────────────────────────────────────────────────── */}
        <AquaCard style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol name="magnifyingglass" size={18} color={AquaColors.sky} />
            <Text style={styles.sectionTitle}> {t('analysisResult.analysisDetails')}</Text>
          </View>
          {([
            ['source', analysis.source.charAt(0).toUpperCase() + analysis.source.slice(1)],
            analysis.location ? ['location', analysis.location] : null,
            ['colour', analysis.color],
            ['particles', analysis.hasParticles ? `Yes${analysis.particleDescription ? ' (' + analysis.particleDescription + ')' : ''}` : 'No'],
            ['smell', analysis.smell],
            ['taste', analysis.taste],
            analysis.ph ? ['ph', String(analysis.ph)] : null,
            analysis.tds ? ['tds', `${analysis.tds} mg/L`] : null,
            analysis.temperature ? ['temperature', `${analysis.temperature}°C`] : null,
            analysis.chlorine ? ['chlorine', `${analysis.chlorine} mg/L`] : null,
            analysis.turbidity ? ['turbidity', `${analysis.turbidity} NTU`] : null,
            analysis.hardness ? ['hardness', `${analysis.hardness} mg/L`] : null,
          ] as [string, string | undefined][]).filter(Boolean).map(([key, value], i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t(`analysisResult.${key}`)}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </AquaCard>

        {/* ── Buttons ─────────────────────────────────────────────────── */}
        <View style={styles.buttonRow}>
          <AquaButton
            title={t('analysisResult.analyseAnother')}
            onPress={() => router.push('/(tabs)/analyze')}
            variant="outline"
            style={styles.btn}
          />
          <AquaButton
            title={t('analysisResult.delete')}
            onPress={handleDelete}
            variant="outline"
            style={[styles.btn, { borderColor: AquaColors.error }]}
          />
        </View>

      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: AquaColors.background,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 15, color: AquaColors.textDark, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark },
  content: { padding: Spacing.md, paddingTop: 4, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, fontSize: 15, color: AquaColors.gray },
  errorText: { fontSize: 18, fontWeight: 'bold', color: AquaColors.error, marginBottom: Spacing.lg },

  verdictCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  verdictRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  verdictBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  verdictBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  verdictScores: { flexDirection: 'row', alignItems: 'baseline' },
  verdictScore: { fontSize: 42, fontWeight: '800', color: AquaColors.primaryDark },
  verdictScoreLabel: { fontSize: 16, color: AquaColors.gray, marginLeft: 2 },
  verdictLabel: { fontSize: 17, fontWeight: '700', marginBottom: 6, color: AquaColors.textDark },
  verdictSummary: { fontSize: 14, color: AquaColors.textSecondary, lineHeight: 20 },
  verdictMeta: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AquaColors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: { fontSize: 12, color: AquaColors.primary, fontWeight: '600' },

  infraCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(230,57,70,0.08)',
    marginBottom: Spacing.md,
  },
  infraTitle: { fontSize: 15, fontWeight: '700', color: AquaColors.error },
  infraText:  { fontSize: 13, color: '#EF4444', lineHeight: 19 },

  sectionCard: { marginBottom: Spacing.md, padding: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AquaColors.textDark,
  },

  imageScroll: { marginTop: 4 },
  thumbImage: {
    width: 140,
    height: 100,
    borderRadius: BorderRadius.sm,
    marginRight: 8,
  },

  issueRow: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(0,119,182,0.06)',
    borderRadius: 4,
  },
  issueTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  issueTitle:  { fontSize: 14, fontWeight: '700', color: AquaColors.textDark, flex: 1 },
  issueExplanation: { fontSize: 13, color: AquaColors.textSecondary, lineHeight: 19, marginBottom: 4 },
  issueMeta: { fontSize: 12, color: AquaColors.gray },
  issueMeasured: { fontWeight: '700' },

  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AquaColors.borderLight,
  },
  paramLeft: { flex: 1 },
  paramName:   { fontSize: 13, fontWeight: '600', color: AquaColors.textDark },
  paramStatus: { fontSize: 12, marginTop: 2 },
  paramRight: { alignItems: 'flex-end' },
  paramValue: { fontSize: 15, fontWeight: '700', color: AquaColors.primaryDark },
  paramUnit:  { fontSize: 11, color: AquaColors.gray },

  actionGroup: { marginBottom: Spacing.md },
  actionGroupTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionGroupLabel: { fontSize: 13, fontWeight: '700', color: AquaColors.textDark },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  actionDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: AquaColors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  actionBody: { flex: 1 },
  actionText:   { fontSize: 14, fontWeight: '600', color: AquaColors.textDark, lineHeight: 20 },
  actionReason: { fontSize: 13, color: AquaColors.textSecondary, marginTop: 2, lineHeight: 18 },
  actionHomeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  actionHome:   { fontSize: 12, color: AquaColors.primary, fontStyle: 'italic' },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AquaColors.borderLight,
  },
  detailLabel: { fontSize: 13, color: AquaColors.gray },
  detailValue: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark, textAlign: 'right', flex: 1, marginLeft: 8 },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  btn: { flex: 1 },
});