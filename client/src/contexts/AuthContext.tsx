import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedToken = authService.getAccessToken();
        const savedUser = authService.getCurrentUser();
        const refreshToken = authService.getRefreshToken();

        if (savedToken && savedUser && refreshToken) {
          // Token expire olmuş mu kontrol et
          if (authService.isTokenExpired(savedToken)) {
            try {
              console.log('Token expired, attempting refresh...');
              // Token refresh et
              const refreshResult = await authService.refreshToken();
              setUser(refreshResult.user);
              setToken(refreshResult.accessToken);
              console.log('Token refresh successful');
            } catch (refreshError) {
              // Refresh başarısızsa logout
              console.error('Initial token refresh failed:', refreshError);
              await authService.logout();
              setUser(null);
              setToken(null);
            }
          } else {
            // Token geçerliyse direkt set et
            console.log('Token is valid, setting user');
            setUser(savedUser);
            setToken(savedToken);
          }
        } else {
          // Token yoksa logout state'inde kal
          console.log('No valid tokens found');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Authentication initialization failed');
        await authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Attempting login...');
      const loginResult = await authService.login(email, password);

      setUser(loginResult.user);
      setToken(loginResult.accessToken);

      console.log('Login successful:', loginResult.user.email);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('Logging out...');

      await authService.logout();
      setUser(null);
      setToken(null);
      setError(null);

      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Logout hatası olsa bile state'i temizle
      setUser(null);
      setToken(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    loading,
    error, // Error'u da context'e ekle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};