import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let retryCount = 0;

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    retryCount = 0; // ✅ Başarılı response'ta counter'ı sıfırla
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 veya 403 hatası ve retry edilmemişse
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {

      // Auth endpoint'lerine refresh gönderme
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      // ✅ Max retry sayısını kontrol et
      if (retryCount >= 2) {
        console.error('Max retry count reached, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      retryCount++; // ✅ Retry count artır

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log(`API interceptor: Attempting token refresh... (attempt ${retryCount})`);
        const response = await api.post('/auth/refresh', { refreshToken });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Yeni token'ları kaydet
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));

          // Queue'daki request'leri yeni token ile çalıştır
          onRefreshed(accessToken);

          // Original request'i yeni token ile tekrar dene
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('API interceptor: Token refresh successful, retrying request');
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        console.error('API interceptor: Token refresh failed:', refreshError);

        // Refresh başarısızsa logout et
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;