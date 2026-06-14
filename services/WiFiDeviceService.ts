/**
 * WiFiDeviceService — WIFI-9953W 5-in-1 Smart Water Tester
 *
 * Connects directly to the device over your home WiFi network.
 * No cloud accounts or third-party platforms required.
 *
 * The device exposes a simple HTTP API on port 80 for readings:
 *   GET /data → JSON with pH, TDS, EC, temperature, salinity
 *
 * WIFI-9953W measures: pH, TDS, EC, Temperature, Salinity
 */

import SecureStorage from '@/services/SecureStorage';

const DEVICE_CONFIG_KEY = 'wifi9953w_config';

export interface DeviceConfig {
  deviceIp?: string;
  devicePort?: number;
  pollingIntervalMs: number;
  deviceName: string;
}

export interface WaterReadings {
  ph: number;
  tds: number;
  ec: number;
  temperature: number;
  salinity: number;
  timestamp: string;
  raw?: any;
}

export interface ConnectionStatus {
  connected: boolean;
  lastReading: WaterReadings | null;
  lastError: string | null;
}

export type ReadingListener = (readings: WaterReadings) => void;
export type StatusListener = (status: ConnectionStatus) => void;

const DEFAULT_CONFIG: DeviceConfig = {
  deviceIp: '192.168.4.1',
  devicePort: 80,
  pollingIntervalMs: 3000,
  deviceName: 'WIFI-9953W Water Tester',
};

class WiFiDeviceService {
  private config: DeviceConfig = { ...DEFAULT_CONFIG };
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private readingListeners: Set<ReadingListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  private currentStatus: ConnectionStatus = {
    connected: false,
    lastReading: null,
    lastError: null,
  };

  async loadConfig(): Promise<DeviceConfig> {
    try {
      const saved = await SecureStorage.getItem(DEVICE_CONFIG_KEY);
      if (saved) this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return this.config;
  }

  async saveConfig(cfg: Partial<DeviceConfig>): Promise<void> {
    this.config = { ...this.config, ...cfg };
    await SecureStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(this.config));
  }

  getConfig(): DeviceConfig { return { ...this.config }; }
  getStatus(): ConnectionStatus { return { ...this.currentStatus }; }

  addReadingListener(fn: ReadingListener): () => void {
    this.readingListeners.add(fn);
    return () => this.readingListeners.delete(fn);
  }

  addStatusListener(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private emitStatus(p: Partial<ConnectionStatus>) {
    this.currentStatus = { ...this.currentStatus, ...p };
    this.statusListeners.forEach((l) => l(this.getStatus()));
  }

  private emitReadings(r: WaterReadings) {
    this.readingListeners.forEach((l) => l(r));
  }

  // ═══════════════════════════════════════════════════════════
  // LOCAL DEVICE API
  // ═══════════════════════════════════════════════════════════

  async fetchViaLocalIp(): Promise<WaterReadings> {
    const { deviceIp, devicePort } = this.config;
    const baseUrl = `http://${deviceIp}:${devicePort || 80}`;
    const endpoints = ['/data', '/readings', '/api/data', '/status', '/'];

    let lastErr: Error | null = null;
    for (const ep of endpoints) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000);
        const resp = await fetch(`${baseUrl}${ep}`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!resp.ok) continue;
        const raw = await resp.json();
        const r = this.parseLocalResponse(raw);
        if (r) return r;
      } catch (e: any) {
        lastErr = e;
        if (e.name === 'AbortError') continue;
      }
    }
    throw lastErr || new Error('Device unreachable');
  }

  private parseLocalResponse(raw: any): WaterReadings | null {
    const d = raw.data || raw.readings || raw.result || raw;
    const ph = this.extractNum(d, ['pH', 'ph', 'PH', 'ph_value', 'phValue']);
    const tds = this.extractNum(d, ['TDS', 'tds', 'tds_value', 'tdsValue']);
    const ec = this.extractNum(d, ['EC', 'ec', 'conductivity', 'ec_value', 'ecValue']);
    const temp = this.extractNum(d, ['Temperature', 'temperature', 'temp', 'temp_current', 'tempValue', 'temp_value']);
    const sal = this.extractNum(d, ['Salinity', 'salinity', 'SAL', 'sal', 'salinityValue', 'salinity_value']);
    if (ph === null && tds === null && temp === null && ec === null) return null;

    return {
      ph: ph ?? 7.0, tds: tds ?? 0, ec: ec ?? 0,
      temperature: temp ?? 25.0, salinity: sal ?? 0,
      timestamp: new Date().toISOString(), raw,
    };
  }

  private extractNum(obj: any, keys: string[]): number | null {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) {
        const n = Number(obj[k]);
        if (!isNaN(n)) return n;
      }
      for (const ok of Object.keys(obj)) {
        if (ok.toLowerCase() === k.toLowerCase()) {
          const n = Number(obj[ok]);
          if (!isNaN(n)) return n;
        }
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // UNIFIED FETCH
  // ═══════════════════════════════════════════════════════════

  async fetchReading(): Promise<WaterReadings> {
    const r = await this.fetchViaLocalIp();
    this.emitStatus({ connected: true, lastReading: r, lastError: null });
    return r;
  }

  startPolling(): void {
    this.stopPolling();
    this.fetchReading()
      .then((r) => this.emitReadings(r))
      .catch((e) => this.emitStatus({ connected: false, lastError: e.message }));

    this.pollingTimer = setInterval(async () => {
      try {
        const r = await this.fetchReading();
        this.emitReadings(r);
      } catch (e: any) {
        this.emitStatus({ connected: false, lastError: e.message });
      }
    }, this.config.pollingIntervalMs);
  }

  stopPolling(): void {
    if (this.pollingTimer) { clearInterval(this.pollingTimer); this.pollingTimer = null; }
    this.emitStatus({ connected: false, lastError: null });
  }

  isPolling(): boolean { return this.pollingTimer !== null; }

  async testConnection(): Promise<{ success: boolean; readings?: WaterReadings; error?: string }> {
    try {
      const r = await this.fetchReading();
      return { success: true, readings: r };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export default new WiFiDeviceService();
