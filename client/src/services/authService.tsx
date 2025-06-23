import api from './api';
import type { User, ApiResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      { email, password }
    );

    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    }

    throw new Error(response.data.message || 'Login failed');
  },

  async register(userData: { email: string; password: string; role: string }): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Registration failed');
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // Hatalı veri varsa temizle
      localStorage.removeItem('user');
      return null;
    }
  },

  getToken(): string | null {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
      localStorage.removeItem('token');
      return null;
    }
  }
};