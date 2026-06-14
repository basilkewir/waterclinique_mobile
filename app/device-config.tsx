import { AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, Spacing } from '@/constants/theme-constants';
import WiFiDeviceService, { DeviceConfig } from '@/services/WiFiDeviceService';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeviceConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const [deviceIp, setDeviceIp] = useState('192.168.4.1');
  const [devicePort, setDevicePort] = useState('80');
  const [pollingMs, setPollingMs] = useState('3000');

  useEffect(() => {
    WiFiDeviceService.loadConfig().then((c) => {
      setConfig(c);
      setDeviceIp(c.deviceIp || '192.168.4.1');
      setDevicePort(String(c.devicePort || 80));
      setPollingMs(String(c.pollingIntervalMs || 3000));
    });
  }, []);

  const handleSave = async () => {
    await WiFiDeviceService.saveConfig({
      deviceIp,
      devicePort: parseInt(devicePort) || 80,
      pollingIntervalMs: parseInt(pollingMs) || 3000,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await WiFiDeviceService.testConnection();
      if (result.success && result.readings) {
        Alert.alert(
          'Connection Successful',
          `pH: ${result.readings.ph}\nTDS: ${result.readings.tds} ppm\nTemperature: ${result.readings.temperature}°C\nEC: ${result.readings.ec} µS/cm\nSalinity: ${result.readings.salinity} ppt`
        );
      } else {
        Alert.alert('Connection Failed', result.error || 'Device unreachable. Check the IP address and make sure the device is on your WiFi network.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 8 }}>
            <IconSymbol name="chevron.left" size={24} color={AquaColors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Device Settings</Text>
          <Text style={styles.subtitle}>Configure your WIFI-9953W water tester connection</Text>
        </View>

        <View style={styles.content}>
          <AquaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Device Address</Text>
            <Text style={styles.sectionDesc}>
              After pairing, the device gets an IP address on your home WiFi. Enter it here.
              {'\n\n'}If you haven't paired yet, use the Pair Device option below.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IP Address</Text>
              <TextInput
                style={styles.input}
                value={deviceIp}
                onChangeText={setDeviceIp}
                placeholder="192.168.1.100"
                placeholderTextColor={AquaColors.gray}
                autoCapitalize="none"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Port</Text>
              <TextInput
                style={styles.input}
                value={devicePort}
                onChangeText={setDevicePort}
                placeholder="80"
                placeholderTextColor={AquaColors.gray}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Check every (milliseconds)</Text>
              <TextInput
                style={styles.input}
                value={pollingMs}
                onChangeText={setPollingMs}
                placeholder="3000"
                placeholderTextColor={AquaColors.gray}
                keyboardType="numeric"
              />
            </View>
          </AquaCard>

          <View style={styles.actionRow}>
            <AquaButton
              title={saved ? 'Saved' : 'Save'}
              icon={saved ? 'checkmark' : undefined}
              onPress={handleSave}
              variant={saved ? 'outline' : 'primary'}
              style={styles.actionBtn}
            />
            <AquaButton
              title={testing ? 'Testing...' : 'Test Connection'}
              onPress={handleTest}
              variant="secondary"
              disabled={testing}
              style={styles.actionBtn}
            />
          </View>

          <AquaButton
            title="View Live Readings"
            onPress={() => router.push('/live-readings')}
            variant="primary"
            style={styles.liveBtn}
          />

          <AquaCard style={styles.helpCard}>
            <Text style={styles.helpTitle}>Finding your device IP</Text>
            <Text style={styles.helpText}>
              After pairing the device to your WiFi, you can find its IP address by:{'\n\n'}
              1. Opening your router's admin page (usually 192.168.0.1 or 192.168.1.1){'\n'}
              2. Looking for a device named "WIFI-9953W" or "ESP-XXXX" in the connected devices list{'\n'}
              3. The default port is 80{'\n\n'}
              If you can't find the IP, check your router's connected devices list for "WIFI-9953W".
            </Text>
          </AquaCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AquaColors.background },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: 26, fontWeight: '700', color: AquaColors.textDark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: AquaColors.gray, lineHeight: 20 },
  content: { padding: Spacing.md },

  card: { padding: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AquaColors.textDark, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: AquaColors.gray, lineHeight: 19, marginBottom: Spacing.lg },

  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: AquaColors.textDark, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AquaColors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: 16, color: AquaColors.textDark,
    backgroundColor: AquaColors.background,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  actionBtn: { flex: 1 },
  liveBtn: { marginBottom: 10 },

  helpCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  helpTitle: { fontSize: 15, fontWeight: '700', color: AquaColors.textDark, marginBottom: 8 },
  helpText: { fontSize: 13, color: AquaColors.gray, lineHeight: 20 },
});
