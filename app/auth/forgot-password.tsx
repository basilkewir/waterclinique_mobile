import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AquaColors, BorderRadius, Spacing, lightTheme } from '@/constants/theme-constants';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email) {
      Alert.alert(t('common.error'), t('auth.errorFillFields'));
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert(
        t('auth.resetLinkSent'),
        t('auth.checkEmail'),
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('auth.sendResetLinkFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitcher />
        </View>

        <View style={styles.header}>
          <Image
            source={require('@/assets/images/water_cliniq.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>{t('auth.forgotPasswordTitle')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</ThemedText>
        </View>

        <AquaCard style={styles.card}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('auth.email')}</ThemedText>
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={AquaColors.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <AquaButton
            title={isLoading ? t('auth.sending') : t('auth.sendResetLink')}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.btn}
          />
        </AquaCard>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.footerLink}>{t('auth.backToLogin')}</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: lightTheme.background,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: AquaColors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: AquaColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: 16,
    gap: 14,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.textDark,
  },
  input: {
    borderWidth: 1,
    borderColor: AquaColors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#fff',
    color: AquaColors.textDark,
  },
  btn: {
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: AquaColors.primary,
  },
});
