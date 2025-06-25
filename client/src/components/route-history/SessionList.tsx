import React, { useMemo } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Button,
    Chip,
    Box,
    CircularProgress,
} from '@mui/material';
import {
    Person as PersonIcon,
    DirectionsCar as CarIcon,
    Route as RouteIcon,
} from '@mui/icons-material';
import type { DrivingSession, ExtendedRouteData } from '../../types';

interface SessionListProps {
    sessions: DrivingSession[];
    selectedRoutes: ExtendedRouteData[];
    onAddRoute: (sessionId: number) => void;
    loading: boolean;
    type: 'driver' | 'vehicle';
}

export const SessionList: React.FC<SessionListProps> = React.memo(({
    sessions,
    selectedRoutes,
    onAddRoute,
    loading,
    type
}) => {
    // Format date helper
    const formatDate = useMemo(() => (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    // Format duration helper
    const formatDuration = useMemo(() => (startTime: string, endTime?: string) => {
        if (!endTime) return 'Devam ediyor';
        const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}s ${minutes}dk`;
    }, []);

    // Check if route is loaded
    const isRouteLoaded = useMemo(() => (sessionId: number) => {
        return selectedRoutes.some(route => route.session.id === sessionId);
    }, [selectedRoutes]);

    // Get display info based on type
    const getDisplayInfo = useMemo(() => (session: DrivingSession) => {
        if (type === 'driver') {
            return {
                icon: <CarIcon />,
                primary: session.vehicle
                    ? `${session.vehicle.plateNumber} - ${session.vehicle.brand} ${session.vehicle.model}`
                    : 'Araç bilgisi yok',
            };
        } else {
            return {
                icon: <PersonIcon />,
                primary: session.driver
                    ? `${session.driver.firstName} ${session.driver.lastName}`
                    : 'Sürücü bilgisi yok',
            };
        }
    }, [type]);

    // Loading state
    if (loading && sessions.length === 0) {
        return (
            <Card sx={{ maxHeight: 400, overflow: 'auto' }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Oturumlar yükleniyor...
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ maxHeight: 400, overflow: 'auto' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Oturum Listesi
                    </Typography>
                    <Chip
                        label={sessions.length}
                        color="primary"
                        size="small"
                    />
                </Box>

                {sessions.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            Seçilen kriterlere uygun oturum bulunamadı
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {sessions.map((session) => {
                            const { icon, primary } = getDisplayInfo(session);
                            const loaded = isRouteLoaded(session.id);

                            return (
                                <ListItem
                                    key={session.id}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                        '&:last-child': { mb: 0 },
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                            {icon}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                <Typography variant="subtitle2" noWrap>
                                                    {primary}
                                                </Typography>
                                                <Chip
                                                    label={`${Math.round(session.totalDistance || 0)} km`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(session.startTime)}
                                                    {session.endTime && ` - ${formatDate(session.endTime)}`}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Süre: {formatDuration(session.startTime, session.endTime)}
                                                </Typography>
                                            </Box>
                                        }
                                    />

                                    <Button
                                        variant={loaded ? "contained" : "outlined"}
                                        size="small"
                                        startIcon={<RouteIcon />}
                                        onClick={() => onAddRoute(session.id)}
                                        disabled={loaded || loading}
                                        color={loaded ? "success" : "primary"}
                                    >
                                        {loaded ? 'Yüklendi' : 'Rotayı Göster'}
                                    </Button>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </CardContent>
        </Card>
    );
});

SessionList.displayName = 'SessionList';