import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    Grid,
    Alert,
    Tabs,
    Tab,
    Divider,
    Paper,
} from '@mui/material';
import {
    Person as PersonIcon,
    DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { RouteFilter } from '../components/route-history/RouteFilter';
import { SessionList } from '../components/route-history/SessionList';
import { RouteMap } from '../components/route-history/RouteMap';
import { SelectedRoutes } from '../components/route-history/SelectedRoutes';
import { useRouteHistory } from '../hooks/useRouteHistory';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ height: '100%' }}>
        {value === index && children}
    </div>
);

const RouteHistoryPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const {
        sessions,
        selectedRoutes,
        loading,
        error,
        loadSessions,
        addRoute,
        removeRoute,
        clearRoutes,
        mapCenter,
        mapZoom,
        setError,
    } = useRouteHistory();

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            {/* Header */}
            <Box mb={3}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Rota Geçmişi Analizi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Sürücü ve araç bazlı geçmiş rota verilerini analiz edin
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Tab Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                >
                    <Tab
                        label="Sürücü Bazlı Analiz"
                        icon={<PersonIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Araç Bazlı Analiz"
                        icon={<CarIcon />}
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Left Panel - Controls */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* Filter Section */}
                        <TabPanel value={tabValue} index={0}>
                            <RouteFilter
                                type="driver"
                                onSearch={loadSessions}
                                loading={loading}
                            />
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <RouteFilter
                                type="vehicle"
                                onSearch={loadSessions}
                                loading={loading}
                            />
                        </TabPanel>

                        {/* Session List */}
                        <SessionList
                            sessions={sessions}
                            selectedRoutes={selectedRoutes}
                            onAddRoute={addRoute}
                            loading={loading}
                            type={tabValue === 0 ? 'driver' : 'vehicle'}
                        />

                        <Divider />

                        {/* Selected Routes */}
                        <SelectedRoutes
                            routes={selectedRoutes}
                            onRemoveRoute={removeRoute}
                            onClearAll={clearRoutes}
                        />
                    </Box>
                </Grid>

                {/* Right Panel - Map */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Box position="sticky" top={24}>
                        <RouteMap
                            routes={selectedRoutes}
                            center={mapCenter}
                            zoom={mapZoom}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default RouteHistoryPage;