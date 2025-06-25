// client/src/components/route-history/SelectedRoutes.tsx
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Chip,
    Box,
    Tooltip,
} from '@mui/material';
import {
    Clear as ClearIcon,
    Timeline as TimelineIcon,
    Speed as SpeedIcon,
    Navigation as NavigationIcon,
} from '@mui/icons-material';
import type { RouteData } from '../../types';

interface SelectedRoutesProps {
    routes: (RouteData & { color: string })[];
    onRemoveRoute: (sessionId: number) => void;
    onClearAll: () => void;
}

export const SelectedRoutes: React.FC<SelectedRoutesProps> = ({
    routes,
    onRemoveRoute,
    onClearAll
}) => {
    if (routes.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Seçili Rotalar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        Henüz rota seçilmedi
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Seçili Rotalar ({routes.length})
                    </Typography>
                    <Button
                        startIcon={<ClearIcon />}
                        onClick={onClearAll}
                        size="small"
                        color="error"
                        variant="outlined"
                    >
                        Tümünü Temizle
                    </Button>
                </Box>

                <List dense>
                    {routes.map((route) => (
                        <ListItem
                            key={route.session.id}
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                borderLeft: 4,
                                borderLeftColor: route.color,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                        <Typography variant="subtitle2">
                                            {route.session.vehicle?.plateNumber} - {route.session.driver?.firstName} {route.session.driver?.lastName}
                                        </Typography>
                                        <Chip
                                            label={`${route.session.totalDistance} km`}
                                            size="small"
                                            style={{
                                                backgroundColor: route.color,
                                                color: 'white'
                                            }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <TimelineIcon fontSize="small" />
                                            <Typography variant="caption">
                                                {route.stats.totalPoints} nokta
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <SpeedIcon fontSize="small" />
                                            <Typography variant="caption">
                                                Max: {route.stats.maxSpeed} km/h
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <NavigationIcon fontSize="small" />
                                            <Typography variant="caption">
                                                Ort: {route.stats.avgSpeed} km/h
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                            <Tooltip title="Rotayı Kaldır">
                                <IconButton
                                    size="small"
                                    onClick={() => onRemoveRoute(route.session.id)}
                                    color="error"
                                >
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};