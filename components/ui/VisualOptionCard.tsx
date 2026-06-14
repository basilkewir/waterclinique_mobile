import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing } from '@/constants/theme-constants';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VisualOptionCardProps {
  option: string;
  label: string;
  icon: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
}

export const VisualOptionCard: React.FC<VisualOptionCardProps> = ({
  option,
  label,
  icon,
  color,
  selected,
  onPress
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: color || AquaColors.aquaLight },
        selected && styles.selectedIconContainer
      ]}>
        <IconSymbol 
          name={icon} 
          size={24} 
          color={selected ? '#FFFFFF' : AquaColors.aquaDeep} 
        />
      </View>
      <Text style={[
        styles.label,
        selected && styles.selectedLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AquaColors.borderLight,
    backgroundColor: AquaColors.surface,
    marginBottom: Spacing.sm,
    marginRight: Spacing.sm,
  },
  selectedCard: {
    borderColor: AquaColors.aquaDeep,
    backgroundColor: AquaColors.aquaLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  selectedIconContainer: {
    backgroundColor: AquaColors.aquaDeep,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: AquaColors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedLabel: {
    color: AquaColors.aquaDeep,
    fontWeight: '600',
  },
});