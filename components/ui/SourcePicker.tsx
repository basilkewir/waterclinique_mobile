/**
 * SourcePicker — inline water source selector.
 * - Auto-opens AddSourceModal when user has no sources.
 * - Shows "Create New Source" button alongside the source list.
 * - After source creation, auto-selects the new source.
 */
import AddSourceModal from '@/components/AddSourceModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing } from '@/constants/theme-constants';
import WaterDataService, { WaterSource } from '@/services/WaterDataService';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  initialSourceId?: number | string;
  onSelect: (source: WaterSource) => void;
}

export default function SourcePicker({ initialSourceId, onSelect }: Props) {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [selected, setSelected] = useState<WaterSource | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoOpenedRef = useRef(false);

  const loadSources = useCallback(async () => {
    try {
      const data = await WaterDataService.getSources();
      setSources(data);

      // Pre-select if initialSourceId provided
      if (initialSourceId && !selected) {
        const match = data.find(s => String(s.id) === String(initialSourceId));
        if (match) { setSelected(match); onSelect(match); }
      }

      // Auto-open add modal if user has no sources (only once)
      if (data.length === 0 && !autoOpenedRef.current) {
        autoOpenedRef.current = true;
        setShowAddModal(true);
      }
    } catch {}
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceId]);

  useEffect(() => { loadSources(); }, [loadSources]);

  useFocusEffect(useCallback(() => {
    if (showAddModal) return;
    loadSources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal]));

  const handleSourceCreated = useCallback(async () => {
    // Reload and auto-select the newest source
    try {
      const data = await WaterDataService.getSources();
      setSources(data);
      if (data.length > 0) {
        const newest = data[data.length - 1];
        setSelected(newest);
        onSelect(newest);
      }
    } catch {}
  }, [onSelect]);

  if (loading) {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color={AquaColors.primary} />
        <Text style={styles.loadingText}>Loading sources…</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.pill, selected ? styles.pillSelected : styles.pillEmpty]}
        onPress={() => setShowModal(true)}
      >
        <IconSymbol name="drop.fill" size={15} color={selected ? '#fff' : AquaColors.primary} />
        <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextEmpty]} numberOfLines={1}>
          {selected ? selected.name : 'Select water source (required)'}
        </Text>
        <IconSymbol name="chevron.down" size={13} color={selected ? 'rgba(255,255,255,0.7)' : AquaColors.gray} />
      </TouchableOpacity>

      {/* Source picker modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Water Source</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <IconSymbol name="xmark.circle.fill" size={26} color={AquaColors.gray} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            The test results will be saved under the selected source.
          </Text>

          {/* Always-visible Create New Source button */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => { setShowModal(false); setShowAddModal(true); }}
          >
            <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create New Water Source</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
            {sources.length === 0 ? (
              <View style={styles.emptyBox}>
                <IconSymbol name="drop.fill" size={36} color={AquaColors.primaryLight} />
                <Text style={styles.emptyTitle}>No sources yet</Text>
                <Text style={styles.emptySub}>Create a water source above to get started.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.listLabel}>Your water sources</Text>
                {sources.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.item, selected?.id === s.id && styles.itemSelected]}
                    onPress={() => { setSelected(s); onSelect(s); setShowModal(false); }}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName}>{s.name}</Text>
                      <Text style={styles.itemMeta}>
                        {s.source_type}{s.location ? ` · ${s.location}` : ''}
                      </Text>
                      {s.drinkability_status && (
                        <View style={[styles.statusDot, { backgroundColor: drinkColor(s.drinkability_status) }]}>
                          <Text style={styles.statusDotText}>{drinkLabel(s.drinkability_status)}</Text>
                        </View>
                      )}
                    </View>
                    {selected?.id === s.id && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={AquaColors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <AddSourceModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSourceCreated={handleSourceCreated}
      />
    </>
  );
}

function drinkColor(status?: string): string {
  if (!status) return '#6b7280';
  const s = status.toLowerCase();
  if (s.includes('safe to drink')) return '#22c55e';
  if (s.includes('without boiling') || s.includes('caution')) return '#eab308';
  if (s.includes('not safe') || s.includes('unsafe')) return '#f97316';
  if (s.includes('dangerous')) return '#ef4444';
  return '#6b7280';
}

function drinkLabel(status?: string): string {
  if (!status) return 'Not tested';
  const s = status.toLowerCase();
  if (s.includes('safe to drink')) return '● Safe';
  if (s.includes('without boiling') || s.includes('caution')) return '● Caution';
  if (s.includes('not safe')) return '● Not safe';
  if (s.includes('dangerous')) return '● Dangerous';
  return '● ' + status;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md },
  loadingText: { fontSize: 13, color: AquaColors.gray },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, marginBottom: 12,
  },
  pillEmpty: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: AquaColors.primary },
  pillSelected: { backgroundColor: AquaColors.primary },
  pillText: { flex: 1, fontSize: 14, fontWeight: '600' },
  pillTextEmpty: { color: AquaColors.primary },
  pillTextSelected: { color: '#fff' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.textDark },
  modalSub: { fontSize: 13, color: AquaColors.gray, paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: 4 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: AquaColors.primary, marginHorizontal: Spacing.lg,
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 24,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },

  listLabel: { fontSize: 12, fontWeight: '700', color: AquaColors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 10, marginBottom: 8,
    backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E0E7FF',
  },
  itemSelected: { borderColor: AquaColors.primary, backgroundColor: '#EFF6FF' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: AquaColors.textDark },
  itemMeta: { fontSize: 12, color: AquaColors.gray, marginTop: 2, textTransform: 'capitalize' },

  statusDot: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusDotText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark },
  emptySub: { fontSize: 13, color: AquaColors.gray, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
