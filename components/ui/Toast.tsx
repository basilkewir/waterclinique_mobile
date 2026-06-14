import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AquaColors } from '@/constants/theme-constants';

const { width: screenWidth } = Dimensions.get('window');

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type, duration = 3000, visible, onHide }: ToastProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return AquaColors.quality.excellent;
      case 'warning': return AquaColors.quality.fair;
      case 'error': return AquaColors.quality.poor;
      case 'info': return AquaColors.info;
      default: return AquaColors.info;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#E8F5E8';
      case 'warning': return '#FFF4E6';
      case 'error': return '#FFEBEE';
      case 'info': return '#E3F2FD';
      default: return '#E3F2FD';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <MaterialIcons 
        name={getIcon() as any} 
        size={20} 
        color={getIconColor()} 
      />
      <Text style={styles.toastMessage}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
});
