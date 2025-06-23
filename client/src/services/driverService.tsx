import api from './api';
import type { Driver, ApiResponse } from '../types';

export const driverService = {
  async getAll(): Promise<Driver[]> {
    const response = await api.get<ApiResponse<Driver[]>>('/drivers');
    return response.data.data || [];
  },

  async getById(id: number): Promise<Driver> {
    const response = await api.get<ApiResponse<Driver>>(`/drivers/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch driver');
  },

  async create(driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Driver> {
    const response = await api.post<ApiResponse<Driver>>('/drivers', driverData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create driver');
  },

  async update(id: number, driverData: Partial<Driver>): Promise<Driver> {
    const response = await api.put<ApiResponse<Driver>>(`/drivers/${id}`, driverData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update driver');
  },

  async delete(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/drivers/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete driver');
    }
  },

  async getStats(id: number, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<any>>(`/drivers/${id}/stats?${params.toString()}`);
    return response.data.data || {};
  }
};