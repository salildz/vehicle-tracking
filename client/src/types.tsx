export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: number;
  rfidCardId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  esp32DeviceId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrivingSession {
  id: number;
  driverId: number;
  vehicleId: number;
  startTime: string;
  endTime?: string;
  startLocation: any;
  endLocation?: any;
  totalDistance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  driver?: Driver;
  vehicle?: Vehicle;
}

export interface LocationLog {
  id: number;
  sessionId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: string;
  };
}

// Backend'den gelen dashboard stats formatına uygun
export interface DashboardStats {
  summary: {
    totalDrivers: number;
    totalVehicles: number;
    activeSessions: number;
    totalSessions: number;
    totalDistance: number;
    avgDistance: number;
  };
  topDrivers: Array<{
    driverId: number;
    sessionCount: number;
    totalDistance: number;
    firstName: string;
    lastName: string;
  }>;
  topVehicles: Array<{
    vehicleId: number;
    sessionCount: number;
    totalDistance: number;
    plateNumber: string;
    brand: string;
    model: string;
  }>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface DailyStats {
  date: string;
  sessionCount: number;
  totalDistance: number;
  uniqueDrivers: number;
  uniqueVehicles: number;
}

export interface DashboardStats {
  summary: {
    totalDrivers: number;
    totalVehicles: number;
    activeSessions: number;
    totalSessions: number;
    totalDistance: number;
    avgDistance: number;
  };
  topDrivers: Array<{
    driverId: number;
    sessionCount: number;
    totalDistance: number;
    firstName: string;
    lastName: string;
  }>;
  topVehicles: Array<{
    vehicleId: number;
    sessionCount: number;
    totalDistance: number;
    plateNumber: string;
    brand: string;
    model: string;
  }>;
}

// Route data için
export interface RouteData {
  session: DrivingSession;
  locations: LocationLog[];
  stats: {
    totalPoints: number;
    duration: number | null;
    maxSpeed: number;
    avgSpeed: number;
  };
}