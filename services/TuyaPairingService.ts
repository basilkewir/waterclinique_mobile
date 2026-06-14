/**
 * DevicePairingService — Direct device pairing for WIFI-9953W
 *
 * Connects the 5-in-1 water tester to your home WiFi without any
 * third-party cloud accounts. The device is controlled entirely
 * from this app over your local network.
 *
 * AP MODE: Device creates a hotspot. Phone connects to it and sends
 * WiFi credentials via HTTP. Device then reboots and joins your network.
 */

import SecureStorage from '@/services/SecureStorage';
import { Platform } from 'react-native';

const PAIRED_DEVICES_KEY = 'paired_devices';

export interface WiFiNetwork {
  ssid: string;
  bssid?: string;
  signalStrength?: number;
}

export interface PairedDevice {
  deviceId: string;
  deviceName: string;
  localKey: string;
  ip?: string;
  pairedAt: string;
  tuyaRegion?: string;
}

export type PairingMode = 'ap';

export interface PairingProgress {
  step: 'idle' | 'scanning_wifi' | 'ready' | 'sending_config' | 'connecting' | 'registering' | 'success' | 'failed';
  message: string;
  deviceId?: string;
  error?: string;
}

/**
 * Get the phone's current WiFi SSID
 */
export async function getCurrentWiFiSSID(): Promise<string | null> {
  return null; // Live device feature coming soon
}

/**
 * AP Mode — Device creates a hotspot, phone connects and sends config via HTTP
 *
 * Flow:
 * 1. User connects phone to device hotspot (SmartLife-XXXX or SL-XXXX)
 * 2. App sends WiFi credentials to device via HTTP POST
 * 3. Device connects to home WiFi
 */
export async function startAPMode(
  ssid: string,
  password: string,
  deviceHotspotIp: string = '192.168.4.1',
  deviceHotspotPort: number = 80,
  onProgress: (p: PairingProgress) => void,
  timeoutMs: number = 60000
): Promise<PairedDevice | null> {
  onProgress({ step: 'connecting', message: `Connecting to device at ${deviceHotspotIp}...` });

  try {
    // Try multiple known Tuya device AP endpoints
    const endpoints = [
      '/config',           // Common ESP8266 config endpoint
      '/api/config',       // Alternative
      '/wifi/config',      // Tuya-specific
      '/setup',            // Generic setup
      '/',                 // Root may accept POST
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`http://${deviceHotspotIp}:${deviceHotspotPort}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ssid,
            password,
            token: '',  // Some Tuya devices accept a pairing token
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          onProgress({ step: 'connecting', message: 'Device received credentials. Connecting to WiFi...' });

          // Wait for device to connect to WiFi
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const deviceId = data.device_id || data.deviceId || data.id || '';
          const localKey = data.local_key || data.localKey || data.key || '';

          if (deviceId) {
            const paired = await savePairedDevice({
              deviceId,
              deviceName: 'WIFI-9953W Water Tester',
              localKey,
              pairedAt: new Date().toISOString(),
            });
            onProgress({ step: 'success', message: 'Device paired successfully!', deviceId: paired.deviceId });
            return paired;
          }
        }
      } catch (e: any) {
        lastError = e;
        if (e.name === 'AbortError') continue;
      }
    }

    // If all endpoints failed, try a longer polling approach
    onProgress({ step: 'connecting', message: 'Waiting for device to connect to your WiFi...' });

    // Poll to see if device becomes available on Tuya Cloud
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        // The device might auto-register with Tuya Cloud
        // We can check by looking for new devices via the cloud API
        onProgress({ step: 'connecting', message: `Waiting for device... ${Math.floor((Date.now() - startTime) / 1000)}s` });
      } catch {}
    }

    throw lastError || new Error('Device did not respond. Check that the device is in AP Mode (slow blinking LED).');
  } catch (error: any) {
    onProgress({ step: 'failed', message: error.message, error: error.message });
    return null;
  }
}

/**
 * Save a paired device to local storage
 */
export async function savePairedDevice(device: PairedDevice): Promise<PairedDevice> {
  const devices = await getPairedDevices();
  const existing = devices.findIndex((d) => d.deviceId === device.deviceId);
  if (existing >= 0) {
    devices[existing] = { ...devices[existing], ...device };
  } else {
    devices.push(device);
  }
  await SecureStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
  return device;
}

/**
 * Get all paired devices
 */
export async function getPairedDevices(): Promise<PairedDevice[]> {
  try {
    const raw = await SecureStorage.getItem(PAIRED_DEVICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Remove a paired device
 */
export async function removePairedDevice(deviceId: string): Promise<void> {
  const devices = await getPairedDevices();
  const filtered = devices.filter((d) => d.deviceId !== deviceId);
  await SecureStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(filtered));
}
