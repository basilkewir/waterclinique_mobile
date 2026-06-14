import { AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListSkeleton } from '@/components/SkeletonLoader';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import ApiService from '@/services/ApiService';
import WaterDataService from '@/services/WaterDataService';
import { WaterAnalysisData } from '@/services/StorageService';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function mapBackendAnalysis(a: any): WaterAnalysisData {
  const result = a.result || {};
  const observations = a.observations || {};
  const safetyLevel = (a.safety_level || 'CAUTION').toUpperCase();
  // qualityScore derived from safety_level directly — not inverted risk_score
  const qualityScore = safetyLevel === 'SAFE' ? 85
    : safetyLevel === 'CAUTION' ? 60
    : safetyLevel === 'UNSAFE' ? 35 : 10;

  return {
    id: String(a.id),
    date: a.created_at || new Date().toISOString(),
    source: a.water_source?.source_type || a.source_type || 'other',
    location: a.location || a.water_source?.name || '',
    qualityScore,
    qualityLevel: safetyLevel === 'SAFE' ? 'excellent'
      : safetyLevel === 'CAUTION' ? 'good'
      : safetyLevel === 'UNSAFE' ? 'fair' : 'poor',
    riskScore: a.risk_score ?? 50,
    urgencyLevel: safetyLevel === 'DANGEROUS' ? 'high'
      : safetyLevel === 'UNSAFE' ? 'medium' : 'low',
    inputMethod: a.image_path ? 'image' : 'manual',
    color: observations.color || '',
    smell: observations.smell || '',
    taste: observations.taste || '',
    hasParticles: observations.particles ? observations.particles !== 'none' : false,
    particles: observations.particles || 'none',
    issues: result?.safety_assessment?.primary_concerns || [],
    recommendations: result?.recommendations?.immediate_actions || [],
    imageUris: a.image_path ? [`${ApiService.getBaseURL().replace('/api', '')}/storage/${a.image_path}`] : undefined,
    imageAnalysis: result ? {
      safetyLevel: safetyLevel.toLowerCase(),
      safetyLabel: result?.safety_assessment?.safety_verdict || safetyLevel,
      riskScore: a.risk_score ?? 50,
      confidence: a.confidence_score ?? 70,
      summary: result?.summaryText || '',
      issues: (result?.safety_assessment?.primary_concerns || []).map((c: string, i: number) => ({
        id: String(i), category: 'health', severity: 'warning', title: c, explanation: '',
      })),
      actions: (result?.recommendations?.immediate_actions || []).map((act: string) => ({
        priority: 'immediate', action: act, reason: '', canDoAtHome: true,
      })),
      parameterSummaries: [],
      headline: result?.safety_assessment?.safety_verdict || safetyLevel,
    } : undefined,
    // carry through real water_source name for display
    _waterSourceName: a.water_source?.name,
  } as WaterAnalysisData & { _waterSourceName?: string };
}

