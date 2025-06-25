import { useState, useCallback, useMemo } from 'react';
import { type LatLngExpression } from 'leaflet';
import { analyticsService } from '../services/analyticsService';
import type {
    DrivingSession,
    ExtendedRouteData,
    SessionFilters,
    RouteData,
} from '../types';

interface UseRouteHistoryReturn {
    // Data
    sessions: DrivingSession[];
    selectedRoutes: ExtendedRouteData[];
    loading: boolean;
    error: string | null;

    // Map state
    mapCenter: LatLngExpression;
    mapZoom: number;

    // Actions
    loadSessions: (filters: SessionFilters) => Promise<void>;
    addRoute: (sessionId: number) => Promise<void>;
    removeRoute: (sessionId: number) => void;
    clearRoutes: () => void;
    setError: (error: string | null) => void;
}

export const useRouteHistory = (): UseRouteHistoryReturn => {
    // State
    const [sessions, setSessions] = useState<DrivingSession[]>([]);
    const [selectedRoutes, setSelectedRoutes] = useState<ExtendedRouteData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([41.0082, 28.9784]);
    const [mapZoom, setMapZoom] = useState(10);

    // Route colors - memoized
    const routeColors = useMemo(() => [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
        '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
        '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'
    ], []);

    // Load sessions
    const loadSessions = useCallback(async (filters: SessionFilters) => {
        try {
            setLoading(true);
            setError(null);

            const response = await analyticsService.getSessions(1, 50, filters);

            // Filter only completed sessions
            const completedSessions = response.data.filter(session => !session.isActive);
            setSessions(completedSessions);

        } catch (err: any) {
            const errorMessage = err.message || 'Oturumlar yüklenirken hata oluştu';
            setError(errorMessage);
            console.error('Load sessions error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add route
    const addRoute = useCallback(async (sessionId: number) => {
        try {
            // Check if already loaded
            if (selectedRoutes.find(route => route.session.id === sessionId)) {
                return;
            }

            setLoading(true);
            const routeData = await analyticsService.getRouteData(sessionId);

            // Create extended route data with color
            const extendedRouteData: ExtendedRouteData = {
                session: routeData.session,
                locations: routeData.locations,
                stats: routeData.stats,
                color: routeColors[selectedRoutes.length % routeColors.length],
            };

            setSelectedRoutes(prev => [...prev, extendedRouteData]);

            // Update map center if first route and has locations
            if (selectedRoutes.length === 0 && routeData.locations.length > 0) {
                const firstLocation = routeData.locations[0];
                setMapCenter([firstLocation.latitude, firstLocation.longitude]);
                setMapZoom(14);
            }

        } catch (err: any) {
            const errorMessage = err.message || 'Rota verisi yüklenirken hata oluştu';
            setError(errorMessage);
            console.error('Add route error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedRoutes, routeColors]);

    // Remove route
    const removeRoute = useCallback((sessionId: number) => {
        setSelectedRoutes(prev => prev.filter(route => route.session.id !== sessionId));
    }, []);

    // Clear all routes
    const clearRoutes = useCallback(() => {
        setSelectedRoutes([]);
    }, []);

    // Set error
    const setErrorCallback = useCallback((error: string | null) => {
        setError(error);
    }, []);

    return {
        // Data
        sessions,
        selectedRoutes,
        loading,
        error,

        // Map state
        mapCenter,
        mapZoom,

        // Actions
        loadSessions,
        addRoute,
        removeRoute,
        clearRoutes,
        setError: setErrorCallback,
    };
};