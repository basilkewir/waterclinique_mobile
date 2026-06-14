import { AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TestMethod({ icon, title, desc, color, onPress, comingSoon }: {
  icon: string; title: string; desc: string; color: string; onPress: () => void; comingSoon?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity onPress={comingSoon ? undefined : onPress} activeOpacity={comingSoon ? 1 : 0.7}>
      <AquaCard style={[styles.methodCard, { borderLeftColor: comingSoon ? '#ccc' : color, borderLeftWidth: 4 }, comingSoon && styles.methodCardDisabled]}>
        <View style={styles.methodRow}>
          <View style={[styles.methodIconWrap, { backgroundColor: (comingSoon ? '#ccc' : color) + '12' }]}>
            <IconSymbol name={icon as any} size={30} color={comingSoon ? '#aaa' : color} />
          </View>
          <View style={styles.methodBody}>
            <View style={styles.methodTitleRow}>
              <Text style={[styles.methodTitle, comingSoon && styles.methodTitleDisabled]}>{title}</Text>
              {comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>{t('analyze.comingSoon')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.methodDesc, comingSoon && styles.methodDescDisabled]}>{desc}</Text>
          </View>
          {!comingSoon && <IconSymbol name="chevron.right" size={20} color={AquaColors.gray} />}
        </View>
      </AquaCard>
    </TouchableOpacity>
  );
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{t('analyze.testYourWater')}</Text>
        <Text style={styles.headerSub}>{t('analyze.chooseMethodSub')}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.content}>
          <TestMethod icon="camera.fill" title={t('analyze.photoScan')}
            desc={t('analyze.photoScanDesc')}
            color={AquaColors.primary}
            onPress={() => router.push('/new-water-test' as any)}
          />
          <TestMethod icon="antenna.radiowaves.left.and.right" title={t('analyze.wifiTester')}
            desc={t('analyze.wifiTesterDesc')}
            color="#7C3AED"
            onPress={() => router.push('/live-readings')}
            comingSoon
          />
          <TestMethod icon="wrench.fill" title={t('analyze.leakDetection')}
            desc={t('analyze.leakDetectionDesc')}
            color={AquaColors.gold}
            onPress={() => router.push('/leakage-detection')}
          />
          <TestMethod icon="clipboard.fill" title={t('analyze.answerQuestions')}
            desc={t('analyze.answerQuestionsDesc')}
            color={AquaColors.mint}
            onPress={() => router.push('/new-water-test' as any)}
          />
          <TestMethod icon="sensor.fill" title={t('analyze.enterReadings')}
            desc={t('analyze.enterReadingsDesc')}
            color={AquaColors.primary}
            onPress={() => router.push('/new-reading-integrated')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AquaColors.background },
  headerBar: { backgroundColor: AquaColors.primary, paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  content: { padding: Spacing.md },
  methodCard: { padding: Spacing.lg, marginBottom: 12 },
  methodRow: { flexDirection: 'row', alignItems: 'center' },
  methodIconWrap: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  methodBody: { flex: 1 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 },
  methodTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark },
  methodTitleDisabled: { color: '#aaa' },
  methodDesc: { fontSize: 13, color: AquaColors.textSecondary, lineHeight: 19 },
  methodDescDisabled: { color: '#bbb' },
  methodCardDisabled: { opacity: 0.7 },
  comingSoonBadge: { backgroundColor: '#F3F0FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD6FE' },
  comingSoonText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
});
