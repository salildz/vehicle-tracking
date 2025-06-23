import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    useTheme,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    LinearProgress,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    DirectionsCar as CarIcon,
    PlayCircle as ActiveIcon,
    Route as RouteIcon,
    Speed as SpeedIcon,
    Schedule as TimeIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { analyticsService } from '../services/analyticsService';
import type { DashboardStats } from '../types';

const DashboardPage: React.FC = () => {
    const theme = useTheme();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await analyticsService.getDashboardStats();
            console.log('Dashboard data:', data);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Dashboard verileri yüklenirken hata oluştu');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Chip
                        label="Yeniden Dene"
                        onClick={loadDashboardData}
                        size="small"
                        variant="outlined"
                    />
                }
            >
                {error}
            </Alert>
        );
    }

    if (!stats) {
        return (
            <Alert severity="info">
                Dashboard verileri bulunamadı
            </Alert>
        );
    }

    // Chart colors
    const chartColors = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info.main,
    };

    const pieColors = [chartColors.primary, chartColors.secondary, chartColors.success, chartColors.warning, chartColors.error];

    return (
        <Box>
            {/* Page Header */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Araç takip sistemi genel bakış
                </Typography>
            </Box>

            {/* Stats Cards Grid */}
            <Grid container spacing={3} mb={4}>
                {/* Total Drivers */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `linear-gradient(135deg, ${chartColors.primary}20, ${chartColors.primary}10)`,
                                borderRadius: '0 0 0 100%',
                            }}
                        />
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="primary">
                                        {stats.summary.totalDrivers}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Toplam Sürücü
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: chartColors.primary, width: 48, height: 48 }}>
                                    <PeopleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Vehicles */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `linear-gradient(135deg, ${chartColors.secondary}20, ${chartColors.secondary}10)`,
                                borderRadius: '0 0 0 100%',
                            }}
                        />
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="secondary">
                                        {stats.summary.totalVehicles}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Toplam Araç
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: chartColors.secondary, width: 48, height: 48 }}>
                                    <CarIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active Sessions */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `linear-gradient(135deg, ${chartColors.success}20, ${chartColors.success}10)`,
                                borderRadius: '0 0 0 100%',
                            }}
                        />
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h3" fontWeight={700} sx={{ color: chartColors.success }}>
                                        {stats.summary.activeSessions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Aktif Oturum
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: chartColors.success, width: 48, height: 48 }}>
                                    <ActiveIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Distance */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `linear-gradient(135deg, ${chartColors.warning}20, ${chartColors.warning}10)`,
                                borderRadius: '0 0 0 100%',
                            }}
                        />
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h3" fontWeight={700} sx={{ color: chartColors.warning }}>
                                        {Math.round(stats.summary.totalDistance)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Toplam KM
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: chartColors.warning, width: 48, height: 48 }}>
                                    <RouteIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} mb={4}>
                {/* Top Drivers Chart */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                En Aktif Sürücüler
                            </Typography>
                            {stats.topDrivers.length > 0 ? (
                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={stats.topDrivers.slice(0, 5)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="firstName"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => [
                                                    name === 'sessionCount' ? `${value} Oturum` : `${value} KM`,
                                                    name === 'sessionCount' ? 'Oturum Sayısı' : 'Toplam Mesafe'
                                                ]}
                                                labelFormatter={(label) => `Sürücü: ${label}`}
                                            />
                                            <Bar dataKey="sessionCount" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    Henüz sürücü verisi bulunmamaktadır
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Vehicles Chart */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                En Çok Kullanılan Araçlar
                            </Typography>
                            {stats.topVehicles.length > 0 ? (
                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={stats.topVehicles.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ plateNumber, sessionCount }) => `${plateNumber} (${sessionCount})`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="sessionCount"
                                            >
                                                {stats.topVehicles.slice(0, 5).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} Oturum`, 'Kullanım Sayısı']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    Henüz araç verisi bulunmamaktadır
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Lists Section */}
            <Grid container spacing={3}>
                {/* Top Drivers List */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Sürücü Performansı
                            </Typography>
                            {stats.topDrivers.length > 0 ? (
                                <List>
                                    {stats.topDrivers.slice(0, 5).map((driver, index) => (
                                        <ListItem key={driver.driverId} divider={index < 4}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: pieColors[index % pieColors.length] }}>
                                                    {driver.firstName[0]}{driver.lastName[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${driver.firstName} ${driver.lastName}`}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" component="span">
                                                            {driver.sessionCount} oturum • {Math.round(driver.totalDistance)} km
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={(driver.totalDistance / Math.max(...stats.topDrivers.map(d => d.totalDistance))) * 100}
                                                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    Henüz sürücü performans verisi bulunmamaktadır
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Vehicles List */}
                <Grid size={{ xs: 12, lg: 6 }} >
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Araç Kullanım Oranları
                            </Typography>
                            {stats.topVehicles.length > 0 ? (
                                <List>
                                    {stats.topVehicles.slice(0, 5).map((vehicle, index) => (
                                        <ListItem key={vehicle.vehicleId} divider={index < 4}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: pieColors[index % pieColors.length] }}>
                                                    <CarIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${vehicle.plateNumber}`}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" component="span">
                                                            {vehicle.brand} {vehicle.model} • {vehicle.sessionCount} oturum
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={(vehicle.sessionCount / Math.max(...stats.topVehicles.map(v => v.sessionCount))) * 100}
                                                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    Henüz araç kullanım verisi bulunmamaktadır
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;