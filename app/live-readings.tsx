import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import WiFiDeviceService, { WaterReadings } from '@/services/WiFiDeviceService';
import WaterQualityEngine from '@/services/WaterQualityEngine';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAUGE_SIZE = SCREEN_WIDTH * 0.28;

interface ParamConfig {
  key: keyof WaterReadings;
  label: string;
  unit: string;
  min: number;
  max: number;
  safeMin: number;
  safeMax: number;
  color: string;
  icon: string;
  decimals: number;
}

const PARAMETERS: ParamConfig[] = [
  { key: 'ph', label: 'pH Level', unit: '', min: 0, max: 14, safeMin: 6.5, safeMax: 8.5, color: '#00B4D8', icon: 'drop.fill', decimals: 1 },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 9999, safeMin: 0, safeMax: 600, color: '#02C39A', icon: 'circle.grid.3x3.fill', decimals: 0 },
  { key: 'ec', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 19990, safeMin: 0, safeMax: 1000, color: '#F4A261', icon: 'bolt.fill', decimals: 0 },
  { key: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 99, safeMin: 10, safeMax: 25, color: '#E63946', icon: 'thermometer.medium', decimals: 1 },
  { key: 'salinity', label: 'Salinity', unit: 'ppt', min: 0, max: 200, safeMin: 0, safeMax: 0.5, color: '#7C3AED', icon: 'sparkles', decimals: 1 },
];

function getQualitySummary(readings: WaterReadings) {
  const issues: string[] = [];
  if (readings.ph < 6.5) issues.push('pH too low (acidic)');
  if (readings.ph > 8.5) issues.push('pH too high (alkaline)');
  if (readings.tds > 600) issues.push('TDS elevated');
  if (readings.tds > 1000) issues.push('TDS very high');
  if (readings.ec > 1000) issues.push('Conductivity high');
  if (readings.temperature > 30) issues.push('Water too warm');

  if (issues.length === 0) return { level: 'Excellent', color: '#02C39A', issues };
  if (issues.length === 1) return { level: 'Good', color: '#00B4D8', issues };
  if (issues.length <= 3) return { level: 'Caution', color: '#F4A261', issues };
  return { level: 'Unsafe', color: '#E63946', issues };
}

