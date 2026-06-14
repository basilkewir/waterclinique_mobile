import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing, lightTheme } from '@/constants/theme-constants';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.errorFillFields'));
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('auth.loginFailed'), error?.message || t('auth.invalidCredentials'));
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
        {/* ── Language Switcher ── */}
        <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitcher />
        </View>

        {/* ── Top brand block ── */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/water_cliniq.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>{t('auth.appName')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('auth.loginSubtitle')}</ThemedText>
        </View>

        {/* ── Form ── */}
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
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('auth.password')}</ThemedText>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={AquaColors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={styles.forgot}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <ThemedText style={styles.forgotText}>{t('auth.forgotPassword')}</ThemedText>
          </TouchableOpacity>

          <AquaButton
            title={isLoading ? t('auth.signingIn') : t('auth.signIn')}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.btn}
          />
        </AquaCard>

        {/* ── Google ── */}
        <View style={styles.socialRow}>
          <ThemedText style={styles.socialText}>{t('auth.orContinueWith')}</ThemedText>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => Alert.alert(t('common.comingSoon'), t('auth.googleComingSoon'))}
          >
            <IconSymbol name="globe" size={18} color={AquaColors.primary} />
            <ThemedText style={styles.googleText}>{t('auth.google')}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── Sign-up ── */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>{t('auth.noAccount')} </ThemedText>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <ThemedText style={styles.footerLink}>{t('auth.signUp')}</ThemedText>
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

  // Brand
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
    fontSize: 26,
    fontWeight: '800',
    color: AquaColors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: AquaColors.textSecondary,
    textAlign: 'center',
  },

  // Card
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
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: AquaColors.secondary,
    fontWeight: '500',
  },
  btn: {
    marginTop: 2,
  },

  // Social
  socialRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  socialText: {
    fontSize: 13,
    color: AquaColors.textSecondary,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: AquaColors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.primary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: AquaColors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: AquaColors.primary,
  },
});
