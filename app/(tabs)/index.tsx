import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { AlertsHeader } from '@/components/ui/AlertsHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import { useAuth } from '@/contexts/AuthContext';
import WaterDataService, { WaterAnalysis } from '@/services/WaterDataService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - Spacing.md * 2 - 12) / 2;

function greeting(t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 5) return t('dashboard.greetingEvening');
  if (h < 12) return t('dashboard.greetingMorning');
  if (h < 17) return t('dashboard.greetingAfternoon');
  return t('dashboard.greetingEvening');
}

function fmtDate(d: string | undefined, t: (k: string) => string): string {
  if (!d) return '—';
  try {
    const p = new Date(d), now = new Date();
    const tm = p.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (p.toDateString() === now.toDateString()) return `${tm}`;
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (p.toDateString() === y.toDateString()) return `${tm}`;
    return p.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return d; }
}

function safetyInfo(level: string | undefined, risk: number | undefined, t: (k: string) => string) {
  const l = level ?? (risk != null ? (risk <= 25 ? 'SAFE' : risk <= 50 ? 'CAUTION' : risk <= 75 ? 'UNSAFE' : 'DANGEROUS') : null);
  const map: Record<string, { text: string; color: string; icon: any; bg: string }> = {
    SAFE:      { text: t('dashboard.safeToDrink'),     color: AquaColors.mint,       icon: 'checkmark.shield.fill',   bg: '#ECFDF5' },
    CAUTION:   { text: t('dashboard.drinkWithCaution'),color: AquaColors.gold,       icon: 'exclamationmark.triangle.fill', bg: '#FFF7ED' },
    UNSAFE:    { text: t('dashboard.notSafe'),          color: AquaColors.red,        icon: 'xmark.circle.fill',       bg: '#FEF2F2' },
    DANGEROUS: { text: t('dashboard.dangerous'),         color: AquaColors.dangerDeep, icon: 'xmark.octagon.fill',      bg: '#FFF1F2' },
  };
  return map[l ?? ''] ?? { text: t('dashboard.unknown'), color: AquaColors.gray, icon: 'questionmark.circle', bg: '#F8FAFC' };
}

