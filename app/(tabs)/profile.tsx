import { AquaButton, AquaCard, WaveHeader } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import WaterDataService from '@/services/WaterDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userStats, setUserStats] = React.useState<{
    totalAnalyses: number;
    averageQuality: number;
    sourcesCount: number;
    totalSources: number;
  } | null>(null);

  React.useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await WaterDataService.getDashboardStats();
      const avgQuality = stats.totalAnalyses > 0
        ? Math.round(100 - stats.averageRiskScore)
        : 0;
      setUserStats({
        totalAnalyses: stats.totalAnalyses,
        averageQuality: avgQuality,
        sourcesCount: stats.totalSources,
        totalSources: stats.totalSources,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const menuItems = [
    {
      id: 'alerts',
      title: t('profile.menuItems.alerts.title'),
      subtitle: t('profile.menuItems.alerts.subtitle'),
      icon: 'bell.fill',
      color: AquaColors.warning,
      onPress: () => router.push('/(tabs)/alerts'),
    },
    {
      id: 'settings',
      title: t('profile.menuItems.settings.title'),
      subtitle: t('profile.menuItems.settings.subtitle'),
      icon: 'settings.fill',
      color: AquaColors.aquaDeep,
      onPress: () => router.push('/(tabs)/settings'),
    },
    {
      id: 'contact',
      title: t('profile.menuItems.contact.title'),
      subtitle: t('profile.menuItems.contact.subtitle'),
      icon: 'phone.fill',
      color: AquaColors.success,
      onPress: () => router.push('/contact-clinic'),
    },
    {
      id: 'sources',
      title: t('profile.menuItems.sources.title'),
      subtitle: t('profile.menuItems.sources.subtitle'),
      icon: 'drop.fill',
      color: AquaColors.info,
      onPress: () => router.push('/add-source'),
    },
    {
      id: 'device',
      title: t('profile.menuItems.device.title'),
      subtitle: t('profile.menuItems.device.subtitle'),
      icon: 'antenna.radiowaves.left.and.right',
      color: '#7C3AED',
      onPress: () => router.push('/device-config'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <WaveHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          height={180}
        />

        <View style={styles.content}>
          {user && (
            <AquaCard style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email || ''}</Text>
            </AquaCard>
          )}

          {userStats && (
            <AquaCard style={styles.statsCard}>
              <Text style={styles.statsTitle}>{t('profile.myActivity')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.totalAnalyses}</Text>
                  <Text style={styles.statLabel}>{t('profile.analyses')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.averageQuality}</Text>
                  <Text style={styles.statLabel}>{t('profile.avgScore')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.sourcesCount}</Text>
                  <Text style={styles.statLabel}>{t('profile.sources', 'Sources')}</Text>
                </View>
              </View>
            </AquaCard>
          )}

          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <AquaCard style={styles.menuCard}>
                  <View style={styles.menuContent}>
                    <View style={styles.menuIcon}>
                      <IconSymbol name={item.icon} size={24} color={item.color} />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={AquaColors.gray}
                    />
                  </View>
                </AquaCard>
              </TouchableOpacity>
            ))}
          </View>

          <AquaCard style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>{t('profile.quickActions')}</Text>
            <View style={styles.actionButtons}>
              <AquaButton
                title={t('profile.newAnalysis')}
                onPress={() => router.push('/(tabs)/analyze')}
                variant="primary"
                style={styles.actionButton}
              />
              <AquaButton
                title={t('profile.viewHistory')}
                onPress={() => router.push('/(tabs)/readings')}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </AquaCard>

          <AquaCard style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('profile.appInfo')}</Text>
            <Text style={styles.infoVersion}>{t('profile.version')}</Text>
            <Text style={styles.infoText}>
              {t('profile.appDescription')}
            </Text>
          </AquaCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AquaColors.background,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  userCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AquaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: AquaColors.textDark,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: AquaColors.gray,
  },
  statsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AquaColors.textDark,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: AquaColors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    marginBottom: Spacing.lg,
  },
  menuItem: {
    marginBottom: Spacing.sm,
  },
  menuCard: {
    padding: Spacing.md,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AquaColors.textDark,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: AquaColors.gray,
  },
  actionsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AquaColors.textDark,
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AquaColors.textDark,
    marginBottom: 4,
  },
  infoVersion: {
    fontSize: 13,
    color: AquaColors.gray,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: AquaColors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
