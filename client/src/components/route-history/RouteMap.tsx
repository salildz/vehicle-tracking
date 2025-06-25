import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteData } from '../../types';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createStartIcon = () => new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="11" fill="#4caf50" stroke="white" stroke-width="2"/>
            <path d="M8 12l4-4 4 4-4 4z" fill="white"/>
        </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const createEndIcon = () => new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="11" fill="#f44336" stroke="white" stroke-width="2"/>
            <rect x="8" y="8" width="8" height="8" fill="white"/>
        </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

interface RouteMapProps {
    routes: (RouteData & { color: string })[];
    center: LatLngExpression;
    zoom: number;
}

export const RouteMap: React.FC<RouteMapProps> = ({ routes, center, zoom }) => {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Paper sx={{ height: 600, overflow: 'hidden' }}>
            {routes.length === 0 ? (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    bgcolor="grey.50"
                >
                    <Typography variant="h6" color="text.secondary">
                        Gösterilecek rota seçin
                    </Typography>
                </Box>
            ) : (
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Route Lines */}
                    {routes.map((route) => {
                        const positions: LatLngExpression[] = route.locations.map(loc => [
                            loc.latitude,
                            loc.longitude
                        ]);

                        if (positions.length < 2) return null;

                        return (
                            <Polyline
                                key={route.session.id}
                                positions={positions}
                                color={route.color}
                                weight={4}
                                opacity={0.8}
                            />
                        );
                    })}

                    {/* Start/End Markers */}
                    {routes.map((route) => {
                        if (route.locations.length === 0) return null;

                        const startLocation = route.locations[0];
                        const endLocation = route.locations[route.locations.length - 1];

                        return (
                            <React.Fragment key={`markers-${route.session.id}`}>
                                {/* Start Marker */}
                                <Marker
                                    position={[startLocation.latitude, startLocation.longitude]}
                                    icon={createStartIcon()}
                                >
                                    <Popup>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                Başlangıç
                                            </Typography>
                                            <Typography variant="body2">
                                                {route.session.vehicle?.plateNumber}
                                            </Typography>
                                            <Typography variant="caption">
                                                {formatDate(route.session.startTime)}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>

                                {/* End Marker */}
                                {startLocation !== endLocation && route.session.endTime && (
                                    <Marker
                                        position={[endLocation.latitude, endLocation.longitude]}
                                        icon={createEndIcon()}
                                    >
                                        <Popup>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    Bitiş
                                                </Typography>
                                                <Typography variant="body2">
                                                    {route.session.vehicle?.plateNumber}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {formatDate(route.session.endTime)}
                                                </Typography>
                                            </Box>
                                        </Popup>
                                    </Marker>
                                )}
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            )}
        </Paper>
    );
};