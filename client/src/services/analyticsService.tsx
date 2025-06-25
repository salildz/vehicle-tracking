import api from './api';
import type {
  ApiResponse,
  DashboardStats,
  DailyStats,
  DrivingSession,
  RouteData,
  SessionFilters,
  PaginatedResponse,
} from '../types';

class AnalyticsService {
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<ApiResponse<DashboardStats>>(url);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch dashboard statistics');
  }

  async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await api.get<ApiResponse<DailyStats[]>>(
      `/analytics/daily?${params.toString()}`
    );

    if (response.data.success) {
      return response.data.data || [];
    }

    throw new Error(response.data.message || 'Failed to fetch daily statistics');
  }

  async getSessions(
    page = 1,
    limit = 10,
    filters?: SessionFilters
  ): Promise<PaginatedResponse<DrivingSession>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters
    if (filters?.driverId) params.append('driverId', filters.driverId.toString());
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ApiResponse<DrivingSession[]>>(
      `/analytics/sessions?${params.toString()}`
    );

    if (response.data.success) {
      return {
        data: response.data.data || [],
        total: response.data.meta?.pagination?.total || response.data.meta?.total || 0,
        page: response.data.meta?.pagination?.page || page,
        limit: response.data.meta?.pagination?.limit || limit,
        pages: response.data.meta?.pagination?.pages || Math.ceil((response.data.meta?.total || 0) / limit),
      };
    }

    throw new Error(response.data.message || 'Failed to fetch sessions');
  }

  async getRouteData(sessionId: number): Promise<RouteData> {
    const response = await api.get<ApiResponse<RouteData>>(
      `/analytics/route/${sessionId}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch route data');
  }
}

export const analyticsService = new AnalyticsService();