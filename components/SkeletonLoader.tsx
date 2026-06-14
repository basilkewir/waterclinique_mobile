import React, { memo, useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonLoaderComponent({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const w = typeof width === 'number' ? width : SCREEN_WIDTH * 0.6;

  return (
    <Animated.View
      style={[{ width: w, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]}
      accessibilityLabel="Loading"
    />
  );
}

export const SkeletonLoader = memo(SkeletonLoaderComponent);

export function CardSkeleton() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.row}>
        <SkeletonLoader width={120} height={18} />
        <SkeletonLoader width={60} height={18} />
      </View>
      <View style={[cardStyles.row, { marginTop: 12 }]}>
        <SkeletonLoader width={80} height={14} />
        <SkeletonLoader width={40} height={28} borderRadius={14} />
      </View>
      <View style={[cardStyles.row, { marginTop: 12 }]}>
        <SkeletonLoader width="60%" height={14} />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}
