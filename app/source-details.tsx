import { ThemedText } from '@/components/themed-text';
import { AquaBadge, AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing } from '@/constants/theme-constants';
import ApiService from '@/services/ApiService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SourceDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [source, setSource] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSource = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const [sourceData, analysesData] = await Promise.all([
        ApiService.getWaterSource(Number(id)),
        ApiService.getWaterAnalysesBySource(Number(id)).catch(() => null),
      ]);
      setSource(sourceData);
      setAnalyses(analysesData?.data ?? []);
    } catch (error) {
      console.error('Failed to load source:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadSource(); }, [loadSource]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={AquaColors.primary} />
      </SafeAreaView>
    );
  }

  if (!source) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
        <Text style={{ color: AquaColors.gray, fontSize: 16 }}>Source not found</Text>
        <AquaButton title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}>
        <View style={styles.content}>
          <AquaCard style={styles.headerCard}>
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <ThemedText style={styles.sourceName}>{source.name}</ThemedText>
                <View style={styles.locationRow}>
                  <IconSymbol name="location.fill" size={16} color={AquaColors.secondary} />
                  <ThemedText style={styles.location}>{source.location || 'No location'}</ThemedText>
                </View>
              </View>
              <AquaBadge text={(source.status || 'active').toUpperCase()} variant="safe" />
            </View>
          </AquaCard>

          <AquaCard style={styles.detailsCard}>
            <ThemedText style={styles.sectionTitle}>Source Information</ThemedText>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Type</ThemedText>
              <ThemedText style={styles.detailValue}>{source.source_type || 'Unknown'}</ThemedText>
            </View>
            {source.population_served && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Population Served</ThemedText>
                <ThemedText style={styles.detailValue}>{source.population_served.toLocaleString()}</ThemedText>
              </View>
            )}
            {source.quality_classification && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Quality</ThemedText>
                <AquaBadge text={source.quality_classification} variant="safe" />
              </View>
            )}
            {source.current_risk_score !== undefined && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Risk Score</ThemedText>
                <ThemedText style={[styles.detailValue, { color: source.current_risk_score > 60 ? AquaColors.red : AquaColors.mint }]}>
                  {source.current_risk_score}/100
                </ThemedText>
              </View>
            )}
            {source.description && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Description</ThemedText>
                <ThemedText style={styles.detailValue}>{source.description}</ThemedText>
              </View>
            )}
          </AquaCard>

          {source.recent_readings?.length > 0 && (
            <AquaCard style={styles.readingsCard}>
              <ThemedText style={styles.sectionTitle}>Recent Readings</ThemedText>
              {source.recent_readings.map((reading: any, index: number) => (
                <View key={index} style={styles.readingItem}>
                  <View style={styles.readingHeader}>
                    <ThemedText style={styles.readingDate}>
                      {reading.reading_time ? new Date(reading.reading_time).toLocaleString() : ''}
                    </ThemedText>
                    <AquaBadge text={reading.quality_classification || 'Unknown'} variant="safe" />
                  </View>
                  <View style={styles.readingDetails}>
                    {reading.ph !== null && <ThemedText style={styles.readingDetail}>pH: {reading.ph}</ThemedText>}
                    <ThemedText style={styles.readingDetail}>Score: {reading.risk_score || 0}/100</ThemedText>
                  </View>
                </View>
              ))}
            </AquaCard>
          )}

          {analyses.length > 0 && (
            <AquaCard style={styles.readingsCard}>
              <ThemedText style={styles.sectionTitle}>AI Analyses</ThemedText>
              {analyses.map((a: any, i: number) => (
                <View key={i} style={styles.readingItem}>
                  <View style={styles.readingHeader}>
                    <ThemedText style={styles.readingDate}>
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </ThemedText>
                    <AquaBadge text={a.safety_level || 'Unknown'} variant="safe" />
                  </View>
                  <View style={styles.readingDetails}>
                    <ThemedText style={styles.readingDetail}>Risk: {a.risk_score ?? '?'}/100</ThemedText>
                    <ThemedText style={styles.readingDetail}>Model: {a.ai_model || '?'}</ThemedText>
                  </View>
                </View>
              ))}
            </AquaCard>
          )}

          <View style={styles.actionButtons}>
            <AquaButton title="New Reading" variant="primary"
              onPress={() => router.push('/new-reading')} style={styles.actionButton} />
            <AquaButton title="AI Analysis" variant="secondary"
              onPress={() => router.push(`/water-cliniq-analysis?water_source_id=${id}`)} style={styles.actionButton} />
          </View>
          <AquaButton title="Back" variant="outline" onPress={() => router.back()} style={styles.backButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md },
  headerCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerInfo: { flex: 1 },
  sourceName: { fontSize: 22, fontWeight: '700', color: AquaColors.textDark, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  location: { fontSize: 14, color: AquaColors.textSecondary, marginLeft: 4 },
  detailsCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark, marginBottom: Spacing.md },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: AquaColors.borderLight,
  },
  detailLabel: { fontSize: 14, color: AquaColors.gray },
  detailValue: { fontSize: 14, color: AquaColors.textDark, fontWeight: '600' },
  readingsCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  readingItem: {
    backgroundColor: AquaColors.bgAccent, padding: Spacing.md,
    borderRadius: 8, marginBottom: Spacing.sm,
  },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  readingDate: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark },
  readingDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  readingDetail: { fontSize: 13, color: AquaColors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  actionButton: { flex: 1 },
  backButton: { marginBottom: Spacing.xl },
});
