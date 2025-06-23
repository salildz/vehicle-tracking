import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton,
    Drawer,
    useTheme,
    useMediaQuery,
    Badge,
    CircularProgress,
    Alert,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Switch,
    FormControlLabel,
    Slider,
    ListItemButton,
} from '@mui/material';
import {
    DirectionsCar as CarIcon,
    Person as PersonIcon,
    Speed as SpeedIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    Navigation as NavigationIcon,
    AccessTime as TimeIcon,
    Fullscreen as FullscreenIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io, { type Socket } from 'socket.io-client';
import { vehicleService } from '../services/vehicleService';
import { analyticsService } from '../services/analyticsService';
import type { DrivingSession, LocationLog } from '../types';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom car icon
const createCarIcon = (color: string = '#1976d2', isActive: boolean = true) => {
    return new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="11" fill="${isActive ? color : '#9e9e9e'}" stroke="white" stroke-width="2"/>
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="white"/>
      </svg>
    `)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

// Extended interface for live vehicle data
interface LiveVehicleData extends DrivingSession {
    currentLocation?: LocationLog;
    lastUpdate?: string;
}

const LiveTrackingPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [activeSessions, setActiveSessions] = useState<LiveVehicleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicleData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([41.0082, 28.9784]); // Istanbul default
    const [mapZoom, setMapZoom] = useState(12);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5); // seconds
    const [showTrails, setShowTrails] = useState(false);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        loadActiveSessions();
        initializeWebSocket();

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    }, [autoRefresh, refreshInterval]);

    const loadActiveSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const sessions = await vehicleService.getActiveSessions();

            // Her aktif oturum için son konum bilgisini al
            const sessionsWithLocation = await Promise.all(
                sessions.map(async (session) => {
                    try {
                        const routeData = await analyticsService.getRouteData(session.id);
                        const lastLocation = routeData.locations[routeData.locations.length - 1];
                        return {
                            ...session,
                            currentLocation: lastLocation,
                            lastUpdate: new Date().toISOString(),
                        } as LiveVehicleData;
                    } catch (err) {
                        console.error(`Failed to get location for session ${session.id}:`, err);
                        return session as LiveVehicleData;
                    }
                })
            );

            setActiveSessions(sessionsWithLocation);

            // İlk araç varsa harita merkezini ona ayarla
            if (sessionsWithLocation.length > 0 && sessionsWithLocation[0].currentLocation) {
                const firstLocation = sessionsWithLocation[0].currentLocation;
                setMapCenter([firstLocation.latitude, firstLocation.longitude]);
            }
        } catch (err: any) {
            setError(err.message || 'Aktif oturumlar yüklenirken hata oluştu');
            console.error('Load active sessions error:', err);
        } finally {
            setLoading(false);
        }
    };

    const initializeWebSocket = () => {
        try {
            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            socketRef.current = io(SOCKET_URL);

            socketRef.current.on('connect', () => {
                console.log('WebSocket connected');
            });

            socketRef.current.on('locationUpdate', (data: any) => {
                console.log('Location update received:', data);
                updateVehicleLocation(data);
            });

            socketRef.current.on('sessionStart', () => {
                console.log('Session started');
                loadActiveSessions(); // Refresh all sessions
            });

            socketRef.current.on('sessionEnd', () => {
                console.log('Session ended');
                loadActiveSessions(); // Refresh all sessions
            });

            socketRef.current.on('disconnect', () => {
                console.log('WebSocket disconnected');
            });

            socketRef.current.on('error', (error: any) => {
                console.error('WebSocket error:', error);
            });
        } catch (err) {
            console.error('WebSocket initialization error:', err);
        }
    };

    const updateVehicleLocation = (locationData: any) => {
        setActiveSessions(prev =>
            prev.map(session => {
                if (session.id === locationData.sessionId) {
                    return {
                        ...session,
                        currentLocation: locationData,
                        lastUpdate: new Date().toISOString(),
                    };
                }
                return session;
            })
        );
    };

    const startAutoRefresh = () => {
        stopAutoRefresh();
        intervalRef.current = window.setInterval(() => {
            loadActiveSessions();
        }, refreshInterval * 1000);
    };

    const stopAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const cleanup = () => {
        stopAutoRefresh();
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const handleVehicleSelect = (vehicle: LiveVehicleData) => {
        setSelectedVehicle(vehicle);
        if (vehicle.currentLocation) {
            setMapCenter([vehicle.currentLocation.latitude, vehicle.currentLocation.longitude]);
            setMapZoom(15);
        }
    };

    const formatLastUpdate = (lastUpdate?: string) => {
        if (!lastUpdate) return 'Bilinmiyor';
        const diff = Date.now() - new Date(lastUpdate).getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return `${seconds} saniye önce`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} dakika önce`;
        const hours = Math.floor(minutes / 60);
        return `${hours} saat önce`;
    };

    const getVehicleStatusColor = (vehicle: LiveVehicleData): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        if (!vehicle.currentLocation) return 'default';
        const lastUpdate = new Date(vehicle.lastUpdate || 0).getTime();
        const diff = Date.now() - lastUpdate;
        const minutes = diff / (1000 * 60);

        if (minutes < 2) return 'success';
        if (minutes < 10) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={40} />
            </Box>
        );
    }

    const sidebarContent = (
        <Box sx={{ width: isMobile ? '100vw' : 350, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                        Canlı Takip
                    </Typography>
                    {isMobile && (
                        <IconButton onClick={() => setSidebarOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>

                {/* Stats */}
                <Box display="flex" gap={1} mt={2}>
                    <Chip
                        label={`${activeSessions.length} Aktif`}
                        color="primary"
                        size="small"
                    />
                    <Chip
                        label={`${activeSessions.filter(v => v.currentLocation).length} Online`}
                        color="success"
                        size="small"
                    />
                </Box>
            </Box>

            {/* Controls */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Takip Ayarları</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={autoRefresh}
                                    onChange={(_, checked) => setAutoRefresh(checked)}
                                />
                            }
                            label="Otomatik Yenileme"
                        />

                        {autoRefresh && (
                            <Box>
                                <Typography variant="body2" gutterBottom>
                                    Yenileme Sıklığı: {refreshInterval} saniye
                                </Typography>
                                <Slider
                                    value={refreshInterval}
                                    onChange={(_, value) => setRefreshInterval(value as number)}
                                    min={1}
                                    max={30}
                                    step={1}
                                    marks={[
                                        { value: 1, label: '1s' },
                                        { value: 10, label: '10s' },
                                        { value: 30, label: '30s' },
                                    ]}
                                />
                            </Box>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showTrails}
                                    onChange={(_, checked) => setShowTrails(checked)}
                                />
                            }
                            label="Rota İzlerini Göster"
                        />

                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadActiveSessions}
                            size="small"
                        >
                            Manuel Yenile
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Vehicle List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {activeSessions.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                            Şu anda aktif oturum bulunmamaktadır
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {activeSessions.map((session) => (
                            <ListItem
                                key={session.id}
                                disablePadding
                                sx={{
                                    borderLeft: selectedVehicle?.id === session.id ? 3 : 0,
                                    borderColor: 'primary.main',
                                }}
                            >
                                <ListItemButton
                                    onClick={() => handleVehicleSelect(session)}
                                    selected={selectedVehicle?.id === session.id}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            badgeContent="●"
                                            color={getVehicleStatusColor(session)}
                                            variant="dot"
                                        >
                                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                                <CarIcon />
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {session.vehicle?.plateNumber || 'N/A'}
                                                </Typography>
                                                {session.currentLocation && (
                                                    <Chip
                                                        label={`${Math.round(session.currentLocation.speed || 0)} km/h`}
                                                        size="small"
                                                        color={(session.currentLocation.speed || 0) > 50 ? 'warning' : 'default'}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sürücü: {session.driver?.firstName} {session.driver?.lastName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Son güncelleme: {formatLastUpdate(session.lastUpdate)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar */}
            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                anchor="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                ModalProps={{
                    keepMounted: true, // Better mobile performance
                }}
                PaperProps={{
                    sx: { position: 'relative' },
                }}
            >
                {sidebarContent}
            </Drawer>

            {/* Map Container */}
            <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
                {/* Map Controls */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {!sidebarOpen && (
                        <IconButton
                            onClick={() => setSidebarOpen(true)}
                            sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
                        >
                            <FilterIcon />
                        </IconButton>
                    )}

                    <IconButton
                        onClick={() => setMapZoom(12)}
                        sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
                    >
                        <FullscreenIcon />
                    </IconButton>
                </Box>

                {/* Map */}
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Vehicle Markers */}
                    {activeSessions.map((session) => {
                        if (!session.currentLocation) return null;

                        const position: LatLngExpression = [
                            session.currentLocation.latitude,
                            session.currentLocation.longitude
                        ];

                        const statusColor = getVehicleStatusColor(session);
                        const markerColor = statusColor === 'success' ? '#4caf50' :
                            statusColor === 'warning' ? '#ff9800' : '#f44336';

                        return (
                            <Marker
                                key={session.id}
                                position={position}
                                icon={createCarIcon(markerColor, true)}
                            >
                                <Popup>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                            {session.vehicle?.plateNumber || 'N/A'}
                                        </Typography>

                                        <Box display="flex" flexDirection="column" gap={1}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <PersonIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {session.driver?.firstName} {session.driver?.lastName}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1}>
                                                <SpeedIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {Math.round(session.currentLocation.speed || 0)} km/h
                                                </Typography>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1}>
                                                <TimeIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {formatLastUpdate(session.lastUpdate)}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1}>
                                                <NavigationIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {session.currentLocation.heading || 0}°
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </Box>
        </Box>
    );
};

export default LiveTrackingPage;