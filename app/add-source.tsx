import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import StorageService, { WaterSource } from '@/services/StorageService';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function AddSourceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('tap');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a source name.');
      return;
    }
    setSaving(true);
    try {
      const source: WaterSource = {
        id: Date.now().toString(),
        name: name.trim(),
        type: type as any,
        location: location.trim(),
        isActive: true,
        createdDate: new Date().toISOString(),
      };
      await StorageService.saveSource(source);
      Alert.alert('Success', `"${source.name}" has been added to your water sources.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save water source. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeInfo = SOURCE_TYPES.find(t => t.key === type) || SOURCE_TYPES[0];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Water Source</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Name */}
        <Text style={styles.fieldLabel}>Source Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Home Tap, Community Well #1"
          placeholderTextColor={AquaColors.gray}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Location */}
        <Text style={styles.fieldLabel}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Yaounde, Cameroon"
          placeholderTextColor={AquaColors.gray}
          value={location}
          onChangeText={setLocation}
        />

        {/* Source Type */}
        <Text style={styles.fieldLabel}>Source Type</Text>
        <View style={styles.typeGrid}>
          {SOURCE_TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typeCard,
                type === t.key && { borderColor: t.color, borderWidth: 2, backgroundColor: t.color + '12' },
              ]}
              onPress={() => setType(t.key)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={t.icon as any}
                size={22}
                color={type === t.key ? t.color : AquaColors.gray}
              />
              <Text style={[styles.typeLabel, type === t.key && { color: t.color, fontWeight: '700' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { borderColor: selectedTypeInfo.color + '40', backgroundColor: selectedTypeInfo.color + '08' }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedTypeInfo.color + '18' }]}>
            <IconSymbol name={selectedTypeInfo.icon as any} size={28} color={selectedTypeInfo.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewName}>{name || 'Source name'}</Text>
            <Text style={styles.previewType}>{selectedTypeInfo.label}{location ? ` · ${location}` : ''}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, (!name.trim() || saving) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Source'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },

  header: {
    backgroundColor: AquaColors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  content: { padding: Spacing.lg, paddingBottom: 40 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: AquaColors.textDark, marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1.5, borderColor: AquaColors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: AquaColors.textDark, backgroundColor: '#fff',
  },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  typeCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: AquaColors.border, backgroundColor: '#fff',
  },
  typeLabel: { fontSize: 12, color: AquaColors.gray, flex: 1 },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 24, padding: 16, borderRadius: BorderRadius.lg, borderWidth: 1.5,
  },
  previewIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark },
  previewType: { fontSize: 12, color: AquaColors.gray, marginTop: 3 },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: AquaColors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: AquaColors.gray },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.primary, alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
