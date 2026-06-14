import { useAuth } from '@/contexts/AuthContext';
import { AquaColors, Spacing } from '@/constants/theme-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertsHeader } from './AlertsHeader';
import { LanguageSwitcher } from './LanguageSwitcher';
import { IconSymbol } from './icon-symbol';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <LanguageSwitcher />
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={14} color={AquaColors.primary} />
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <AlertsHeader alertCount={0} />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.6}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={AquaColors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: AquaColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AquaColors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,180,216,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.dark,
    maxWidth: 120,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
});
