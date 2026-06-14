import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard, WaveHeader } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing, lightTheme } from '@/constants/theme-constants';
import WaterCliniqService, { WaterCliniqContact } from '@/services/WaterCliniqService';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactClinicScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clinics, setClinics] = useState<WaterCliniqContact[]>([]);

  useEffect(() => {
    const clinicData = WaterCliniqService.getClinicContacts();
    setClinics(clinicData);
  }, []);

  const handleCall = async (phone: string) => {
    await WaterCliniqService.callClinic(phone);
  };

  const handleEmail = async (email: string) => {
    await WaterCliniqService.emailClinic(
      email,
      t('contact.emailSubject'),
      t('contact.emailBody')
    );
  };

  const handleWhatsApp = async (phone: string) => {
    await WaterCliniqService.openWhatsApp(
      phone,
      t('contact.whatsappMessage')
    );
  };

  const handleWebsite = async (url: string) => {
    await WaterCliniqService.openWebsite(url);
  };

  const handleContact = (clinic: WaterCliniqContact) => {
    WaterCliniqService.showContactOptions(clinic);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: t('contact.title') || 'Contact Water Clinic',
          headerShown: true,
          headerTitle: t('contact.title') || 'Contact Water Clinic',
          headerStyle: {
            backgroundColor: AquaColors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#FFFFFF',
          },
          }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <WaveHeader
          title={t('contact.title') || 'Contact Water Clinic'}
          subtitle={t('contact.subtitle') || 'Get professional water quality analysis'}
          height={180}
        />

        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          <AquaCard style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={24} color={AquaColors.primary} />
            <ThemedText style={styles.infoText}>
              {t('contact.info') || 'For accurate and comprehensive water quality testing, contact one of our partner clinics. They can test for bacteria, chemicals, and heavy metals that require laboratory equipment.'}
            </ThemedText>
          </AquaCard>

          {clinics.length === 0 ? (
            <AquaCard style={styles.emptyCard}>
              <IconSymbol name="building.2.fill" size={48} color={AquaColors.light} />
              <ThemedText style={styles.emptyText}>{t('contact.emptyTitle')}</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                {t('contact.emptySubtext')}
              </ThemedText>
            </AquaCard>
          ) : (
            clinics.map((clinic, index) => (
              <AquaCard key={index} style={styles.clinicCard}>
                <View style={styles.clinicHeader}>
                  <View style={styles.clinicIconContainer}>
                    <IconSymbol name="building.2.fill" size={28} color={AquaColors.primary} />
                  </View>
                  <View style={styles.clinicInfo}>
                    <ThemedText style={styles.clinicName}>{clinic.name}</ThemedText>
                    {clinic.address && (
                      <View style={styles.clinicLocation}>
                        <IconSymbol name="location.fill" size={14} color={AquaColors.secondary} />
                        <ThemedText style={styles.clinicAddress}>{clinic.address}</ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.contactMethods}>
                  {clinic.phone && (
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleCall(clinic.phone!)}
                    >
                      <View style={styles.contactButtonContent}>
                        <IconSymbol name="phone.fill" size={20} color={AquaColors.primary} />
                        <View style={styles.contactButtonText}>
                          <ThemedText style={styles.contactLabel}>{t('contact.callLabel')}</ThemedText>
                          <ThemedText style={styles.contactValue}>{clinic.phone}</ThemedText>
                        </View>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={lightTheme.icon} />
                    </TouchableOpacity>
                  )}

                  {clinic.whatsapp && (
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleWhatsApp(clinic.whatsapp!)}
                    >
                      <View style={styles.contactButtonContent}>
                        <IconSymbol name="message.fill" size={20} color={AquaColors.quality.good} />
                        <View style={styles.contactButtonText}>
                          <ThemedText style={styles.contactLabel}>{t('contact.whatsappLabel')}</ThemedText>
                          <ThemedText style={styles.contactValue}>{clinic.whatsapp}</ThemedText>
                        </View>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={lightTheme.icon} />
                    </TouchableOpacity>
                  )}

                  {clinic.email && (
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleEmail(clinic.email!)}
                    >
                      <View style={styles.contactButtonContent}>
                        <IconSymbol name="envelope.fill" size={20} color={AquaColors.secondary} />
                        <View style={styles.contactButtonText}>
                          <ThemedText style={styles.contactLabel}>{t('contact.emailLabel')}</ThemedText>
                          <ThemedText style={styles.contactValue}>{clinic.email}</ThemedText>
                        </View>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={lightTheme.icon} />
                    </TouchableOpacity>
                  )}

                  {clinic.website && (
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleWebsite(clinic.website!)}
                    >
                      <View style={styles.contactButtonContent}>
                        <IconSymbol name="globe" size={20} color={AquaColors.accent} />
                        <View style={styles.contactButtonText}>
                          <ThemedText style={styles.contactLabel}>{t('contact.websiteLabel')}</ThemedText>
                          <ThemedText style={styles.contactValue}>{clinic.website}</ThemedText>
                        </View>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={lightTheme.icon} />
                    </TouchableOpacity>
                  )}
                </View>

                <AquaButton
                  title={t('contact.contactNow') || 'Contact Now'}
                  variant="primary"
                  onPress={() => handleContact(clinic)}
                  style={styles.contactNowButton}
                />
              </AquaCard>
            ))
          )}

          <AquaCard style={styles.tipsCard}>
            <ThemedText style={styles.tipsTitle}>
              {t('contact.tipsTitle') || 'What to Expect'}
            </ThemedText>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.quality.good} />
                <ThemedText style={styles.tipText}>
                  {t('contact.tip1') || 'Professional laboratory testing for bacteria, chemicals, and heavy metals'}
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.quality.good} />
                <ThemedText style={styles.tipText}>
                  {t('contact.tip2') || 'Detailed analysis report with recommendations'}
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.quality.good} />
                <ThemedText style={styles.tipText}>
                  {t('contact.tip3') || 'Expert consultation on water treatment options'}
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={AquaColors.quality.good} />
                <ThemedText style={styles.tipText}>
                  {t('contact.tip4') || 'Follow-up support and monitoring recommendations'}
                </ThemedText>
              </View>
            </View>
          </AquaCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingTop: -Spacing.lg,
  },
  infoCard: {
    marginTop: -Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    backgroundColor: lightTheme.background,
    borderWidth: 1.5,
    borderColor: AquaColors.light,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 14,
    color: lightTheme.text,
    lineHeight: 20,
  },
  clinicCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: AquaColors.light,
  },
  clinicHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  clinicIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: AquaColors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: Spacing.xs,
  },
  clinicLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  clinicAddress: {
    fontSize: 14,
    color: AquaColors.secondary,
    marginLeft: Spacing.xs,
  },
  contactMethods: {
    marginBottom: Spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: lightTheme.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactButtonText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: lightTheme.icon,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: lightTheme.text,
  },
  contactNowButton: {
    marginTop: Spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: lightTheme.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: lightTheme.icon,
    textAlign: 'center',
  },
  tipsCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: AquaColors.light,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: Spacing.md,
  },
  tipsList: {
    marginTop: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tipText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: lightTheme.text,
    lineHeight: 20,
  },
});
