import { TopBar } from '@/components/ui/TopBar';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing } from '@/constants/theme-constants';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/ApiService';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AlertsScreen() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await ApiService.getAlerts();
      if (!mountedRef.current) return;
      setAlerts(data.data || data || []);
    } catch {
      if (!mountedRef.current) return;
      setAlerts([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const handleAcknowledge = async (id: number) => {
    setActionLoading(id);
    try {
      await ApiService.acknowledgeAlert(id);
      loadAlerts();
    } catch (error: any) {
      console.error('Failed to acknowledge:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(id);
    try {
      await ApiService.resolveAlert(id);
      loadAlerts();
    } catch (error: any) {
      console.error('Failed to resolve:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
      case 'high': return { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' };
      case 'medium': return { bg: '#FEF9C3', text: '#CA8A04', dot: '#CA8A04' };
      default: return { bg: '#DBEAFE', text: '#1D4ED8', dot: '#1D4ED8' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={AquaColors.primary} />
        <Text style={{ marginTop: 16, color: AquaColors.gray }}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>{alerts.length} notification{alerts.length !== 1 ? 's' : ''}</Text>
        </View>

        {alerts.length === 0 ? (
          <AquaCard style={styles.emptyCard}>
            <IconSymbol name="checkmark.shield.fill" size={48} color={AquaColors.mint} />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySub}>No active alerts at this time</Text>
          </AquaCard>
        ) : (
          alerts.map((alert) => {
            const colors = getSeverityColor(alert.priority || alert.severity);
            return (
              <AquaCard key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertDot, { backgroundColor: colors.dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description || alert.message}</Text>
                    {alert.source_name && (
                      <Text style={styles.alertMeta}>Source: {alert.source_name}</Text>
                    )}
                    <Text style={styles.alertTime}>
                      {alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : alert.time}
                    </Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.severityText, { color: colors.text }]}>
                      {alert.priority || alert.severity}
                    </Text>
                  </View>
                </View>
                {alert.status !== 'resolved' && (
                  <View style={styles.alertActions}>
                    <AquaButton
                      title={actionLoading === alert.id ? '...' : 'Acknowledge'}
                      onPress={() => handleAcknowledge(alert.id)}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === alert.id}
                      style={styles.actionBtn}
                    />
                    <AquaButton
                      title={actionLoading === alert.id ? '...' : 'Resolve'}
                      onPress={() => handleResolve(alert.id)}
                      variant="primary"
                      size="sm"
                      disabled={actionLoading === alert.id}
                      style={styles.actionBtn}
                    />
                  </View>
                )}
              </AquaCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.md },
  title: { fontSize: 26, fontWeight: '700', color: AquaColors.textDark },
  subtitle: { fontSize: 14, color: AquaColors.gray, marginTop: 4 },
  alertCard: { marginHorizontal: Spacing.md, padding: Spacing.md, marginBottom: Spacing.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  alertDesc: { fontSize: 13, color: AquaColors.textSecondary, lineHeight: 19, marginBottom: 4 },
  alertMeta: { fontSize: 12, color: AquaColors.gray, marginBottom: 2 },
  alertTime: { fontSize: 11, color: AquaColors.gray },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  alertActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: AquaColors.borderLight },
  actionBtn: { flex: 1 },
  emptyCard: { marginHorizontal: Spacing.md, padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.textDark, marginTop: 8 },
  emptySub: { fontSize: 14, color: AquaColors.gray },
});
