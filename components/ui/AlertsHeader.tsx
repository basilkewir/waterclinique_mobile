import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Shadows } from '@/constants/theme-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AlertsHeaderProps {
  alertCount?: number;
}

export const AlertsHeader: React.FC<AlertsHeaderProps> = ({ alertCount = 0 }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push('/(tabs)/alerts');
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconSymbol 
          name="bell.fill" 
          size={22} 
          color={AquaColors.primary} 
        />
        {alertCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {alertCount > 99 ? '99+' : alertCount.toString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    marginRight: 4,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AquaColors.primary,
    ...Shadows.sm,
  },
  iconContainer: {
    position: 'relative',
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: AquaColors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});