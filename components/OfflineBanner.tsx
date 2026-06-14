import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function OfflineBannerComponent() {
  const { isConnected, details } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]} accessibilityRole="alert" accessibilityLabel="Offline">
      <View style={styles.inner}>
        <Text style={styles.icon}>!</Text>
        <Text style={styles.text}>
          {details || 'You are offline. Data will sync when connection is restored.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
});

export const OfflineBanner = memo(OfflineBannerComponent);
