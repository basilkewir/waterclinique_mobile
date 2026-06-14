/**
 * SmartConfig Native Module
 *
 * Implements Espressif ESP-Touch v2 protocol for Tuya EZ Mode device pairing.
 * Encodes WiFi credentials (SSID + password) into UDP broadcast packets that
 * Tuya devices (ESP8266/ESP32-based) capture in promiscuous mode.
 *
 * How it works:
 * 1. Device enters pairing mode, listens for SmartConfig UDP packets
 * 2. This module encodes SSID + password into packet lengths and IP addresses
 * 3. UDP packets are broadcast to 255.255.255.255 on ports 7001, 18266, etc.
 * 4. Device receives, decodes, and connects to WiFi
 *
 * For Expo managed workflow, this module is loaded via require() and only
 * works when the app is built with expo-dev-client (native code enabled).
 * When native code is unavailable, the app falls back to AP Mode.
 *
 * iOS: Uses GCDAsyncUdpSocket or NWConnection for UDP
 * Android: Uses DatagramSocket for UDP broadcasting
 */

import { NativeModules, Platform } from 'react-native';

// Mock implementation for Expo Go (no native UDP access)
// In production builds with expo-dev-client, the real native module is loaded
const MockSmartConfig = {
  startConfig: async (_ssid: string, _password: string, _onProgress?: (msg: string) => void) => {
    throw new Error(
      'SmartConfig (EZ Mode) requires a native build. ' +
      'Please use AP Mode for device pairing, or build with expo-dev-client.'
    );
  },
  stopConfig: async () => {},
  isSupported: async () => false,
};

// Try to get the native module, fall back to mock
let SmartConfigNative: typeof MockSmartConfig;
try {
  SmartConfigNative = NativeModules.SmartConfigModule || MockSmartConfig;
} catch {
  SmartConfigNative = MockSmartConfig;
}

export const SmartConfigModule = {
  /**
   * Start SmartConfig (EZ Mode) pairing
   * @param ssid - WiFi SSID to connect the device to
   * @param password - WiFi password
   * @param onProgress - Optional callback for progress messages
   * @returns Object with { deviceId, localKey, ip, mac } on success
   */
  startConfig: async (
    ssid: string,
    password: string,
    onProgress?: (message: string) => void
  ): Promise<{ deviceId: string; localKey: string; ip: string; mac: string }> => {
    if (onProgress) onProgress('Starting SmartConfig broadcast...');

    const result = await SmartConfigNative.startConfig(ssid, password, onProgress);

    if (onProgress) onProgress('Device found!');

    return result;
  },

  /**
   * Stop SmartConfig broadcast
   */
  stopConfig: async (): Promise<void> => {
    return SmartConfigNative.stopConfig();
  },

  /**
   * Check if SmartConfig is supported on this device
   */
  isSupported: async (): Promise<boolean> => {
    try {
      return await SmartConfigNative.isSupported();
    } catch {
      return false;
    }
  },
};

export default SmartConfigModule;