function fmtDate(d: string): string {
  try {
    const p = new Date(d);
    const now = new Date();
    if (p.toDateString() === now.toDateString()) return `Today ${p.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (p.toDateString() === y.toDateString()) return `Yesterday ${p.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return p.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function safetyBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'SAFE',      color: '#16a34a', bg: '#dcfce7' };
  if (score >= 55) return { label: 'CAUTION',   color: '#ca8a04', bg: '#fef9c3' };
  if (score >= 25) return { label: 'UNSAFE',    color: '#ea580c', bg: '#ffedd5' };
  return              { label: 'DANGEROUS', color: '#dc2626', bg: '#fee2e2' };
}

function methodIcon(method: string): any {
  if (method === 'image') return 'camera.fill';
  if (method === 'sensor') return 'antenna.radiowaves.left.and.right';
  return 'clipboard.fill';
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [analyses, setAnalyses] = useState<WaterAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'unsafe'>('all');

  const { isAuthenticated } = useAuth();

  const load = useCallback(async () => {
    try {
      const data = await WaterDataService.getFeed();
      setAnalyses(data.map(mapBackendAnalysis));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    if (id.startsWith('reading_')) {
      Alert.alert('Info', 'Manual readings cannot be deleted from here.');
      return;
    }
    Alert.alert('Delete Result', 'Remove this analysis from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await ApiService.request_(`/water-analyses/${id}`, { method: 'DELETE' }); } catch {}
          setAnalyses(prev => prev.filter(a => a.id !== id));
        },
      },
    ]);
  };

  const filtered = analyses.filter(a => {
    if (filter === 'all') return true;
    const b = safetyBadge(a.qualityScore);
    if (filter === 'safe') return b.label === 'SAFE';
    if (filter === 'caution') return b.label === 'CAUTION';
    if (filter === 'unsafe') return b.label === 'UNSAFE' || b.label === 'DANGEROUS';
    return true;
  });

  const stats = {
    total: analyses.length,
    safe: analyses.filter(a => a.qualityScore >= 80).length,
    avg: analyses.length ? Math.round(analyses.reduce((s, a) => s + a.qualityScore, 0) / analyses.length) : 0,
  };

  if (loading) return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>My Results</Text>
      </View>
      <ListSkeleton count={5} />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>My Results</Text>
        <Text style={styles.headerSub}>{stats.total} water tests recorded</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={AquaColors.primary} />}
      >
        {/* Stats strip */}
        {analyses.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>Total Tests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#16a34a' }]}>{stats.safe}</Text>
              <Text style={styles.statLbl}>Safe Results</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: AquaColors.primary }]}>{stats.avg}</Text>
              <Text style={styles.statLbl}>Avg Score</Text>
            </View>
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
          {(['all', 'safe', 'caution', 'unsafe'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'safe' ? '✓ Safe' : f === 'caution' ? '⚠ Caution' : '✕ Unsafe'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <AquaCard style={styles.emptyCard}>
              <IconSymbol name="chart.bar.fill" size={40} color={AquaColors.primaryLight} />
              <Text style={styles.emptyTitle}>No results yet</Text>
              <Text style={styles.emptySub}>Run a water analysis to see your results here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/analyze')}>
                <Text style={styles.emptyBtnText}>Test Your Water</Text>
              </TouchableOpacity>
            </AquaCard>
          ) : (
            filtered.map((a, index) => {
              const badge = safetyBadge(a.qualityScore);
              const sourceName = (a as any)._waterSourceName
                || ((a.source || 'Unknown').charAt(0).toUpperCase() + (a.source || 'Unknown').slice(1));
              return (
                <TouchableOpacity
                  key={`${index}-${a.id}`}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/analysis-result?id=${a.id}`)}
                  onLongPress={() => handleDelete(a.id)}
                >
                  <AquaCard style={styles.resultCard}>
                    <View style={styles.resultTop}>
                      <View style={[styles.safetyCircle, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                        <Text style={[styles.safetyLbl, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <View style={styles.resultTitleRow}>
                          <Text style={styles.resultSource} numberOfLines={1}>{sourceName}</Text>
                          <IconSymbol name={methodIcon(a.inputMethod)} size={14} color={AquaColors.gray} />
                        </View>
                        <Text style={styles.resultDate}>{fmtDate(a.date)}</Text>
                        <Text style={styles.riskLine}>
                          <Text style={{ color: badge.color, fontWeight: '700' }}>{badge.label}</Text>
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={14} color={AquaColors.gray} />
                    </View>

                    {a.issues && a.issues.length > 0 && (
                      <View style={styles.issueRow}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={11} color={badge.color} />
                        <Text style={[styles.issueText, { color: badge.color }]} numberOfLines={1}>
                          {a.issues[0]}
                        </Text>
                      </View>
                    )}

                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreBarFill, { width: `${a.qualityScore}%`, backgroundColor: badge.color }]} />
                    </View>
                  </AquaCard>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },
  header: { backgroundColor: AquaColors.primary, paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: Spacing.md,
    marginTop: -14, borderRadius: BorderRadius.lg, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: AquaColors.textDark },
  statLbl: { fontSize: 10, color: AquaColors.gray, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: AquaColors.border },

  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: AquaColors.border },
  filterChipActive: { backgroundColor: AquaColors.primary, borderColor: AquaColors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: AquaColors.gray },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: Spacing.md },

  resultCard: { padding: Spacing.md, marginBottom: 10 },
  resultTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  safetyCircle: {
    width: 64, height: 64, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  safetyLbl: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  resultInfo: { flex: 1 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  resultSource: { fontSize: 14, fontWeight: '700', color: AquaColors.textDark, flex: 1 },
  resultDate: { fontSize: 11, color: AquaColors.gray },
  riskLine: { fontSize: 11, color: AquaColors.gray, marginTop: 2 },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  issueText: { fontSize: 11, flex: 1 },
  scoreBar: { height: 4, backgroundColor: AquaColors.primaryLight, borderRadius: 2 },
  scoreBarFill: { height: '100%', borderRadius: 2 },

  emptyCard: { padding: 40, alignItems: 'center', gap: 10, margin: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: AquaColors.textDark },
  emptySub: { fontSize: 13, color: AquaColors.gray, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: AquaColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.md, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
