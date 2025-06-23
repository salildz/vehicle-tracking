import api from './api';
import type { DashboardStats, DrivingSession, LocationLog, ApiResponse } from '../types';

export const analyticsService = {
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<DashboardStats>>(
      `/analytics/dashboard?${params.toString()}`
    );
    return response.data.data || ({} as DashboardStats);
  },

  async getDailyStats(startDate: string, endDate: string): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(
      `/analytics/daily?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data || [];
  },

  async getSessions(
    page = 1,
    limit = 10,
    filters?: {
      driverId?: number;
      vehicleId?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ sessions: DrivingSession[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.driverId) params.append('driverId', filters.driverId.toString());
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ApiResponse<{ sessions: DrivingSession[]; total: number }>>(
      `/analytics/sessions?${params.toString()}`
    );
    return response.data.data || { sessions: [], total: 0 };
  },

  async getRouteData(sessionId: number): Promise<LocationLog[]> {
    const response = await api.get<ApiResponse<LocationLog[]>>(`/analytics/route/${sessionId}`);
    return response.data.data || [];
  }
};