import { AquaColors, Spacing } from '@/constants/theme-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack } from 'expo-router';

interface MethodCardProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  bullets: string[];
  onPress: () => void;
  recommended?: boolean;
}

function MethodCard({ icon, iconColor, title, subtitle, bullets, onPress, recommended }: MethodCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
          <IconSymbol name={icon as any} size={36} color={iconColor} />
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={AquaColors.gray ?? '#9ca3af'} />
      </View>
      <View style={styles.bullets}>
        {bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: iconColor }]} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function NewWaterTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('newWaterTest.title', 'New Water Test')}</Text>
        <Text style={styles.headerSub}>{t('newWaterTest.subtitle', 'Choose how to check your water quality')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          {t('newWaterTest.selectMethod', 'Select a testing method')}
        </Text>

        {/* Manual Questionnaire */}
        <MethodCard
          icon="list.bullet.clipboard.fill"
          iconColor="#059669"
          title={t('newWaterTest.manualTitle', 'Manual Questionnaire')}
          subtitle={t('newWaterTest.manualSubtitle', 'No camera needed — describe what you observe')}
          bullets={[
            t('newWaterTest.manualBullet1', 'Step-by-step visual and sensory questions'),
            t('newWaterTest.manualBullet2', 'Works offline with no photo required'),
            t('newWaterTest.manualBullet3', 'Covers colour, smell, taste, foam and particles'),
          ]}
          recommended
          onPress={() => router.push('/water-image-analysis')}
        />

        {/* AI Photo Analysis */}
        <MethodCard
          icon="camera.fill"
          iconColor={AquaColors.primary}
          title={t('newWaterTest.photoTitle', 'AI Photo Analysis')}
          subtitle={t('newWaterTest.photoSubtitle', 'Optionally add photos to improve accuracy')}
          bullets={[
            t('newWaterTest.photoBullet1', 'Water sample, pipes & environment — all optional'),
            t('newWaterTest.photoBullet2', 'AI cross-checks photos against your answers'),
            t('newWaterTest.photoBullet3', 'Skip any or all photos and still get a result'),
          ]}
          onPress={() => router.push('/water-image-analysis')}
        />

        {/* Divider with "more options" */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>{t('newWaterTest.moreOptions', 'More options')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Other options — compact */}
        {[
          {
            icon: 'sensor.fill',
            color: AquaColors.primary,
            title: t('analyze.enterReadings', 'Enter Test Kit Readings'),
            desc: t('analyze.enterReadingsDesc', 'Type in values from your TDS pen, pH meter, or home test kit.'),
            route: '/new-reading-integrated',
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.compactCard}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.compactIcon, { backgroundColor: item.color + '18' }]}>
              <IconSymbol name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={styles.compactBody}>
              <Text style={styles.compactTitle}>{item.title}</Text>
              <Text style={styles.compactDesc}>{item.desc}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={AquaColors.gray ?? '#9ca3af'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },

  header: {
    backgroundColor: AquaColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 24,
  },
  backBtn:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 4, alignSelf: 'flex-start' },
  backText:  { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 14, color: 'rgba(255,255,255,0.78)' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: Spacing.lg,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AquaColors.primary + '18',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: AquaColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitles:  { flex: 1 },
  cardTitle:   { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardSubtitle:{ fontSize: 13, color: '#6b7280', lineHeight: 18 },

  bullets: { gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  bulletText: { fontSize: 13, color: '#374151', lineHeight: 19, flex: 1 },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: 10,
  },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },

  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody:  { flex: 1 },
  compactTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  compactDesc:  { fontSize: 12, color: '#6b7280', lineHeight: 17 },
});
