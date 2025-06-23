import api from './api';
import type { Vehicle, DrivingSession, ApiResponse } from '../types';

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const response = await api.get<ApiResponse<Vehicle[]>>('/vehicles');
    return response.data.data || [];
  },

  async getById(id: number): Promise<Vehicle> {
    const response = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch vehicle');
  },

  async create(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Vehicle> {
    const response = await api.post<ApiResponse<Vehicle>>('/vehicles', vehicleData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create vehicle');
  },

  async update(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, vehicleData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update vehicle');
  },

  async delete(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/vehicles/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete vehicle');
    }
  },

  async getActiveSessions(): Promise<DrivingSession[]> {
    const response = await api.get<ApiResponse<DrivingSession[]>>('/vehicles/active-sessions');
    return response.data.data || [];
  },

  async getStats(id: number, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<any>>(`/vehicles/${id}/stats?${params.toString()}`);
    return response.data.data || {};
  }
};