import { ThemedText } from '@/components/themed-text';
import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AquaColors, BorderRadius, Spacing, lightTheme } from '@/constants/theme-constants';
import ApiService from '@/services/ApiService';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SUBJECTS = [
  { key: '', label: 'Select a topic' },
  { key: 'General Inquiry', label: 'General Inquiry' },
  { key: 'Partnership Opportunity', label: 'Partnership Opportunity' },
  { key: 'Technical Support', label: 'Technical Support' },
  { key: 'Water Quality Report', label: 'Water Quality Report' },
  { key: 'Media / Press', label: 'Media / Press' },
];

export default function ContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert(t('common.error'), 'Please fill in all required fields.');
      return;
    }
    if (message.length < 10) {
      Alert.alert(t('common.error'), 'Message must be at least 10 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await ApiService.submitContactMessage({ name, email, subject: subject || undefined, message });
      setSent(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ThemedText style={styles.backBtnText}>← Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Contact Us</ThemedText>
            <View style={{ width: 50 }} />
          </View>

          {!sent ? (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.title}>We'd love to hear from you</ThemedText>
                <ThemedText style={styles.subtitle}>Have a question or concern? Send us a message.</ThemedText>
              </View>

              <AquaCard style={styles.card}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Your Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={AquaColors.gray}
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Email Address</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={AquaColors.gray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Subject</ThemedText>
                  <View style={styles.pickerWrap}>
                    {SUBJECTS.map(s => (
                      <TouchableOpacity
                        key={s.key}
                        style={[styles.pickerOption, subject === s.key && styles.pickerOptionActive]}
                        onPress={() => setSubject(s.key)}
                      >
                        <ThemedText style={[styles.pickerText, subject === s.key && styles.pickerTextActive]}>
                          {s.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Message</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell us how we can help..."
                    placeholderTextColor={AquaColors.gray}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>

                <AquaButton
                  title={isLoading ? 'Sending...' : 'Send Message'}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={styles.btn}
                />

                <ThemedText style={styles.note}>
                  We'll get back to you within 24 hours. Your information stays private.
                </ThemedText>
              </AquaCard>
            </>
          ) : (
            <View style={styles.successBox}>
              <ThemedText style={styles.successIcon}>✅</ThemedText>
              <ThemedText style={styles.successTitle}>Message sent!</ThemedText>
              <ThemedText style={styles.successText}>
                Thank you for reaching out. We'll respond within 24 hours.
              </ThemedText>
              <AquaButton
                title="Send Another Message"
                onPress={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                variant="outline"
                style={{ marginTop: 16 }}
              />
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: lightTheme.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingTop: Spacing.xl },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 16, color: AquaColors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AquaColors.textDark },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: AquaColors.primary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: AquaColors.secondary, marginTop: 6, textAlign: 'center' },
  card: { padding: Spacing.lg, gap: 14 },
  inputGroup: { gap: 5 },
  label: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark },
  input: {
    borderWidth: 1, borderColor: AquaColors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    backgroundColor: '#fff', color: AquaColors.textDark,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerOption: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: AquaColors.border, backgroundColor: '#f8faff',
  },
  pickerOptionActive: { borderColor: AquaColors.primary, backgroundColor: AquaColors.primaryLight },
  pickerText: { fontSize: 13, color: AquaColors.textDark, fontWeight: '500' },
  pickerTextActive: { color: AquaColors.primary, fontWeight: '700' },
  btn: { marginTop: 4 },
  note: { fontSize: 12, color: AquaColors.gray, textAlign: 'center', marginTop: 4 },
  successBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: AquaColors.primary, marginBottom: 8 },
  successText: { fontSize: 14, color: AquaColors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
