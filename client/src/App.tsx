import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Theme
import { theme } from './theme/theme';

// Components
import { PrivateRoute } from './components/common/PrivateRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DriversPage from './pages/DriversPage';
import VehiclesPage from './pages/VehiclesPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RouteHistoryPage from './pages/RouteHistoryPage';

// Global styles
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        boxSizing: 'border-box',
      },
      body: {
        margin: 0,
        fontFamily: theme.typography.fontFamily,
      },
      '#root': {
        minHeight: '100vh',
      },
    }}
  />
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <CssBaseline />
            {globalStyles}
            <AuthProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Private Routes */}
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <DashboardPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/drivers"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <DriversPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/vehicles"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <VehiclesPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/live-tracking"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <LiveTrackingPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <AnalyticsPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/route-history"
                    element={
                      <PrivateRoute>
                        <DashboardLayout>
                          <RouteHistoryPage />
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />


                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;