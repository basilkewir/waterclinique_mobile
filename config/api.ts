const API_CONFIG = {
  baseURL: __DEV__
    ? 'http://192.168.20.42:8001/api'
    : 'https://watercliniq.com/api',
  timeout: 30000,
};

export default API_CONFIG;
