import { AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListSkeleton } from '@/components/SkeletonLoader';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import CommunityMapService, { CommunityMapPoint, OutbreakAlert } from '@/services/CommunityMapService';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<CommunityMapPoint[]>([]);
  const [outbreaks, setOutbreaks] = useState<OutbreakAlert[]>([]);
  const [hasOutbreaks, setHasOutbreaks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'map' | 'reports' | 'alerts'>('map');

  const load = useCallback(async () => {
    try {
      const [pts, od] = await Promise.all([CommunityMapService.getMapPoints(), CommunityMapService.getOutbreakAlerts()]);
      setPoints(pts); setOutbreaks(od.outbreaks); setHasOutbreaks(od.hasOutbreaks);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Community Water Map</Text>
      </View>
      <ListSkeleton count={4} />
    </View>
  );

  const safeCount = points.filter(p => p.safetyLevel === 'safe').length;
  const unsafeCount = points.filter(p => p.safetyLevel === 'unsafe' || p.safetyLevel === 'dangerous').length;

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={AquaColors.primary} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Community Water Map</Text>
        <Text style={styles.subtitle}>Live safety reports from your community</Text>
      </View>

      <View style={styles.tabRow}>
        {(['map', 'reports', 'alerts'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'map' ? 'Map' : t === 'reports' ? 'Reports' : 'Alerts'}
              {t === 'alerts' && hasOutbreaks && ' 🔴'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'map' && (
        <View style={styles.section}>
          <View style={styles.mapVisual}>
            {points.map((p) => (
              <View key={p.id} style={[styles.mapDot, {
                backgroundColor: p.safetyColor,
                left: `${((p.longitude - 11.47) / 0.08) * 100}%`,
                top: `${((3.89 - p.latitude) / 0.06) * 100}%`,
              }]} />
            ))}
            <View style={styles.mapOverlay}>
              <Text style={styles.mapTitle}>Yaounde Water Safety Map</Text>
              <Text style={styles.mapSub}>{points.length} reports</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <Dot color="#02C39A" label="Safe" />
            <Dot color="#F4A261" label="Caution" />
            <Dot color="#E63946" label="Unsafe" />
            <Dot color="#7C0000" label="Dangerous" />
          </View>

          <AquaCard style={styles.cardBox}>
            <View style={styles.statRow}>
              <View style={styles.statBox}><Text style={styles.statNum}>{points.length}</Text><Text style={styles.statLbl}>Reports</Text></View>
              <View style={styles.statBox}><Text style={[styles.statNum, { color: '#02C39A' }]}>{safeCount}</Text><Text style={styles.statLbl}>Safe</Text></View>
              <View style={styles.statBox}><Text style={[styles.statNum, { color: '#E63946' }]}>{unsafeCount}</Text><Text style={styles.statLbl}>Unsafe</Text></View>
            </View>
          </AquaCard>
        </View>
      )}

      {tab === 'reports' && (
        <View style={styles.section}>
          {points.length === 0 ? (
              <AquaCard style={styles.cardBox}>
                <Text style={{ textAlign: 'center', fontSize: 15, color: AquaColors.gray }}>No community reports yet</Text>
              </AquaCard>
          ) : (
            points.map((p) => (
              <AquaCard key={p.id} style={styles.reportItem}>
                <View style={styles.reportRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportName}>{p.sourceName}</Text>
                    <Text style={styles.reportMeta}>{p.sourceType} · {p.location} · {p.reportedAt}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: p.safetyColor + '22' }]}>
                    <Text style={[styles.scoreBadgeNum, { color: p.safetyColor }]}>{p.safetyScore}%</Text>
                    <Text style={[styles.scoreBadgeLbl, { color: p.safetyColor }]}>
                      {CommunityMapService.getSafetyLabel(p.safetyLevel)}
                    </Text>
                  </View>
                </View>
              </AquaCard>
            ))
          )}
        </View>
      )}

      {tab === 'alerts' && (
        <View style={styles.section}>
          {hasOutbreaks ? (
            <>
              <AquaCard style={styles.outbreakBanner}>
                <IconSymbol name="exclamationmark.shield.fill" size={28} color="#E63946" />
                <Text style={styles.outbreakTitle}>Outbreak Alert Active</Text>
                <Text style={styles.outbreakDesc}>{outbreaks.length} locations flagged</Text>
              </AquaCard>
              {outbreaks.map((a) => (
                <AquaCard key={a.alertId} style={styles.cardBox}>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <View style={[styles.alertBadge, { backgroundColor: a.riskLevel === 'critical' ? '#E63946' : '#F4A261' }]}>
                        <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>{a.riskLevel.toUpperCase()}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: AquaColors.gray }}>{a.alertId}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: AquaColors.white }}>{a.location}</Text>
                    <Text style={{ fontSize: 12, color: AquaColors.gray, marginTop: 4 }}>{a.message}</Text>
                </AquaCard>
              ))}
            </>
          ) : (
            <AquaCard style={styles.cardBox}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <IconSymbol name="checkmark.shield.fill" size={36} color={AquaColors.mint} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: AquaColors.white }}>No Active Outbreaks</Text>
                <Text style={{ fontSize: 12, color: AquaColors.gray, textAlign: 'center' }}>Your community's water sources are safe</Text>
              </View>
            </AquaCard>
          )}
        </View>
      )}

      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.lg, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: AquaColors.textDark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: AquaColors.gray },
  tabRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: AquaColors.white, borderWidth: 1, borderColor: AquaColors.border },
  tabActive: { backgroundColor: AquaColors.primary, borderColor: AquaColors.primary },
  tabTxt: { fontSize: 13, color: AquaColors.gray, fontWeight: '600' },
  tabTxtActive: { color: '#fff' },
  section: { padding: Spacing.md },
  mapVisual: {
    height: 240, borderRadius: BorderRadius.lg, backgroundColor: '#0A2030',
    position: 'relative', overflow: 'hidden', marginBottom: Spacing.sm,
  },
  mapDot: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  mapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', padding: Spacing.sm,
  },
  mapTitle: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
  mapSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: AquaColors.gray },
  cardBox: { marginBottom: Spacing.sm, padding: Spacing.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: AquaColors.primary },
  statLbl: { fontSize: 10, color: AquaColors.gray, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  reportItem: { marginBottom: Spacing.sm, padding: Spacing.md },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportName: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark, marginBottom: 2 },
  reportMeta: { fontSize: 11, color: AquaColors.gray },
  scoreBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 8, borderRadius: 10, alignItems: 'center', minWidth: 66 },
  scoreBadgeNum: { fontSize: 16, fontWeight: '700' },
  scoreBadgeLbl: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  outbreakBanner: { padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm, backgroundColor: 'rgba(230,57,70,0.06)', borderColor: 'rgba(230,57,70,0.2)', borderWidth: 1 },
  outbreakTitle: { fontSize: 15, fontWeight: '700', color: '#E63946', marginTop: 8 },
  outbreakDesc: { fontSize: 12, color: '#f87171', marginTop: 2 },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
