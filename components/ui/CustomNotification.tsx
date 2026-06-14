import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AquaColors } from '@/constants/theme-constants';

const { width: screenWidth } = Dimensions.get('window');

interface CustomNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
  actionButton?: {
    text: string;
    onPress: () => void;
  };
}

export function CustomNotification({ 
  visible, 
  title, 
  message, 
  type, 
  onClose, 
  actionButton 
}: CustomNotificationProps) {
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.notificationContainer, { backgroundColor: getBackgroundColor() }]}>
          <View style={styles.header}>
            <MaterialIcons 
              name={getIcon() as any} 
              size={24} 
              color={getIconColor()} 
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          {actionButton && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: AquaColors.primary }]}
              onPress={actionButton.onPress}
            >
              <Text style={styles.actionButtonText}>{actionButton.text}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  notificationContainer: {
    width: Math.min(screenWidth * 0.9, 350),
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