export default function LiveReadingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [readings, setReadings] = useState<WaterReadings | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WaterReadings[]>([]);
  const historyRef = useRef<WaterReadings[]>([]);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const unsubStatus = WiFiDeviceService.addStatusListener((s) => {
      setConnected(s.connected);
      setError(s.lastError);
      if (s.lastReading) {
        setReadings(s.lastReading);
        historyRef.current = [...historyRef.current.slice(-49), s.lastReading];
        setHistory([...historyRef.current]);
      }
    });

    const unsubReadings = WiFiDeviceService.addReadingListener((r) => {
      setReadings(r);
      historyRef.current = [...historyRef.current.slice(-49), r];
      setHistory([...historyRef.current]);
    });

    WiFiDeviceService.loadConfig();

    return () => { unsubStatus(); unsubReadings(); WiFiDeviceService.stopPolling(); };
  }, []);

  const togglePolling = async () => {
    if (polling) {
      WiFiDeviceService.stopPolling();
      setPolling(false);
    } else {
      try {
        await WiFiDeviceService.fetchReading();
        setPolling(true);
        WiFiDeviceService.startPolling();
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const summary = readings ? getQualitySummary(readings) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { WiFiDeviceService.stopPolling(); router.back(); }}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#02C39A' : '#E63946' }]} />
          </View>
          <Text style={styles.title}>Live Water Readings</Text>
          <Text style={styles.subtitle}>
            {connected ? `Connected` : 'Not connected'}
          </Text>
          {error && (
            <View style={styles.errorRow}>
              <IconSymbol name="exclamationmark.triangle.fill" size={13} color="#E63946" />
              <Text style={styles.errorText}> {error}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {summary && (
            <AquaCard style={[styles.summaryCard, { borderLeftColor: summary.color, borderLeftWidth: 4 }]}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Water Quality</Text>
                  <Text style={[styles.summaryLevel, { color: summary.color }]}>{summary.level}</Text>
                </View>
                <Text style={styles.summaryTime}>
                  {new Date(readings!.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              {summary.issues.length > 0 && (
                <View style={styles.issuesContainer}>
                  {summary.issues.map((issue, i) => (
                    <Text key={i} style={styles.issueText}>• {issue}</Text>
                  ))}
                </View>
              )}
            </AquaCard>
          )}

          <View style={styles.gaugesGrid}>
            {PARAMETERS.map((param) => {
              const val = readings ? readings[param.key] : 0;
              const pct = Math.min(100, Math.max(0, ((val - param.min) / (param.max - param.min)) * 100));
              const safe = val >= param.safeMin && val <= param.safeMax;
              return (
                <AquaCard key={param.key} style={styles.gaugeCard}>
                  <View style={styles.gaugeOuter}>
                    <View style={[styles.gaugeFill, {
                      width: `${pct}%`,
                      backgroundColor: safe ? param.color : (val > param.safeMax ? '#F4A261' : '#E63946'),
                    }]} />
                  </View>
                  <Text style={styles.gaugeValue}>
                    {readings ? val.toFixed(param.decimals) : '--'}
                  </Text>
                  <Text style={styles.gaugeUnit}>{param.unit}</Text>
                  <Text style={styles.gaugeLabel}>{param.label}</Text>
                  <View style={styles.gaugeRangeRow}>
                    <IconSymbol name={safe ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'} size={10} color={safe ? '#02C39A' : '#E63946'} />
                    <Text style={[styles.gaugeRange, { color: safe ? '#02C39A' : '#E63946' }]}>
                      {safe ? ' Safe' : ' Alert'}
                    </Text>
                  </View>
                </AquaCard>
              );
            })}
          </View>

          <View style={styles.controlRow}>
            <AquaButton
              title={polling ? 'Stop' : 'Start Live'}
              icon={polling ? 'pause.fill' : 'play.fill'}
              onPress={togglePolling}
              variant={polling ? 'outline' : 'primary'}
              style={styles.controlBtn}
            />
            <AquaButton
              title="Configure"
              icon="gear"
              onPress={() => router.push('/device-config')}
              variant="secondary"
              style={styles.controlBtn}
            />
          </View>

          {history.length > 1 && (
            <AquaCard style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Recent History</Text>
              {history.slice(-10).reverse().map((r, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={styles.historyTime}>{new Date(r.timestamp).toLocaleTimeString()}</Text>
                  <Text style={styles.historyVal}>pH {r.ph.toFixed(1)}</Text>
                  <Text style={styles.historyVal}>TDS {r.tds.toFixed(0)}</Text>
                  <Text style={styles.historyVal}>{r.temperature.toFixed(1)}°C</Text>
                </View>
              ))}
            </AquaCard>
          )}

          {!connected && !readings && (
            <AquaCard style={styles.emptyCard}>
              <IconSymbol name="antenna.radiowaves.left.and.right" size={48} color={AquaColors.gray} />
              <Text style={styles.emptyTitle}>No Device Connected</Text>
              <Text style={styles.emptySub}>
                Pair your WIFI-9953W water tester to start monitoring water quality in real-time.
              </Text>
              <AquaButton title="Configure Manually" onPress={() => router.push('/device-config')} variant="primary" />
            </AquaCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: AquaColors.primary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  backText: { color: '#fff', fontSize: 16 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  errorText: { fontSize: 12, color: '#FEE2E2', marginLeft: 4 },
  content: { padding: Spacing.md },
  summaryCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: 12, color: AquaColors.gray, marginBottom: 2 },
  summaryLevel: { fontSize: 24, fontWeight: 'bold' },
  summaryTime: { fontSize: 12, color: AquaColors.gray },
  issuesContainer: { marginTop: Spacing.sm },
  issueText: { fontSize: 12, color: AquaColors.textSecondary, marginBottom: 2 },
  gaugesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  gaugeCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 20) / 3,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  gaugeOuter: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: AquaColors.primaryLight, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 3 },
  gaugeValue: { fontSize: 22, fontWeight: 'bold', color: AquaColors.textDark },
  gaugeUnit: { fontSize: 10, color: AquaColors.gray, marginTop: -2 },
  gaugeLabel: { fontSize: 10, color: AquaColors.gray, marginTop: 4, textAlign: 'center' },
  gaugeRangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  gaugeRange: { fontSize: 9, fontWeight: '600' },
  controlRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  controlBtn: { flex: 1 },
  historyCard: { padding: Spacing.md, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: AquaColors.textDark, marginBottom: Spacing.md },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,180,216,0.08)',
  },
  historyTime: { fontSize: 12, color: AquaColors.gray, width: 90 },
  historyVal: { fontSize: 12, fontWeight: '600', color: AquaColors.white, width: 70, textAlign: 'center' },
  emptyCard: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: AquaColors.white, marginTop: Spacing.sm },
  emptySub: { fontSize: 13, color: AquaColors.gray, textAlign: 'center', lineHeight: 20 },
});
