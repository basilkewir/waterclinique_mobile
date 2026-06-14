import { AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import WaterDataService, { WaterSource } from '@/services/WaterDataService';
import { ListSkeleton } from '@/components/SkeletonLoader';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, memo } from 'react';
import {
  Alert, Modal, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SOURCE_TYPES = [
  { key: 'tap',      label: 'Tap / Municipal',  icon: 'drop.fill',                  color: '#0077B6' },
  { key: 'borehole', label: 'Borehole',          icon: 'arrow.down.to.line',         color: '#5B21B6' },
  { key: 'well',     label: 'Open Well',         icon: 'circle.dotted',              color: '#92400E' },
  { key: 'river',    label: 'River / Stream',    icon: 'wind',                       color: '#065F46' },
  { key: 'spring',   label: 'Spring',            icon: 'sparkles',                   color: '#0E7490' },
  { key: 'rain',     label: 'Rainwater',         icon: 'cloud.rain.fill',            color: '#1D4ED8' },
  { key: 'bottled',  label: 'Bottled',           icon: 'checkmark.seal.fill',        color: '#059669' },
  { key: 'tank',     label: 'Storage Tank',      icon: 'square.stack.3d.up.fill',    color: '#7C3AED' },
] as const;

function typeInfo(key: string) {
  return SOURCE_TYPES.find(t => t.key === key) ?? SOURCE_TYPES[0];
}

function drinkabilityStyle(status?: string): { bg: string; text: string; label: string } {
  if (!status) return { bg: '#F3F4F6', text: '#6B7280', label: 'Not tested' };
  const s = status.toLowerCase();
  if (s.includes('safe to drink'))      return { bg: '#DCFCE7', text: '#15803D', label: 'Safe to drink' };
  if (s.includes('without boiling'))    return { bg: '#FEF9C3', text: '#A16207', label: 'Boil before drinking' };
  if (s.includes('not safe'))           return { bg: '#FEE2E2', text: '#B91C1C', label: 'Not safe to drink' };
  if (s.includes('dangerous'))          return { bg: '#7F1D1D', text: '#FEF2F2', label: 'DANGEROUS' };
  return { bg: '#FEF3C7', text: '#92400E', label: status };
}

function riskColor(score?: number): string {
  if (score == null) return AquaColors.gray;
  if (score <= 25) return '#16a34a';
  if (score <= 50) return '#ca8a04';
  if (score <= 75) return '#ea580c';
  return '#dc2626';
}

export default function SourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', source_type: 'tap' });
  const [error, setError] = useState('');

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(AquaColors.primary);
    return () => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    };
  }, []);

  // Keep OS status bar light-on-dark while this screen is mounted
  React.useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(AquaColors.primary);
    return () => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await WaterDataService.getSources();
      setSources(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load sources');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter a source name.'); return; }
    setSaving(true);
    try {
      await WaterDataService.createSource({
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        source_type: form.source_type,
      });
      setForm({ name: '', location: '', source_type: 'tap' });
      setShowAdd(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save source. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (source: WaterSource) => {
    Alert.alert('Delete Source', `Remove "${source.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await WaterDataService.deleteSource(source.id);
            load();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Delete failed.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={AquaColors.primary} />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View>
            <Text style={styles.headerTitle}>Water Sources</Text>
          </View>
        </View>
        <ListSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={AquaColors.primary} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Water Sources</Text>
          <Text style={styles.headerSub}>{sources.length} source{sources.length !== 1 ? 's' : ''} registered</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <IconSymbol name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={AquaColors.primary} />
        }
      >
        {sources.length === 0 ? (
          <AquaCard style={styles.emptyCard}>
            <IconSymbol name="drop.fill" size={44} color={AquaColors.primaryLight} />
            <Text style={styles.emptyTitle}>No water sources yet</Text>
            <Text style={styles.emptySub}>Add your water sources to track quality over time and get location-specific analysis.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add First Source</Text>
            </TouchableOpacity>
          </AquaCard>
        ) : (
          sources.map(source => {
            const info = typeInfo(source.source_type);
            const drink = drinkabilityStyle(source.drinkability_status);
            const isUnsafe = source.drinkability_status &&
              !source.drinkability_status.toLowerCase().includes('safe to drink');
            return (
              <AquaCard key={source.id} style={styles.sourceCard}>
                <View style={styles.sourceRow}>
                  <View style={[styles.sourceIcon, { backgroundColor: info.color + '18' }]}>
                    <IconSymbol name={info.icon as any} size={24} color={info.color} />
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>{source.name}</Text>
                    <Text style={styles.sourceType}>{info.label}</Text>
                    {source.location ? <Text style={styles.sourceLoc}>📍 {source.location}</Text> : null}
                    {source.readings_count != null && (
                      <Text style={styles.readingsCount}>
                        {source.readings_count} test{source.readings_count !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.drinkBadge, { backgroundColor: drink.bg }]}>
                    <Text style={[styles.drinkText, { color: drink.text }]} numberOfLines={2}>
                      {drink.label}
                    </Text>
                  </View>
                </View>

                {/* Water Cliniq CTA for unsafe/untested sources */}
                {isUnsafe && (
                  <TouchableOpacity
                    style={styles.cliniqBanner}
                    onPress={() => router.push(`/water-cliniq-analysis?water_source_id=${source.id}` as any)}
                  >
                    <IconSymbol name="cross.case.fill" size={14} color="#fff" />
                    <Text style={styles.cliniqText}>
                      Water Cliniq can test &amp; treat this source — Tap to analyse
                    </Text>
                    <IconSymbol name="chevron.right" size={12} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}

                <View style={styles.sourceActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/water-cliniq-analysis?water_source_id=${source.id}` as any)}
                  >
                    <IconSymbol name="camera.fill" size={13} color={AquaColors.primary} />
                    <Text style={styles.actionText}>Test Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(source)}>
                    <IconSymbol name="trash.fill" size={13} color="#dc2626" />
                    <Text style={[styles.actionText, { color: '#dc2626' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </AquaCard>
            );
          })
        )}
      </ScrollView>

      {/* Add Source Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Water Source</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <IconSymbol name="xmark.circle.fill" size={26} color={AquaColors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Source Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Home Tap, Community Well #1"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholderTextColor={AquaColors.gray}
            />

            <Text style={styles.fieldLabel}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Yaounde, Cameroon"
              value={form.location}
              onChangeText={v => setForm(f => ({ ...f, location: v }))}
              placeholderTextColor={AquaColors.gray}
            />

            <Text style={styles.fieldLabel}>Source Type</Text>
            <View style={styles.typeGrid}>
              {SOURCE_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeCard,
                    form.source_type === t.key && { borderColor: t.color, borderWidth: 2, backgroundColor: t.color + '10' },
                  ]}
                  onPress={() => setForm(f => ({ ...f, source_type: t.key }))}
                >
                  <IconSymbol name={t.icon as any} size={22} color={form.source_type === t.key ? t.color : AquaColors.gray} />
                  <Text style={[styles.typeLabel, form.source_type === t.key && { color: t.color, fontWeight: '700' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Add Source'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },
  statusBarFill: { backgroundColor: AquaColors.primary },
  header: {
    backgroundColor: AquaColors.primary, paddingHorizontal: Spacing.lg,
    paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 5 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sourceCard: { padding: Spacing.md, marginBottom: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sourceIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark, marginBottom: 2 },
  sourceType: { fontSize: 12, color: AquaColors.gray },
  sourceLoc: { fontSize: 11, color: AquaColors.gray, marginTop: 2 },
  readingsCount: { fontSize: 11, color: AquaColors.primary, marginTop: 2, fontWeight: '600' },
  sourceRight: { alignItems: 'center' },
  drinkBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', maxWidth: 110, minWidth: 80 },
  drinkText: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  noTestBadge: { backgroundColor: AquaColors.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  noTestText: { fontSize: 10, color: AquaColors.gray, fontWeight: '600' },
  cliniqBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0077B6', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
  },
  cliniqText: { flex: 1, fontSize: 11, color: '#fff', fontWeight: '600', lineHeight: 16 },
  sourceActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: AquaColors.borderLight, paddingTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 8, backgroundColor: AquaColors.primaryLight },
  actionText: { fontSize: 12, fontWeight: '600', color: AquaColors.primary },

  emptyCard: { padding: 40, alignItems: 'center', gap: 10, marginTop: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: AquaColors.textDark },
  emptySub: { fontSize: 13, color: AquaColors.gray, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: AquaColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.md, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: AquaColors.borderLight },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.textDark },
  modalBody: { flex: 1, padding: Spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: AquaColors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: AquaColors.textDark, backgroundColor: '#fff' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeCard: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: AquaColors.border, backgroundColor: '#fff' },
  typeLabel: { fontSize: 12, color: AquaColors.gray, flex: 1 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: AquaColors.borderLight },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: AquaColors.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: AquaColors.gray },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: AquaColors.primary, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
