import SecureStorage from '@/services/SecureStorage';
import API_CONFIG from '@/config/api';

const AUTH_TOKEN_KEY = 'auth_token';

class ApiService {
  private baseURL: string;
  private token: string | null = null;
  private tokenLoaded: Promise<void>;
  private onUnauthenticated: (() => void) | null = null;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.tokenLoaded = this.loadToken();
  }

  setOnUnauthenticated(cb: () => void) {
    this.onUnauthenticated = cb;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  private async loadToken() {
    try {
      this.token = await SecureStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  private async ensureToken() {
    await this.tokenLoaded;
  }

  private async saveToken(token: string) {
    try {
      await SecureStorage.setItem(AUTH_TOKEN_KEY, token);
      this.token = token;
    } catch {
      console.error('Error saving token');
    }
  }

  async clearToken() {
    try {
      await SecureStorage.removeItem(AUTH_TOKEN_KEY);
      this.token = null;
    } catch {
      console.error('Error removing token');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}, retries = 1, cancelKey?: string): Promise<T> {
    await this.ensureToken();
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    if (cancelKey) {
      this.cancelRequest(cancelKey);
      const controller = new AbortController();
      this.abortControllers.set(cancelKey, controller);
      config.signal = controller.signal;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { ...config, redirect: 'follow' });

        if (cancelKey) {
          this.abortControllers.delete(cancelKey);
        }

        const contentType = response.headers.get('content-type') || '';
        let data: any;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Server returned an unexpected response (HTTP ${response.status}). Check your API URL and server configuration.`);
        }

        if (!response.ok) {
          if (response.status === 401) {
            await this.clearToken();
            this.onUnauthenticated?.();
            throw new Error(data?.message || data?.error || 'Unauthenticated.');
          }
          throw new Error(data.message || data.error || `API request failed (${response.status})`);
        }

        return data;
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthenticated.') throw error;
        if (cancelKey) this.abortControllers.delete(cancelKey);
        if (attempt === retries) {
          throw error;
        }
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    throw new Error('Request failed after retries.');
  }

  async login(email: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = res?.token || res?.data?.token;
    const user = res?.user || res?.data?.user;

    if (token) {
      await this.saveToken(token);
    }

    return { token, user, ...res };
  }

  async register(name: string, email: string, password: string, password_confirmation: string) {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });

    const token = res?.token || res?.data?.token;
    const user = res?.user || res?.data?.user;

    if (token) {
      await this.saveToken(token);
    }

    return { token, user, ...res };
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await this.clearToken();
    }
  }

  async getWaterSources(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/water-sources${queryString}`);
  }

  async getWaterSourceStats() {
    return this.request('/water-sources/stats');
  }

  async getWaterSource(id: number) {
    return this.request(`/water-sources/${id}`);
  }

  async createWaterSource(sourceData: Record<string, any>) {
    return this.request('/water-sources', {
      method: 'POST',
      body: JSON.stringify(sourceData),
    });
  }

  async updateWaterSource(id: number, sourceData: Record<string, any>) {
    return this.request(`/water-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sourceData),
    });
  }

  async deleteWaterSource(id: number) {
    return this.request(`/water-sources/${id}`, { method: 'DELETE' });
  }

  async getLatestReading(waterSourceId: number) {
    return this.request(`/water-sources/${waterSourceId}/latest-reading`);
  }

  async getReadings(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/readings${queryString}`);
  }

  async createReading(readingData: Record<string, any>) {
    return this.request('/readings', {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  }

  async getReading(id: number) {
    return this.request(`/readings/${id}`);
  }

  async getAlerts(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/alerts${queryString}`);
  }

  async acknowledgeAlert(id: number) {
    return this.request(`/alerts/${id}/acknowledge`, { method: 'POST' });
  }

  async resolveAlert(id: number, resolutionNotes?: string) {
    return this.request(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: resolutionNotes }),
    });
  }

  async getUser() {
    return this.request('/user');
  }

  async getDashboardAnalytics(timeframe = '7d') {
    return this.request(`/analytics/dashboard?timeframe=${timeframe}`);
  }

  async getWaterSourceTrends(waterSourceId: number, timeframe = '30d') {
    return this.request(`/analytics/water-source/${waterSourceId}/trends?timeframe=${timeframe}`);
  }

  async getPredictiveAnalytics(waterSourceId?: number, days = 7) {
    const params = new URLSearchParams();
    if (waterSourceId) params.append('water_source_id', waterSourceId.toString());
    params.append('days', days.toString());
    return this.request(`/analytics/predictive?${params.toString()}`);
  }

  async getContaminationAnalysis(timeframe = '30d') {
    return this.request(`/analytics/contamination?timeframe=${timeframe}`);
  }

  async compareWaterSources(sourceIds: number[], timeframe = '30d') {
    const params = new URLSearchParams();
    sourceIds.forEach(id => params.append('source_ids[]', id.toString()));
    params.append('timeframe', timeframe);
    return this.request(`/analytics/compare-sources?${params.toString()}`);
  }

  async getRealTimeMonitoring() {
    return this.request('/analytics/real-time');
  }

  async getStandards(params?: { active?: boolean; parameter_key?: string; search?: string }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/standards${queryString}`);
  }

  async getStandardsMap() {
    return this.request('/standards/map');
  }

  async getWHOStandards() {
    return this.request('/standards/who');
  }

  async getCameroonStandards() {
    return this.request('/standards/cameroon');
  }

  async getStandard(id: number) {
    return this.request(`/standards/${id}`);
  }

  async getStandardByKey(key: string) {
    return this.request(`/standards/key/${key}`);
  }

  async assessParameterValue(parameterKey: string, value: number) {
    return this.request('/standards/assess', {
      method: 'POST',
      body: JSON.stringify({ parameter_key: parameterKey, value }),
    });
  }

  async batchAssessParameters(parameters: { key: string; value: number }[]) {
    return this.request('/standards/assess-batch', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  }

  async analyzeWaterImage(
    imageUri: string,
    observations?: {
      water_source_id?: number;
      name?: string;
      color?: string;
      clarity?: string;
      smell?: string;
      taste?: string;
      particles?: string;
      location?: string;
      source_type?: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
      leakage?: string;
      pipe_condition?: string;
      context_mode?: 'water' | 'test_kit' | 'source_add';
    },
    visionData?: string,
  ): Promise<import('@/types/api').WaterAnalysisApiResponse> {
    const formData = new FormData();
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'water_image.jpg';
      const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      formData.append('water_image', { uri: imageUri, type: mimeType, name: filename } as any);
    }

    if (observations) {
      Object.entries(observations).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
    }

    if (visionData) {
      formData.append('vision_data', visionData);
    }

    await this.ensureToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseURL}/water-image/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await response.json().catch(() => ({}));

    // 422 = retake required — return the body instead of throwing
    if (response.status === 422) {
      return json as import('@/types/api').WaterAnalysisApiResponse;
    }

    if (!response.ok) {
      throw new Error(json.message || 'Image analysis failed');
    }

    return json;
  }

  async quickWaterAssessment(imageUri: string) {
    const filename = imageUri.split('/').pop() || 'water_image.jpg';
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('water_image', { uri: imageUri, type: mimeType, name: filename } as any);

    await this.ensureToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseURL}/water-image/quick-assessment`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Quick assessment failed');
    }

    return response.json();
  }

  async getToken() {
    return this.token;
  }

  async request_(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, options);
  }

  isAuthenticated() {
    return !!this.token;
  }

  async getLeakageReports(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/leakage-reports${queryString}`);
  }

  async getLeakageReport(id: number) {
    return this.request(`/leakage-reports/${id}`);
  }

  async createLeakageReport(data: Record<string, any>) {
    return this.request('/leakage-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeLeakage(imageUri: string, conditions?: {
    pipe_condition?: string;
    corrosion_level?: string;
    joint_condition?: string;
  }) {
    const filename = imageUri.split('/').pop() || 'leakage.jpg';
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', { uri: imageUri, type: mimeType, name: filename } as any);
    if (conditions) {
      Object.entries(conditions).forEach(([k, v]) => { if (v) formData.append(k, v); });
    }

    await this.ensureToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseURL}/leakage/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Leakage analysis failed');
    }
    return response.json();
  }

  async reportToUtility(reportId: number) {
    return this.request(`/leakage-reports/${reportId}/report-to-utility`, { method: 'POST' });
  }

  async updateLeakageStatus(reportId: number, status: string) {
    return this.request(`/leakage-reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteLeakageReport(reportId: number) {
    return this.request(`/leakage-reports/${reportId}`, { method: 'DELETE' });
  }

  async getCommunityMap() {
    return this.request('/community/map');
  }

  async getCommunityReports() {
    return this.request('/community/reports');
  }

  async createCommunityReport(data: Record<string, any>) {
    return this.request('/community/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCommunityReport(id: number) {
    return this.request(`/community/reports/${id}`);
  }

  async getOutbreakAlerts() {
    return this.request('/community/outbreak-alerts');
  }

  async getCommunityDashboard() {
    return this.request('/community/dashboard');
  }

  async saveAnalysisResult(data: {
    safety_level: string;
    risk_score: number;
    confidence_score?: number;
    ai_provider?: string;
    ai_model?: string;
    result: string;
    observations?: string;
    source_type?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
    water_source_id?: number | string;
    vision_data?: string;
  }) {
    return this.request('/water-image/save-result', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWaterAnalyses() {
    return this.request('/water-analyses');
  }

  async getWaterAnalysesFeed() {
    return this.request('/water-analyses/feed');
  }

  async getWaterAnalysesBySource(sourceId: number) {
    return this.request(`/water-analyses/source/${sourceId}`);
  }

  async getWaterAnalysis(id: number) {
    return this.request(`/water-analyses/${id}`);
  }

  async ingestSensorData(data: Record<string, any>) {
    return this.request('/sensor-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendIoTReading(data: Record<string, any>) {
    return this.request('/iot/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitContactMessage(data: { name: string; email: string; subject?: string; message: string }) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, password: string, passwordConfirmation: string, token: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirmation: passwordConfirmation,
        token,
      }),
    });
  }
}

export default new ApiService();