function ActionBtn({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '14' }]}>
        <IconSymbol name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<{ totalSources: number; activeSources: number; totalAnalyses: number; averageRiskScore: number; recentAnalyses: WaterAnalysis[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await WaterDataService.getDashboardStats();
      setStats(s);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Always refresh when the screen comes into focus
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const last = stats?.recentAnalyses?.[0] ?? null;
  const v = last ? safetyInfo(last.safety_level, last.risk_score, t) : null;

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <Image source={require('@/assets/images/water_cliniq.png')} style={{ width: 90, height: 90 }} resizeMode="contain" />
        <ActivityIndicator size="large" color={AquaColors.primary} style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 12, fontSize: 15, color: AquaColors.gray, fontWeight: '600' }}>{t('dashboard.loadingIndicator')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={AquaColors.primary} />}
      >
        {/* Topbar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <LanguageSwitcher />
          <AlertsHeader alertCount={0} />
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting(t)},</Text>
          <Text style={styles.userName}>{user?.name ?? t('common.welcome')}</Text>
          <View style={styles.headerBadges}>
            <View style={styles.badge}>
              <IconSymbol name="checkmark.shield.fill" size={12} color={AquaColors.mint} />
              <Text style={styles.badgeText}>{t('dashboard.whoStandards')}</Text>
            </View>
            <View style={styles.badge}>
              <IconSymbol name="cloud.fill" size={12} color={AquaColors.primary} />
              <Text style={styles.badgeText}>{t('dashboard.cloudSynced')}</Text>
            </View>
          </View>
        </View>

        {/* Hero CTA */}
        <TouchableOpacity style={styles.heroCta} activeOpacity={0.9} onPress={() => router.push('/new-water-test' as any)}>
          <IconSymbol name="camera.fill" size={24} color="#fff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroCtaTitle}>{t('dashboard.testYourWaterNow')}</Text>
            <Text style={styles.heroCtaSub}>{t('dashboard.tapToPhoto')}</Text>
          </View>
          <IconSymbol name="arrow.right" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Last analysis result */}
        {last && v && (
          <TouchableOpacity
            style={[styles.lastTestCard, { backgroundColor: v.bg, borderColor: v.color + '40' }]}
            onPress={() => router.push(`/analysis-result?id=${last.id}` as any)}
            activeOpacity={0.9}
          >
            <Text style={styles.lastTestLabel}>{t('dashboard.lastAnalysis')} · {fmtDate(last.created_at, t)}</Text>
            <View style={styles.lastTestMain}>
              {/* Safety level badge — primary focus */}
              <View style={[styles.safetyBadgeCircle, { backgroundColor: v.color + '18', borderColor: v.color }]}>
                <IconSymbol name={v.icon} size={28} color={v.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.verdictText, { color: v.color }]}>{v.text}</Text>
                <Text style={styles.lastTestSrc}>
                  {last.water_source?.name ?? last.source_type ?? t('dashboard.unknownSource')}
                </Text>
                <View style={styles.riskRow}>
                  <Text style={styles.riskLabel}>Risk score: </Text>
                  <Text style={[styles.riskValue, { color: v.color }]}>{last.risk_score ?? '—'}/100</Text>
                </View>
                {last.admin_recommendation && (
                  <Text style={styles.adminRecBadge}>💬 {t('dashboard.adminRecAvailable')}</Text>
                )}
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}
                  onPress={() => router.push(`/analysis-result?id=${last.id}` as any)}>
                  <Text style={styles.viewDetailText}>{t('dashboard.viewFullResults')}</Text>
                  <IconSymbol name="chevron.right" size={12} color={AquaColors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>{t('dashboard.howToTest')}</Text>
        <View style={styles.actionsGrid}>
          <ActionBtn icon="camera.fill" label={t('dashboard.takePhoto')} color={AquaColors.primary}
            onPress={() => router.push('/new-water-test' as any)} />
          <ActionBtn icon="wrench.fill" label={t('dashboard.checkLeaks')} color={AquaColors.gold}
            onPress={() => router.push('/leakage-detection')} />
          <ActionBtn icon="clipboard.fill" label={t('analyze.answerQuestions')} color={AquaColors.mint}
            onPress={() => router.push('/new-water-test' as any)} />
          <ActionBtn icon="chart.bar.fill" label={t('dashboard.myHistory')} color={AquaColors.secondary}
            onPress={() => router.push('/(tabs)/results' as any)} />
        </View>

        {/* Stats */}
        {stats && (
          <AquaCard style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{stats.totalAnalyses}</Text>
                <Text style={styles.statLbl}>{t('dashboard.tests')}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{stats.totalSources}</Text>
                <Text style={styles.statLbl}>{t('dashboard.totalSources')}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: stats.averageRiskScore <= 25 ? AquaColors.mint : stats.averageRiskScore <= 50 ? AquaColors.gold : AquaColors.red }]}>
                  {stats.averageRiskScore}
                </Text>
                <Text style={styles.statLbl}>{t('dashboard.avgRisk')}</Text>
              </View>
            </View>
          </AquaCard>
        )}

        {/* Recent analyses */}
        {(stats?.recentAnalyses?.length ?? 0) > 1 && (
          <AquaCard style={styles.recentCard}>
            <Text style={styles.recentTitle}>{t('dashboard.recentTests')}</Text>
            {stats!.recentAnalyses.slice(1, 5).map(a => {
              const vi = safetyInfo(a.safety_level, a.risk_score, t);
              return (
                <TouchableOpacity key={a.id} style={styles.recentItem}
                  onPress={() => router.push(`/analysis-result?id=${a.id}` as any)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentDate}>{fmtDate(a.created_at, t)}</Text>
                    <Text style={styles.recentSrc}>{a.water_source?.name ?? a.source_type ?? '—'}</Text>
                  </View>
                  <View style={[styles.recentBadge, { backgroundColor: vi.color + '18', borderColor: vi.color + '40', borderWidth: 1 }]}>
                    <IconSymbol name={vi.icon} size={12} color={vi.color} />
                    <Text style={[styles.recentSafetyLbl, { color: vi.color }]}>
                      {a.safety_level ?? '—'}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={AquaColors.gray} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              );
            })}
          </AquaCard>
        )}

        {/* Empty state */}
        {stats?.totalAnalyses === 0 && (
          <AquaCard style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Image source={require('@/assets/images/water_cliniq.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
            </View>
            <Text style={styles.emptyTitle}>{t('dashboard.noTestsYet')}</Text>
            <Text style={styles.emptySub}>{t('dashboard.noTestsDesc')}</Text>
            <AquaButton title={t('dashboard.testYourWater')} icon="camera.fill" onPress={() => router.push('/new-water-test' as any)} variant="primary" />
          </AquaCard>
        )}

        {/* Tips */}
        <AquaCard style={styles.tipsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <IconSymbol name="lightbulb.fill" size={18} color={AquaColors.gold} />
            <Text style={styles.tipsTitle}> {t('dashboard.safetyTips')}</Text>
          </View>
          {[
            t('dashboard.tip1'),
            t('dashboard.tip2'),
            t('dashboard.tip3'),
            t('dashboard.tip4'),
          ].map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AquaColors.primary, marginTop: 7 }} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </AquaCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: 8, gap: Platform.OS === 'android' ? 12 : 8 },
  greetingSection: { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
  greeting: { fontSize: 14, color: AquaColors.textSecondary, marginBottom: 2 },
  userName: { fontSize: 26, fontWeight: '700', color: AquaColors.textDark },
  headerBadges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: AquaColors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, color: AquaColors.primary, fontWeight: '600' },
  heroCta: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.md, backgroundColor: AquaColors.primaryDark, borderRadius: BorderRadius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', shadowColor: AquaColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  heroCtaTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  lastTestCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1 },
  lastTestLabel: { fontSize: 9, color: AquaColors.gray, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  lastTestMain: { flexDirection: 'row', alignItems: 'center' },
  safetyBadgeCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  verdictText: { fontSize: 18, fontWeight: '800', color: AquaColors.textDark, marginBottom: 2 },
  lastTestSrc: { fontSize: 13, color: AquaColors.textSecondary, marginTop: 2 },
  riskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  riskLabel: { fontSize: 11, color: AquaColors.gray },
  riskValue: { fontSize: 11, fontWeight: '700' },
  adminRecBadge: { fontSize: 11, color: '#7C3AED', fontWeight: '600', marginTop: 4 },
  viewDetailText: { fontSize: 13, color: AquaColors.primary, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: AquaColors.gray, letterSpacing: 1.5, marginHorizontal: Spacing.md, marginBottom: 10, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: 12, marginBottom: Spacing.md },
  actionBtn: { width: CARD_W, paddingVertical: 18, backgroundColor: AquaColors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AquaColors.border, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: AquaColors.textDark, textAlign: 'center' },
  statsCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: Spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '700', color: AquaColors.primary },
  statLbl: { fontSize: 10, color: AquaColors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, height: 32, backgroundColor: AquaColors.border },
  recentCard: { marginHorizontal: Spacing.md, padding: Spacing.md, marginBottom: Spacing.md },
  recentTitle: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark, marginBottom: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AquaColors.borderLight },
  recentDate: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark },
  recentSrc: { fontSize: 11, color: AquaColors.gray, marginTop: 2 },
  recentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  recentSafetyLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  emptyCard: { marginHorizontal: Spacing.md, padding: 40, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: AquaColors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.textDark },
  emptySub: { fontSize: 14, color: AquaColors.gray, textAlign: 'center', lineHeight: 20 },
  tipsCard: { marginHorizontal: Spacing.md, padding: Spacing.md, marginBottom: Spacing.md },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark },
  tipText: { fontSize: 13, color: AquaColors.textSecondary, lineHeight: 20, flex: 1 },
});
