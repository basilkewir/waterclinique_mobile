import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AquaColors, BorderRadius, Spacing, lightTheme } from '@/constants/theme-constants';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!name || !email || !password || !passwordConfirmation) {
      Alert.alert(t('common.error'), t('auth.errorFillFields'));
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordMinLength'));
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password, passwordConfirmation);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('auth.registrationFailed'), error?.message || t('auth.registrationFailedMessage'));
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

        {/* ── Brand ── */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/water_cliniq.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>{t('auth.createAccount')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('auth.registerSubtitle')}</ThemedText>
        </View>

        {/* ── Form ── */}
        <AquaCard style={styles.card}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('auth.fullName')}</ThemedText>
            <TextInput
              style={styles.input}
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor={AquaColors.gray}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('auth.email')}</ThemedText>
            <TextInput
              ref={emailRef}
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
              placeholder={t('auth.passwordMinLengthPlaceholder')}
              placeholderTextColor={AquaColors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('auth.confirmPassword')}</ThemedText>
            <TextInput
              ref={confirmRef}
              style={styles.input}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              placeholderTextColor={AquaColors.gray}
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          <AquaButton
            title={isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.btn}
          />
        </AquaCard>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>{t('auth.haveAccount')} </ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.footerLink}>{t('auth.signIn')}</ThemedText>
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
    marginBottom: 18,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: AquaColors.primary,
    marginBottom: 3,
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
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AquaColors.textDark,
  },
  input: {
    borderWidth: 1,
    borderColor: AquaColors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    color: AquaColors.textDark,
  },
  btn: {
    marginTop: 4,
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
