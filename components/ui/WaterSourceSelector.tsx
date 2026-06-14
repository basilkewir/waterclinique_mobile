import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Colors, Spacing } from '@/constants/theme-constants';
import WaterDataService, { WaterSource } from '@/services/WaterDataService';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface WaterSourceSelectorProps {
  selectedSource: string;
  onSourceSelect: (source: string) => void;
}

export const WaterSourceSelector: React.FC<WaterSourceSelectorProps> = ({
  selectedSource,
  onSourceSelect
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<'tap' | 'well' | 'borehole' | 'river' | 'spring'>('well');
  const [sources, setSources] = useState<WaterSource[]>([]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const data = await WaterDataService.getWaterSources();
      setSources(data);
    } catch (error) {
      console.error('Error loading sources:', error);
    }
  };

  const sourceTypes = [
    { key: 'well', label: t('sources.well'), icon: 'drop.circle.fill' },
    { key: 'borehole', label: t('sources.borehole'), icon: 'circle.dotted' },
    { key: 'spring', label: t('sources.spring'), icon: 'leaf.circle.fill' },
    { key: 'river', label: t('sources.river'), icon: 'water.waves' },
    { key: 'tap', label: t('sources.tap'), icon: 'faucet.fill' }
  ];

  const handleCreateSource = async () => {
    if (newSourceName.trim()) {
      try {
        const newSource = await WaterDataService.saveWaterSource({
          name: newSourceName,
          location: '',
          source_type: newSourceType,
          status: 'active',
        });
        
        await loadSources();
        onSourceSelect(newSource.id.toString());
        setShowModal(false);
        setNewSourceName('');
        setNewSourceType('well');
      } catch (error) {
        console.error('Error creating source:', error);
        // Fallback to simple selection
        const typeLabel = sourceTypes.find(t => t.key === newSourceType)?.label || newSourceType;
        onSourceSelect(`${newSourceName} (${typeLabel})`);
        setShowModal(false);
        setNewSourceName('');
        setNewSourceType('well');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{t('readings.selectSource')} *</ThemedText>
      
      <TouchableOpacity
        style={[styles.selector, selectedSource && styles.selectorSelected]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          <IconSymbol 
            name={selectedSource ? "drop.fill" : "plus.circle.fill"} 
            size={20} 
            color={selectedSource ? AquaColors.primary : Colors.light.icon} 
          />
          <ThemedText style={[
            styles.selectorText,
            selectedSource && styles.selectorTextSelected
          ]}>
            {selectedSource || t('readings.selectSource')}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.down" size={16} color={Colors.light.icon} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <AquaCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('readings.selectSource')}</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.sourcesList}>
              {sources.length === 0 ? (
                <ThemedText style={styles.emptyText}>No water sources yet. Create one below.</ThemedText>
              ) : (
                sources.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[
                      styles.sourceItem,
                      selectedSource === source.id.toString() && styles.sourceItemSelected
                    ]}
                    onPress={() => {
                      onSourceSelect(source.id.toString());
                      setShowModal(false);
                    }}
                  >
                    <IconSymbol name="drop.fill" size={18} color={AquaColors.primary} />
                    <View style={styles.sourceInfo}>
                      <ThemedText style={styles.sourceItemText}>{source.name}</ThemedText>
                      {source.location && (
                        <ThemedText style={styles.sourceLocation}>{source.location}</ThemedText>
                      )}
                    </View>
                    {selectedSource === source.id.toString() && (
                      <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.divider} />

            <ThemedText style={styles.createTitle}>{t('readings.createNewSource')}</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="Enter source name"
              value={newSourceName}
              onChangeText={setNewSourceName}
            />

            <View style={styles.typeGrid}>
              {sourceTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    newSourceType === type.key && styles.typeCardSelected
                  ]}
                  onPress={() => setNewSourceType(type.key)}
                >
                  <IconSymbol 
                    name={type.icon} 
                    size={20} 
                    color={newSourceType === type.key ? '#FFFFFF' : AquaColors.primary} 
                  />
                  <ThemedText style={[
                    styles.typeText,
                    newSourceType === type.key && styles.typeTextSelected
                  ]}>
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <AquaButton
              title={t('common.save')}
              variant="primary"
              onPress={handleCreateSource}
              disabled={!newSourceName.trim()}
              style={styles.saveButton}
            />
          </AquaCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
  },
  selectorSelected: {
    borderColor: AquaColors.primary,
    backgroundColor: AquaColors.light,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginLeft: Spacing.sm,
  },
  selectorTextSelected: {
    color: AquaColors.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AquaColors.primary,
  },
  sourcesList: {
    marginBottom: Spacing.md,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.light.background,
  },
  sourceItemSelected: {
    backgroundColor: AquaColors.light,
  },
  sourceItemText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: Spacing.sm,
    flex: 1,
    fontWeight: '500',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  sourceLocation: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    padding: Spacing.lg,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: AquaColors.light,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AquaColors.light,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
  },
  typeCardSelected: {
    backgroundColor: AquaColors.primary,
    borderColor: AquaColors.primary,
  },
  typeText: {
    fontSize: 12,
    color: AquaColors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});