import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import CommunityMapService, { CommunityMapPoint, OutbreakAlert } from '@/services/CommunityMapService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function CommunityMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<CommunityMapPoint[]>([]);
  const [outbreaks, setOutbreaks] = useState<OutbreakAlert[]>([]);
  const [hasOutbreaks, setHasOutbreaks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'map' | 'reports' | 'alerts'>('map');

  const loadData = async () => {
    try {
      const [mapPoints, outbreakData] = await Promise.all([
        CommunityMapService.getMapPoints(),
        CommunityMapService.getOutbreakAlerts(),
      ]);
      setPoints(mapPoints);
      setOutbreaks(outbreakData.outbreaks);
      setHasOutbreaks(outbreakData.hasOutbreaks);
    } catch (e) {
      console.error('Error loading community data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={AquaColors.aquaDeep} />
        <Text style={styles.loadingText}>Loading community data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Community Water Safety Map</Text>
        <Text style={styles.subtitle}>Live water quality reports from your community</Text>
      </View>

      <View style={styles.tabBar}>
        {(['map', 'reports', 'alerts'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab === 'map' ? 'Map' : tab === 'reports' ? 'Reports' : 'Alerts'}
              {tab === 'alerts' && hasOutbreaks && (
                <IconSymbol name="circle.fill" size={8} color={AquaColors.error} />
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTab === 'map' && (
        <View style={styles.mapContainer}>
          <View style={styles.mapVisual}>
            <View style={styles.mapGrid}>
              <View style={[styles.mapLine, { top: '33%' }]} />
              <View style={[styles.mapLine, { top: '66%' }]} />
              <View style={[styles.mapLineV, { left: '25%' }]} />
              <View style={[styles.mapLineV, { left: '50%' }]} />
              <View style={[styles.mapLineV, { left: '75%' }]} />
            </View>
            {points.map((point) => (
              <View
                key={point.id}
                style={[
                  styles.mapDot,
                  {
                    backgroundColor: point.safetyColor,
                    left: `${((point.longitude - 11.47) / 0.08) * 100}%`,
                    top: `${((3.89 - point.latitude) / 0.06) * 100}%`,
                  },
                ]}
              />
            ))}
            <View style={styles.mapLabelOverlay}>
              <Text style={styles.mapLabelText}>Yaounde Water Safety Map</Text>
              <Text style={styles.mapLabelSub}>{points.length} community reports</Text>
            </View>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#02C39A' }]} />
              <Text style={styles.legendText}>Safe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F4A261' }]} />
              <Text style={styles.legendText}>Caution</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E63946' }]} />
              <Text style={styles.legendText}>Unsafe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7C0000' }]} />
              <Text style={styles.legendText}>Dangerous</Text>
            </View>
          </View>

          <AquaCard style={styles.statsCard}>
            <Text style={styles.statsTitle}>Community Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{points.length}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#02C39A' }]}>{points.filter(p => p.safetyLevel === 'safe').length}</Text>
                <Text style={styles.statLabel}>Safe Sources</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#E63946' }]}>{points.filter(p => p.safetyLevel === 'unsafe' || p.safetyLevel === 'dangerous').length}</Text>
                <Text style={styles.statLabel}>Unsafe</Text>
              </View>
            </View>
          </AquaCard>

          <AquaCard style={styles.bannerCard}>
            <Text style={styles.bannerTitle}>Your Reports Build Our Network</Text>
            <Text style={styles.bannerText}>
              Every test you submit contributes to Africa's first community-powered water safety intelligence layer. Your data helps protect your neighbors.
            </Text>
          </AquaCard>
        </View>
      )}

      {selectedTab === 'reports' && (
        <View style={styles.reportsList}>
          {points.map((point) => (
            <AquaCard key={point.id} style={styles.reportItem}>
              <View style={styles.reportContent}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportSource}>{point.sourceName}</Text>
                  <Text style={styles.reportMeta}>{point.sourceType} · {point.location}</Text>
                  <Text style={styles.reportTime}>{point.reportedAt}</Text>
                </View>
                <View style={[styles.reportScore, { backgroundColor: point.safetyColor + '20' }]}>
                  <Text style={[styles.reportScoreNum, { color: point.safetyColor }]}>{point.safetyScore}%</Text>
                  <Text style={[styles.reportScoreLabel, { color: point.safetyColor }]}>
                    {CommunityMapService.getSafetyLabel(point.safetyLevel)}
                  </Text>
                </View>
              </View>
            </AquaCard>
          ))}
          {points.length === 0 && (
            <AquaCard style={styles.emptyCard}>
              <IconSymbol name="map.fill" size={40} color={AquaColors.aquaMedium} />
              <Text style={styles.emptyText}>No community reports yet</Text>
              <Text style={styles.emptySubtext}>Be the first to contribute to your community's water safety map</Text>
            </AquaCard>
          )}
        </View>
      )}

      {selectedTab === 'alerts' && (
        <View style={styles.alertsList}>
          {hasOutbreaks && outbreaks.length > 0 ? (
            <>
              <AquaCard style={styles.outbreakBanner}>
                <IconSymbol name="exclamationmark.shield.fill" size={32} color="#E63946" />
                <Text style={styles.outbreakTitle}>Outbreak Alert Active</Text>
                <Text style={styles.outbreakText}>
                  {outbreaks.length} location{outbreaks.length > 1 ? 's' : ''} flagged for potential water contamination outbreak
                </Text>
              </AquaCard>
              {outbreaks.map((alert) => (
                <AquaCard key={alert.alertId} style={styles.alertItem}>
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertBadge, { backgroundColor: alert.riskLevel === 'critical' ? '#E63946' : '#F4A261' }]}>
                      <Text style={styles.alertBadgeText}>{alert.riskLevel.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.alertId}>{alert.alertId}</Text>
                  </View>
                  <Text style={styles.alertLocation}>{alert.location}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <View style={styles.alertStats}>
                    <Text style={styles.alertStatText}>{alert.reportCount} reports</Text>
                    <Text style={styles.alertStatText}>Avg Score: {alert.averageSafetyScore}</Text>
                  </View>
                </AquaCard>
              ))}
            </>
          ) : (
            <AquaCard style={styles.emptyCard}>
              <IconSymbol name="checkmark.shield.fill" size={40} color={AquaColors.success} />
              <Text style={styles.emptyText}>No Active Outbreaks</Text>
              <Text style={styles.emptySubtext}>Your community's water sources are not currently showing outbreak patterns</Text>
            </AquaCard>
          )}

          <AquaInfoCard />
        </View>
      )}

      <View style={styles.actions}>
        <AquaButton
          title="Submit Community Report"
          onPress={() => router.push('/(tabs)/analyze')}
          variant="primary"
          style={styles.actionBtn}
        />
        <AquaButton
          title="Contact Water Clinic"
          onPress={() => router.push('/contact-clinic')}
          variant="outline"
          style={styles.actionBtn}
        />
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
    </SafeAreaView>
  );
}

function AquaInfoCard() {
  return (
    <AquaCard style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: AquaColors.textDark, marginBottom: Spacing.sm }}>
        About Community Water Safety
      </Text>
      <Text style={{ fontSize: 14, color: AquaColors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm }}>
        The community water safety map is built from real reports submitted by households, field workers, and schools across the region.
      </Text>
      <Text style={{ fontSize: 13, color: AquaColors.aquaMedium }}>
        Government and utility partners get early warning alerts when multiple reports flag the same source.
      </Text>
    </AquaCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: AquaColors.textSecondary },
  header: { padding: Spacing.md, paddingBottom: 0 },
  title: { fontSize: 24, fontWeight: 'bold', color: AquaColors.textDark, marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, color: AquaColors.textSecondary },
  tabBar: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: AquaColors.white, borderWidth: 1, borderColor: AquaColors.border },
  tabActive: { backgroundColor: AquaColors.primary, borderColor: AquaColors.primary },
  tabText: { fontSize: 13, color: AquaColors.gray, fontWeight: '600' },
  tabTextActive: { color: AquaColors.surface },
  mapContainer: { padding: Spacing.md },
  mapVisual: {
    width: '100%', height: 240, borderRadius: BorderRadius.lg,
    backgroundColor: '#0A2030', position: 'relative', overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapGrid: { position: 'absolute', width: '100%', height: '100%' },
  mapLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(0,180,216,0.1)' },
  mapLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(0,180,216,0.1)' },
  mapDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  mapLabelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm,
  },
  mapLabelText: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  mapLabelSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: AquaColors.textSecondary },
  statsCard: { padding: Spacing.md, marginBottom: Spacing.md },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: AquaColors.textDark, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: AquaColors.primary },
  statLabel: { fontSize: 11, color: AquaColors.textSecondary, marginTop: 2 },
  bannerCard: { padding: Spacing.md, marginBottom: Spacing.md, backgroundColor: AquaColors.primaryLight },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: AquaColors.textDark, marginBottom: Spacing.sm },
  bannerText: { fontSize: 13, color: AquaColors.textSecondary, lineHeight: 20 },
  reportsList: { padding: Spacing.md },
  reportItem: { marginBottom: Spacing.sm, padding: Spacing.md },
  reportContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportInfo: { flex: 1 },
  reportSource: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark, marginBottom: 2 },
  reportMeta: { fontSize: 11, color: AquaColors.textSecondary, marginBottom: 2 },
  reportTime: { fontSize: 10, color: AquaColors.primary },
  reportScore: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center', minWidth: 70 },
  reportScoreNum: { fontSize: 18, fontWeight: 'bold' },
  reportScoreLabel: { fontSize: 9, fontWeight: '600' },
  emptyCard: { padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: AquaColors.textDark, marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptySubtext: { fontSize: 13, color: AquaColors.textSecondary, textAlign: 'center' },
  alertsList: { padding: Spacing.md },
  outbreakBanner: { padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md, backgroundColor: 'rgba(230,57,70,0.1)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.3)' },
  outbreakTitle: { fontSize: 16, fontWeight: 'bold', color: '#E63946', marginTop: Spacing.sm, marginBottom: Spacing.xs },
  outbreakText: { fontSize: 13, color: '#f87171', textAlign: 'center' },
  alertItem: { marginBottom: Spacing.sm, padding: Spacing.md },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  alertBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  alertId: { fontSize: 12, color: AquaColors.textSecondary },
  alertLocation: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark, marginBottom: Spacing.xs },
  alertMessage: { fontSize: 13, color: AquaColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  alertStats: { flexDirection: 'row', gap: Spacing.md },
  alertStatText: { fontSize: 11, color: AquaColors.aquaMedium },
  actions: { padding: Spacing.md, gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
