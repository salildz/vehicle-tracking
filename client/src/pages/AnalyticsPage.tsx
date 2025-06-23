import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    useTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Tabs,
    Tab,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Speed as SpeedIcon,
    Route as RouteIcon,
    DirectionsCar as CarIcon,
    Person as PersonIcon,
    GetApp as ExportIcon,
    Refresh as RefreshIcon,
    Analytics as AnalyticsIcon,
    Assessment as ReportIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import dayjs from 'dayjs';
import { analyticsService } from '../services/analyticsService';
import type { DailyStats, DrivingSession } from '../types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`analytics-tabpanel-${index}`}
            aria-labelledby={`analytics-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const AnalyticsPage: React.FC = () => {
    const theme = useTheme();

    // State management
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs(),
    });

    // Data states
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [sessionHistory, setSessionHistory] = useState<DrivingSession[]>([]);
    const [sessionTotal, setSessionTotal] = useState(0);
    const [sessionPage, setSessionPage] = useState(0);
    const [sessionRowsPerPage, setSessionRowsPerPage] = useState(10);

    // Filters
    const [driverFilter, setDriverFilter] = useState<number | ''>('');
    const [vehicleFilter, setVehicleFilter] = useState<number | ''>('');

    useEffect(() => {
        loadAnalyticsData();
    }, [dateRange, driverFilter, vehicleFilter, sessionPage, sessionRowsPerPage]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Paralel olarak veri çek - backend API'sine uygun
            const [dailyData, sessionData] = await Promise.all([
                analyticsService.getDailyStats(
                    dateRange.startDate.toISOString(),
                    dateRange.endDate.toISOString()
                ),
                analyticsService.getSessions(
                    sessionPage + 1,
                    sessionRowsPerPage,
                    {
                        startDate: dateRange.startDate.toISOString(),
                        endDate: dateRange.endDate.toISOString(),
                        ...(driverFilter && { driverId: driverFilter }),
                        ...(vehicleFilter && { vehicleId: vehicleFilter }),
                    }
                ),
            ]);

            setDailyStats(dailyData);
            setSessionHistory(sessionData.data);
            setSessionTotal(sessionData.total);
        } catch (err: any) {
            setError(err.message || 'Analytics verileri yüklenirken hata oluştu');
            console.error('Analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (field: 'startDate' | 'endDate', value: any) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const exportData = () => {
        // Export functionality - CSV veya Excel
        console.log('Export data...');
    };

    // Chart colors
    const chartColors = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info.main,
    };

    // Calculate summary statistics
    const summaryStats = {
        totalSessions: dailyStats.reduce((sum, day) => sum + day.sessionCount, 0),
        totalDistance: dailyStats.reduce((sum, day) => sum + day.totalDistance, 0),
        avgDistance: dailyStats.length > 0
            ? dailyStats.reduce((sum, day) => sum + day.totalDistance, 0) / Math.max(dailyStats.reduce((sum, day) => sum + day.sessionCount, 0), 1)
            : 0,
        uniqueDrivers: Math.max(...dailyStats.map(day => day.uniqueDrivers), 0),
        uniqueVehicles: Math.max(...dailyStats.map(day => day.uniqueVehicles), 0),
    };

    // Prepare chart data
    const chartData = dailyStats.map(stat => ({
        date: dayjs(stat.date).format('DD/MM'),
        sessions: stat.sessionCount,
        distance: Math.round(stat.totalDistance * 100) / 100,
        drivers: stat.uniqueDrivers,
        vehicles: stat.uniqueVehicles,
    }));

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Page Header */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Analytics & Raporlar
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Detaylı analiz ve raporlama araçları
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Başlangıç Tarihi"
                                value={dateRange.startDate}
                                onChange={(value) => handleDateRangeChange('startDate', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Bitiş Tarihi"
                                value={dateRange.endDate}
                                onChange={(value) => handleDateRangeChange('endDate', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Sürücü</InputLabel>
                                <Select
                                    value={driverFilter}
                                    label="Sürücü"
                                    onChange={(e) => setDriverFilter(e.target.value as number | '')}
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    {/* Driver options would be loaded from API */}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Araç</InputLabel>
                                <Select
                                    value={vehicleFilter}
                                    label="Araç"
                                    onChange={(e) => setVehicleFilter(e.target.value as number | '')}
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    {/* Vehicle options would be loaded from API */}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={loadAnalyticsData}
                                    size="small"
                                >
                                    Yenile
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<ExportIcon />}
                                    onClick={exportData}
                                    size="small"
                                >
                                    Export
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="primary" fontWeight={700}>
                                        {summaryStats.totalSessions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Oturum
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                                    <TimelineIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="success.main" fontWeight={700}>
                                        {Math.round(summaryStats.totalDistance)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam KM
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                                    <RouteIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                                        {Math.round(summaryStats.avgDistance)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Ortalama KM
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
                                    <SpeedIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="info.main" fontWeight={700}>
                                        {summaryStats.uniqueDrivers}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Aktif Sürücü
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>
                                    <PersonIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="secondary.main" fontWeight={700}>
                                        {summaryStats.uniqueVehicles}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Aktif Araç
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'secondary.light', width: 48, height: 48 }}>
                                    <CarIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
                        <Tab
                            icon={<TrendingUpIcon />}
                            label="Trendler"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<ReportIcon />}
                            label="Oturum Geçmişi"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<AnalyticsIcon />}
                            label="Performans"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Tab 1: Trends */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Daily Sessions Chart */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Box mb={2}>
                                <Typography variant="h6" fontWeight={600}>
                                    Günlük Oturum Trendi
                                </Typography>
                            </Box>
                            <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="sessions"
                                            stroke={chartColors.primary}
                                            fill={chartColors.primary}
                                            fillOpacity={0.6}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>

                        {/* Distance Distribution */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Box mb={2}>
                                <Typography variant="h6" fontWeight={600}>
                                    Mesafe Dağılımı
                                </Typography>
                            </Box>
                            <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData.filter(d => d.distance > 0)}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ date, distance }) => `${date}: ${distance}km`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="distance"
                                        >
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>

                        {/* Combined Metrics */}
                        <Grid size={{ xs: 12 }}>
                            <Box mb={2}>
                                <Typography variant="h6" fontWeight={600}>
                                    Karşılaştırmalı Analiz
                                </Typography>
                            </Box>
                            <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <RechartsTooltip />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="sessions"
                                            stroke={chartColors.primary}
                                            strokeWidth={2}
                                            name="Oturum Sayısı"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="distance"
                                            stroke={chartColors.success}
                                            strokeWidth={2}
                                            name="Mesafe (KM)"
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="drivers"
                                            stroke={chartColors.warning}
                                            strokeWidth={2}
                                            name="Sürücü Sayısı"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Tab 2: Session History */}
                <TabPanel value={tabValue} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Oturum ID</TableCell>
                                    <TableCell>Sürücü</TableCell>
                                    <TableCell>Araç</TableCell>
                                    <TableCell>Başlangıç</TableCell>
                                    <TableCell>Bitiş</TableCell>
                                    <TableCell>Mesafe</TableCell>
                                    <TableCell>Durum</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessionHistory.map((session) => (
                                    <TableRow key={session.id} hover>
                                        <TableCell>#{session.id}</TableCell>
                                        <TableCell>
                                            {session.driver ? `${session.driver.firstName} ${session.driver.lastName}` : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {session.vehicle ? session.vehicle.plateNumber : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(session.startTime).format('DD/MM/YYYY HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            {session.endTime ? dayjs(session.endTime).format('DD/MM/YYYY HH:mm') : 'Devam ediyor'}
                                        </TableCell>
                                        <TableCell>
                                            {Math.round(session.totalDistance * 100) / 100} km
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={session.isActive ? 'Aktif' : 'Tamamlandı'}
                                                color={session.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={sessionTotal}
                        rowsPerPage={sessionRowsPerPage}
                        page={sessionPage}
                        onPageChange={(_, newPage) => setSessionPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setSessionRowsPerPage(parseInt(event.target.value, 10));
                            setSessionPage(0);
                        }}
                        labelRowsPerPage="Sayfa başına:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                    />
                </TabPanel>

                {/* Tab 3: Performance */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                En Performanslı Günler
                            </Typography>
                            <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData.slice(-7)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="sessions" fill={chartColors.primary} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Mesafe Performansı
                            </Typography>
                            <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData.slice(-7)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="distance" fill={chartColors.success} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Card>
        </Box>
    );
};

export default AnalyticsPage;