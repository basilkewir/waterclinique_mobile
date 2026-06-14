import SecureStorage from '@/services/SecureStorage';
import { ThemedText } from '@/components/themed-text';
import { AquaBadge, AquaCard } from '@/components/ui/AquaComponents';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AquaColors, Spacing, lightTheme } from '@/constants/theme-constants';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

interface SettingItem {
  icon: string;
  title: string;
  subtitle: string;
  action?: string;
  type?: 'switch' | 'link' | 'component';
  value?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  component?: React.ReactNode;
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: logout },
      ]
    );
  }, [t, logout]);

  const renderSettingItem = useCallback((item: SettingItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingItem}
      onPress={item.onPress}
      accessibilityLabel={item.title}
      accessibilityRole="button"
      accessibilityHint={item.subtitle}
    >
      <View style={styles.settingLeft}>
        <ThemedText style={styles.settingTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.settingSubtitle}>{item.subtitle}</ThemedText>
      </View>
      <View style={styles.settingRight}>
        {item.type === 'switch' && item.onToggle && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#ddd', true: AquaColors.primary }}
            accessibilityRole="switch"
            accessibilityLabel={`Toggle ${item.title}`}
          />
        )}
        {item.type === 'component' && item.component}
      </View>
    </TouchableOpacity>
  ), []);

  const settingsSections = [
    {
      title: t('settings.sectionPreferences'),
      items: [
        {
          icon: 'globe',
          title: t('settings.language'),
          subtitle: t('settings.languageSubtitle'),
          action: 'language',
          type: 'component' as const,
          component: <LanguageSwitcher />,
        },
        {
          icon: 'moon',
          title: t('settings.darkMode'),
          subtitle: t('settings.darkModeSubtitle'),
          type: 'switch' as const,
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: t('settings.sectionNotifications'),
      items: [
        {
          icon: 'bell',
          title: t('settings.pushNotifications'),
          subtitle: t('settings.pushNotificationsSubtitle'),
          type: 'switch' as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'location',
          title: t('settings.locationServices'),
          subtitle: t('settings.locationServicesSubtitle'),
          type: 'switch' as const,
          value: locationServices,
          onToggle: setLocationServices,
        },
      ],
    },
    {
      title: t('settings.sectionData'),
      items: [
        {
          icon: 'sync',
          title: t('settings.autoSync'),
          subtitle: t('settings.autoSyncSubtitle'),
          type: 'switch' as const,
          value: autoSync,
          onToggle: setAutoSync,
        },
      ],
    },
    {
      title: t('settings.sectionAccount'),
      items: [
        {
          icon: 'envelope',
          title: t('settings.contactUs'),
          subtitle: t('settings.contactUsSubtitle'),
          type: 'link' as const,
          onPress: () => router.push('/contact'),
        },
        {
          icon: 'person',
          title: t('settings.logout'),
          subtitle: t('settings.logoutSubtitle'),
          type: 'link' as const,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: t('settings.title'), headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t('settings.title')}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t('settings.title', 'Settings')}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t('settings.subtitle', 'Manage your app preferences')}
          </ThemedText>
        </View>

        {settingsSections.map(section => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <AquaCard style={styles.sectionCard}>
              {section.items.map(item => renderSettingItem(item))}
            </AquaCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: lightTheme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightTheme.subtext,
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: lightTheme.subtext,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: lightTheme.text,
  },
  settingSubtitle: {
    fontSize: 12,
    color: lightTheme.subtext,
    marginTop: 2,
  },
  settingRight: {},
});
