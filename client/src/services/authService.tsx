import api from './api';
import type { User } from '../types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const data = response.data.data;

      // Token'ları localStorage'a kaydet
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login successful, tokens saved');
      return data;
    } catch (error: any) {
      console.error('Login service error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  },

  async refreshToken(): Promise<LoginResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Attempting token refresh...');
      const response = await api.post('/auth/refresh', { refreshToken });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Token refresh failed');
      }

      const data = response.data.data;

      // Yeni token'ları kaydet
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('Token refresh successful');
      return data;
    } catch (error: any) {
      console.error('Refresh token service error:', error);
      // Refresh başarısızsa localStorage'ı temizle
      this.clearTokens();
      throw new Error(error.response?.data?.message || error.message || 'Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout service error:', error);
      // Logout hatası olsa bile devam et
    } finally {
      // Her durumda localStorage'ı temizle
      this.clearTokens();
    }
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    console.log('Tokens cleared from localStorage');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;

      if (isExpired) {
        console.log('Token is expired');
      }

      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },
};