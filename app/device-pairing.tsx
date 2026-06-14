/**
 * DevicePairingScreen — Connect WIFI-9953W directly to your WiFi
 *
 * This app connects directly to the 5-in-1 water tester — no third-party
 * accounts or cloud platforms needed. The device talks to your phone over
 * your home WiFi network.
 *
 * How it works:
 * 1. Device creates a temporary WiFi hotspot (AP Mode)
 * 2. Your phone connects to it
 * 3. App sends your home WiFi credentials to the device
 * 4. Device reboots and connects to your home WiFi
 * 5. App reads pH, TDS, EC, temperature, salinity directly from the device
 */

import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import WiFiDeviceService from '@/services/WiFiDeviceService';
import {
  getCurrentWiFiSSID,
  getPairedDevices,
  PairingProgress,
  startAPMode,
} from '@/services/TuyaPairingService';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function Spinner() {
  const spin = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <IconSymbol name="antenna.radiowaves.left.and.right" size={56} color={AquaColors.primary} />
    </Animated.View>
  );
}

function Pulse() {
  const pulse = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.3], outputRange: [0.6, 0] }) }]} />
  );
}

export default function DevicePairingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'setup' | 'credentials' | 'pairing' | 'success' | 'failed'>('setup');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [progress, setProgress] = useState<PairingProgress>({ step: 'idle', message: '' });
  const [pairedDevices, setPairedDevices] = useState<any[]>([]);

  useEffect(() => {
    loadDevices();
    detectWiFi();
  }, []);

  const loadDevices = async () => {
    const devices = await getPairedDevices();
    setPairedDevices(devices);
  };

  const detectWiFi = async () => {
    const detected = await getCurrentWiFiSSID();
    if (detected && detected !== 'Connected') setSsid(detected);
  };

  const handleStartPairing = async () => {
    if (!ssid.trim()) return;
    setStep('pairing');
    setProgress({ step: 'ready', message: 'Starting device pairing...' });

    const onProgress = (p: PairingProgress) => setProgress(p);

    const result = await startAPMode(ssid.trim(), password, '192.168.4.1', 80, onProgress);

    if (result) {
      await WiFiDeviceService.saveConfig({
        deviceIp: result.ip || '192.168.4.1',
        devicePort: 80,
        deviceName: result.deviceName,
      });
      setStep('success');
      loadDevices();
    } else {
      setStep('failed');
    }
  };

  // ── Setup instructions ──
  if (step === 'setup') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Water Tester</Text>
            <Text style={styles.subtitle}>Set up your WIFI-9953W 5-in-1 smart water tester</Text>
          </View>

          <View style={styles.content}>
            {/* How it works card */}
            <AquaCard style={styles.howCard}>
              <Text style={styles.howTitle}>How it works</Text>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Power on the device</Text>
                  <Text style={styles.stepDesc}>Plug in your WIFI-9953W. The LED will start blinking slowly.</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Connect to device hotspot</Text>
                  <Text style={styles.stepDesc}>Go to your phone's WiFi settings and connect to the network named "SmartLife-XXXX" or "SL-XXXX".</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Enter your WiFi details</Text>
                  <Text style={styles.stepDesc}>Come back here and enter your home WiFi name and password. The app sends it directly to the device.</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Start monitoring</Text>
                  <Text style={styles.stepDesc}>The device reboots and connects to your WiFi. View live pH, TDS, EC, temperature, and salinity readings.</Text>
                </View>
              </View>
            </AquaCard>

            <TouchableOpacity style={styles.startBtn} onPress={() => setStep('credentials')} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>Get Started</Text>
              <IconSymbol name="arrow.right" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualLink} onPress={() => router.replace('/device-config')}>
              <Text style={styles.manualLinkText}>I already know the device IP address</Text>
            </TouchableOpacity>
          </View>

          {pairedDevices.length > 0 && (
            <View style={styles.pairedSection}>
              <Text style={styles.pairedTitle}>Paired Devices</Text>
              {pairedDevices.map((d) => (
                <AquaCard key={d.deviceId} style={styles.pairedCard}>
                  <View style={styles.pairedRow}>
                    <IconSymbol name="antenna.radiowaves.left.and.right" size={22} color={AquaColors.mint} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pairedName}>{d.deviceName}</Text>
                      <Text style={styles.pairedId}>{d.deviceId?.slice(0, 16)}...</Text>
                    </View>
                  </View>
                </AquaCard>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── WiFi credentials ──
  if (step === 'credentials') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('setup')} style={{ marginBottom: 12 }}>
              <IconSymbol name="chevron.left" size={24} color={AquaColors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>WiFi Setup</Text>
            <Text style={styles.subtitle}>Enter your home WiFi details to send to the device</Text>
          </View>

          <View style={styles.content}>
            <AquaCard style={styles.formCard}>
              <View style={styles.apNote}>
                <IconSymbol name="info.circle.fill" size={18} color={AquaColors.primary} />
                <Text style={styles.apNoteText}>
                  Make sure your phone is connected to the device hotspot (SmartLife-XXXX) before continuing.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Your WiFi Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Home WiFi network name"
                placeholderTextColor={AquaColors.gray}
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>WiFi Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Enter WiFi password"
                  placeholderTextColor={AquaColors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <IconSymbol name="eye.fill" size={20} color={AquaColors.gray} />
                </TouchableOpacity>
              </View>

              <AquaButton
                title="Send to Device"
                icon="antenna.radiowaves.left.and.right"
                onPress={handleStartPairing}
                variant="primary"
                disabled={!ssid.trim()}
                style={{ marginTop: Spacing.lg }}
              />
            </AquaCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Pairing progress ──
  if (step === 'pairing') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.centerContent, { paddingTop: insets.top + 40 }]}>
          <View style={styles.pairingAnimation}>
            <Pulse />
            <Spinner />
          </View>
          <Text style={styles.pairingTitle}>Connecting Device...</Text>
          <Text style={styles.pairingSub}>{progress.message}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progress.step === 'sending_config' ? '30%' : progress.step === 'connecting' ? '60%' : progress.step === 'registering' ? '85%' : '10%' }]} />
          </View>
          <Text style={styles.pairingHint}>
            Keep your phone connected to the device hotspot until this completes
          </Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('credentials')}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success ──
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.centerContent, { paddingTop: insets.top + 40 }]}>
          <View style={styles.successIcon}>
            <IconSymbol name="checkmark.circle.fill" size={80} color={AquaColors.mint} />
          </View>
          <Text style={styles.successTitle}>Device Connected!</Text>
          <Text style={styles.successSub}>
            Your WIFI-9953W water tester is now on your home WiFi.
          </Text>
          <AquaCard style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Device</Text>
              <Text style={styles.successValue}>WIFI-9953W Water Tester</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Connection</Text>
              <Text style={styles.successValue}>Direct (Local Network)</Text>
            </View>
          </AquaCard>
          <AquaButton title="View Live Readings" icon="antenna.radiowaves.left.and.right" onPress={() => router.replace('/live-readings')} variant="primary" style={{ marginTop: 20, width: '80%' }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Failed ──
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.centerContent, { paddingTop: insets.top + 40 }]}>
        <View style={styles.successIcon}>
          <IconSymbol name="exclamationmark.circle.fill" size={80} color={AquaColors.warning} />
        </View>
        <Text style={styles.successTitle}>Connection Failed</Text>
        <Text style={styles.successSub}>{progress.error || 'Device did not respond.'}</Text>
        <AquaCard style={styles.failCard}>
          <Text style={styles.failTitle}>Try this:</Text>
          <Text style={styles.failItem}>• Make sure the device is plugged in and powered on</Text>
          <Text style={styles.failItem}>• Verify the LED is blinking slowly (1 blink per 2 seconds)</Text>
          <Text style={styles.failItem}>• Check that your phone is connected to the SmartLife-XXXX WiFi</Text>
          <Text style={styles.failItem}>• Move your phone closer to the device</Text>
          <Text style={styles.failItem}>• Try again — sometimes it takes 2-3 attempts</Text>
        </AquaCard>
        <AquaButton title="Try Again" onPress={() => setStep('credentials')} variant="primary" style={{ marginTop: 20, width: '80%' }} />
        <AquaButton title="Enter IP Manually" onPress={() => router.replace('/device-config')} variant="outline" style={{ marginTop: 12, width: '80%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  centerContent: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.lg },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: AquaColors.textDark, marginBottom: 6 },
  subtitle: { fontSize: 15, color: AquaColors.gray, lineHeight: 21 },
  content: { padding: Spacing.md },

  // Setup cards
  howCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  howTitle: { fontSize: 18, fontWeight: '700', color: AquaColors.textDark, marginBottom: Spacing.lg },
  stepRow: { flexDirection: 'row', gap: 14, marginBottom: Spacing.lg },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: AquaColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: AquaColors.textDark, marginBottom: 3 },
  stepDesc: { fontSize: 13, color: AquaColors.gray, lineHeight: 19 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: AquaColors.primary, borderRadius: BorderRadius.lg,
    padding: 18,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  manualLink: { alignItems: 'center', padding: 16 },
  manualLinkText: { fontSize: 14, color: AquaColors.primary, fontWeight: '600' },

  // Credentials form
  formCard: { padding: Spacing.lg },
  apNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: AquaColors.primaryLight, borderRadius: BorderRadius.md,
    padding: 12, marginBottom: Spacing.lg,
  },
  apNoteText: { fontSize: 13, color: AquaColors.primary, flex: 1, lineHeight: 19 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark, marginBottom: 6, marginTop: Spacing.md },
  input: {
    borderWidth: 1, borderColor: AquaColors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: 16, color: AquaColors.textDark,
    backgroundColor: AquaColors.background, marginBottom: Spacing.md,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },

  // Pairing progress
  pairingAnimation: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pulseRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: AquaColors.primaryLight, borderWidth: 2, borderColor: AquaColors.primary },
  pairingTitle: { fontSize: 22, fontWeight: '700', color: AquaColors.textDark, marginBottom: 8 },
  pairingSub: { fontSize: 15, color: AquaColors.gray, textAlign: 'center', marginBottom: 32 },
  progressBar: { width: '80%', height: 4, borderRadius: 2, backgroundColor: AquaColors.primaryLight, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: AquaColors.primary, borderRadius: 2 },
  pairingHint: { fontSize: 13, color: AquaColors.gray, marginBottom: 24, textAlign: 'center' },
  cancelBtn: { padding: 12 },
  cancelBtnText: { fontSize: 15, color: AquaColors.gray, fontWeight: '600' },

  // Success / Failed
  successIcon: { marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: AquaColors.textDark, marginBottom: 8 },
  successSub: { fontSize: 15, color: AquaColors.gray, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  successCard: { width: '85%', padding: Spacing.lg },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AquaColors.borderLight },
  successLabel: { fontSize: 14, color: AquaColors.gray },
  successValue: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark },
  failCard: { width: '90%', padding: Spacing.lg, marginBottom: 12 },
  failTitle: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark, marginBottom: 10 },
  failItem: { fontSize: 13, color: AquaColors.textSecondary, marginBottom: 6, lineHeight: 19 },

  // Paired devices
  pairedSection: { padding: Spacing.md },
  pairedTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark, marginBottom: 12 },
  pairedCard: { padding: Spacing.md },
  pairedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pairedName: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark },
  pairedId: { fontSize: 11, color: AquaColors.gray, marginTop: 2 },
});
