import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Tooltip,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Fab,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    DirectionsCar as CarIcon,
    DateRange as YearIcon,
    Memory as DeviceIcon,
    DriveEta as PlateIcon,
    PlayCircle as ActiveIcon,
    PauseCircle as InactiveIcon,
    MoreVert as MoreIcon,
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as AvailableIcon,
    Speed as SpeedIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, DrivingSession } from '../types';

interface VehicleFormData {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    esp32DeviceId: string;
}

const VehiclesPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeSessions, setActiveSessions] = useState<DrivingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState<VehicleFormData>({
        plateNumber: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        esp32DeviceId: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Popular brands for autocomplete
    const popularBrands = [
        'Toyota', 'Honda', 'Ford', 'Volkswagen', 'Renault', 'Fiat', 'Hyundai',
        'Peugeot', 'Opel', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Skoda'
    ];

    useEffect(() => {
        loadVehicles();
        loadActiveSessions();
    }, []);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await vehicleService.getAll();
            setVehicles(data);
        } catch (err: any) {
            setError(err.message || 'Araçlar yüklenirken hata oluştu');
            console.error('Load vehicles error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveSessions = async () => {
        try {
            const sessions = await vehicleService.getActiveSessions();
            setActiveSessions(sessions);
        } catch (err: any) {
            console.error('Load active sessions error:', err);
        }
    };

    const handleOpenDialog = (vehicle?: Vehicle) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({
                plateNumber: vehicle.plateNumber,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                esp32DeviceId: vehicle.esp32DeviceId,
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                plateNumber: '',
                brand: '',
                model: '',
                year: new Date().getFullYear(),
                esp32DeviceId: '',
            });
        }
        setFormError(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingVehicle(null);
        setFormError(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        try {
            if (editingVehicle) {
                await vehicleService.update(editingVehicle.id, formData);
            } else {
                await vehicleService.create(formData);
            }

            await loadVehicles();
            await loadActiveSessions();
            handleCloseDialog();
        } catch (err: any) {
            //setFormError(err.message || 'İşlem başarısız');
            setFormError("Temel araç bilgileri benzersiz olmalıdır");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteVehicle = async (vehicle: Vehicle) => {
        if (window.confirm(`${vehicle.plateNumber} plakalı aracı silmek istediğinizden emin misiniz?`)) {
            try {
                await vehicleService.delete(vehicle.id);
                await loadVehicles();
                setAnchorEl(null);
            } catch (err: any) {
                setError(err.message || 'Araç silinirken hata oluştu');
            }
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, vehicle: Vehicle) => {
        setAnchorEl(event.currentTarget);
        setSelectedVehicle(vehicle);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedVehicle(null);
    };

    // Check if vehicle is currently in use
    const isVehicleInUse = (vehicleId: number) => {
        return activeSessions.some(session => session.vehicleId === vehicleId);
    };

    // Filter vehicles
    const filteredVehicles = vehicles.filter((vehicle) => {
        const matchesSearch = `${vehicle.plateNumber} ${vehicle.brand} ${vehicle.model} ${vehicle.esp32DeviceId}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && vehicle.isActive) ||
            (filterStatus === 'inactive' && !vehicle.isActive);

        return matchesSearch && matchesStatus;
    });

    const paginatedVehicles = filteredVehicles.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="primary" fontWeight={700}>
                                        {vehicles.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Araç
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                                    <CarIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="success.main" fontWeight={700}>
                                        {vehicles.filter(v => v.isActive).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Aktif Araç
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                                    <AvailableIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                                        {activeSessions.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Kullanımda
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
                                    <ActiveIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }} >
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" color="info.main" fontWeight={700}>
                                        {vehicles.filter(v => v.isActive && !isVehicleInUse(v.id)).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Müsait Araç
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>
                                    <InactiveIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                            <TextField
                                placeholder="Araç ara..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ minWidth: 250 }}
                            />

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Durum</InputLabel>
                                <Select
                                    value={filterStatus}
                                    label="Durum"
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                >
                                    <MenuItem value="all">Tümü</MenuItem>
                                    <MenuItem value="active">Aktif</MenuItem>
                                    <MenuItem value="inactive">Pasif</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {!isMobile && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Yeni Araç
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Mobile View - Card List */}
            {isMobile ? (
                <Box>
                    {paginatedVehicles.map((vehicle) => (
                        <Card key={vehicle.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                    <Box display="flex" gap={2} flex={1}>
                                        <Avatar
                                            sx={{
                                                bgcolor: vehicle.isActive ? 'primary.main' : 'grey.500',
                                                width: 48,
                                                height: 48
                                            }}
                                        >
                                            <CarIcon />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Typography variant="h6" fontWeight={600}>
                                                    {vehicle.plateNumber}
                                                </Typography>
                                                {isVehicleInUse(vehicle.id) && (
                                                    <Chip label="Kullanımda" color="warning" size="small" />
                                                )}
                                            </Box>

                                            <Typography variant="body1" color="text.primary" gutterBottom>
                                                {vehicle.brand} {vehicle.model} ({vehicle.year})
                                            </Typography>

                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <DeviceIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {vehicle.esp32DeviceId}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                <Chip
                                                    label={vehicle.isActive ? 'Aktif' : 'Pasif'}
                                                    color={vehicle.isActive ? 'success' : 'default'}
                                                    size="small"
                                                />
                                                {isVehicleInUse(vehicle.id) && (
                                                    <Chip
                                                        label="Kullanımda"
                                                        color="warning"
                                                        size="small"
                                                        icon={<SpeedIcon />}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <IconButton onClick={(e) => handleMenuClick(e, vehicle)}>
                                        <MoreIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                /* Desktop View - Data Table */
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Araç</TableCell>
                                <TableCell>Marka/Model</TableCell>
                                <TableCell>Yıl</TableCell>
                                <TableCell>ESP32 Cihaz</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell align="center">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedVehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Badge
                                                badgeContent={isVehicleInUse(vehicle.id) ? '●' : null}
                                                color="warning"
                                                variant="dot"
                                            >
                                                <Avatar
                                                    sx={{
                                                        bgcolor: vehicle.isActive ? 'primary.main' : 'grey.500',
                                                        width: 40,
                                                        height: 40
                                                    }}
                                                >
                                                    <CarIcon />
                                                </Avatar>
                                            </Badge>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {vehicle.plateNumber}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {vehicle.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Typography variant="body1" fontWeight={500}>
                                                {vehicle.brand}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {vehicle.model}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            icon={<YearIcon />}
                                            label={vehicle.year}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {vehicle.esp32DeviceId}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            <Chip
                                                label={vehicle.isActive ? 'Aktif' : 'Pasif'}
                                                color={vehicle.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {isVehicleInUse(vehicle.id) && (
                                                <Chip
                                                    label="Kullanımda"
                                                    color="warning"
                                                    size="small"
                                                    icon={<SpeedIcon />}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <Tooltip title="Düzenle">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(vehicle)}
                                                    color="primary"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sil">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteVehicle(vehicle)}
                                                    color="error"
                                                    disabled={isVehicleInUse(vehicle.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredVehicles.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage="Sayfa başına:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />

            {/* Floating Action Button - Mobile */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={() => handleOpenDialog()}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1000,
                    }}
                >
                    <AddIcon />
                </Fab>
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    if (selectedVehicle) handleOpenDialog(selectedVehicle);
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Düzenle
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedVehicle) handleDeleteVehicle(selectedVehicle);
                        handleMenuClose();
                    }}
                    disabled={selectedVehicle ? isVehicleInUse(selectedVehicle.id) : false}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Sil
                </MenuItem>
            </Menu>

            {/* Add/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <form onSubmit={handleFormSubmit}>
                    <DialogTitle>
                        {editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
                    </DialogTitle>

                    <DialogContent>
                        {formError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formError}
                            </Alert>
                        )}

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Plaka Numarası"
                                    value={formData.plateNumber}
                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                                    required
                                    placeholder="34 ABC 123"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PlateIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="ESP32 Cihaz ID"
                                    value={formData.esp32DeviceId}
                                    onChange={(e) => setFormData({ ...formData, esp32DeviceId: e.target.value })}
                                    required
                                    placeholder="ESP32_001"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DeviceIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Marka"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                    autoComplete="brands"
                                />
                                <datalist id="brands">
                                    {popularBrands.map((brand) => (
                                        <option key={brand} value={brand} />
                                    ))}
                                </datalist>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Model"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Yıl"
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    required
                                    inputProps={{
                                        min: 1990,
                                        max: new Date().getFullYear() + 1,
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <YearIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={formLoading}
                            startIcon={formLoading ? <CircularProgress size={20} /> : null}
                        >
                            {editingVehicle ? 'Güncelle' : 'Ekle'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default VehiclesPage;