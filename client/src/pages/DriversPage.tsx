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
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    CreditCard as CardIcon,
    DirectionsCar as LicenseIcon,
    CalendarToday as CalendarIcon,
    MoreVert as MoreIcon,
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { driverService } from '../services/driverService';
import type { Driver } from '../types';

interface DriverFormData {
    rfidCardId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    licenseNumber: string;
    licenseExpiryDate: string;
}

const DriversPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [formData, setFormData] = useState<DriverFormData>({
        rfidCardId: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        licenseNumber: '',
        licenseExpiryDate: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await driverService.getAll();
            setDrivers(data);
        } catch (err: any) {
            setError(err.message || 'Sürücüler yüklenirken hata oluştu');
            console.error('Load drivers error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (driver?: Driver) => {
        if (driver) {
            setEditingDriver(driver);
            setFormData({
                rfidCardId: driver.rfidCardId,
                firstName: driver.firstName,
                lastName: driver.lastName,
                phone: driver.phone,
                email: driver.email || '',
                licenseNumber: driver.licenseNumber,
                licenseExpiryDate: dayjs(driver.licenseExpiryDate).format('YYYY-MM-DD'),
            });
        } else {
            setEditingDriver(null);
            setFormData({
                rfidCardId: '',
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                licenseNumber: '',
                licenseExpiryDate: '',
            });
        }
        setFormError(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDriver(null);
        setFormError(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        try {
            if (editingDriver) {
                await driverService.update(editingDriver.id, formData);
            } else {
                await driverService.create(formData);
            }

            await loadDrivers();
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.message || 'İşlem başarısız');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteDriver = async (driver: Driver) => {
        if (window.confirm(`${driver.firstName} ${driver.lastName} adlı sürücüyü silmek istediğinizden emin misiniz?`)) {
            try {
                await driverService.delete(driver.id);
                await loadDrivers();
                setAnchorEl(null);
            } catch (err: any) {
                setError(err.message || 'Sürücü silinirken hata oluştu');
            }
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, driver: Driver) => {
        setAnchorEl(event.currentTarget);
        setSelectedDriver(driver);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedDriver(null);
    };

    // Filter drivers
    const filteredDrivers = drivers.filter((driver) =>
        `${driver.firstName} ${driver.lastName} ${driver.phone} ${driver.email} ${driver.rfidCardId}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const paginatedDrivers = filteredDrivers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const isLicenseExpiringSoon = (expiryDate: string) => {
        const today = dayjs();
        const expiry = dayjs(expiryDate);
        const daysUntilExpiry = expiry.diff(today, 'day');
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    };

    const isLicenseExpired = (expiryDate: string) => {
        return dayjs(expiryDate).isBefore(dayjs());
    };

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
                    Sürücü Yönetimi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Sürücü kayıtlarını yönetin, yeni sürücü ekleyin ve bilgileri güncelleyin
                </Typography>
            </Box>

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
                                        {drivers.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Sürücü
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                                    <PersonIcon />
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
                                        {drivers.filter(d => d.isActive).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Aktif Sürücü
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                                    <ActiveIcon />
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
                                        {drivers.filter(d => isLicenseExpiringSoon(d.licenseExpiryDate)).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Ehliyet Süresi Dolacak
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
                                    <CalendarIcon />
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
                                    <Typography variant="h4" color="error.main" fontWeight={700}>
                                        {drivers.filter(d => isLicenseExpired(d.licenseExpiryDate)).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Ehliyet Süresi Dolmuş
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'error.light', width: 48, height: 48 }}>
                                    <BlockIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                        <TextField
                            placeholder="Sürücü ara..."
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
                            sx={{ minWidth: 300 }}
                        />

                        {!isMobile && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Yeni Sürücü
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Mobile View - Card List */}
            {isMobile ? (
                <Box>
                    {paginatedDrivers.map((driver) => (
                        <Card key={driver.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                    <Box display="flex" gap={2}>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {driver.firstName[0]}{driver.lastName[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                {driver.firstName} {driver.lastName}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{driver.phone}</Typography>
                                            </Box>
                                            {driver.email && (
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <EmailIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">{driver.email}</Typography>
                                                </Box>
                                            )}
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <CardIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{driver.rfidCardId}</Typography>
                                            </Box>
                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                <Chip
                                                    label={driver.isActive ? 'Aktif' : 'Pasif'}
                                                    color={driver.isActive ? 'success' : 'default'}
                                                    size="small"
                                                />
                                                {isLicenseExpired(driver.licenseExpiryDate) && (
                                                    <Chip label="Ehliyet Süresi Dolmuş" color="error" size="small" />
                                                )}
                                                {isLicenseExpiringSoon(driver.licenseExpiryDate) && !isLicenseExpired(driver.licenseExpiryDate) && (
                                                    <Chip label="Ehliyet Süresi Dolacak" color="warning" size="small" />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <IconButton onClick={(e) => handleMenuClick(e, driver)}>
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
                                <TableCell>Sürücü</TableCell>
                                <TableCell>İletişim</TableCell>
                                <TableCell>RFID Kart</TableCell>
                                <TableCell>Ehliyet</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell align="center">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedDrivers.map((driver) => (
                                <TableRow key={driver.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                {driver.firstName[0]}{driver.lastName[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {driver.firstName} {driver.lastName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {driver.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{driver.phone}</Typography>
                                            </Box>
                                            {driver.email && (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <EmailIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">{driver.email}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            icon={<CardIcon />}
                                            label={driver.rfidCardId}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {driver.licenseNumber}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color={
                                                    isLicenseExpired(driver.licenseExpiryDate)
                                                        ? 'error'
                                                        : isLicenseExpiringSoon(driver.licenseExpiryDate)
                                                            ? 'warning.main'
                                                            : 'text.secondary'
                                                }
                                            >
                                                {dayjs(driver.licenseExpiryDate).format('DD.MM.YYYY')}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            <Chip
                                                label={driver.isActive ? 'Aktif' : 'Pasif'}
                                                color={driver.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {isLicenseExpired(driver.licenseExpiryDate) && (
                                                <Chip label="Süresi Dolmuş" color="error" size="small" />
                                            )}
                                            {isLicenseExpiringSoon(driver.licenseExpiryDate) && !isLicenseExpired(driver.licenseExpiryDate) && (
                                                <Chip label="Süresi Dolacak" color="warning" size="small" />
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <Tooltip title="Düzenle">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(driver)}
                                                    color="primary"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sil">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteDriver(driver)}
                                                    color="error"
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
                count={filteredDrivers.length}
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
                    if (selectedDriver) handleOpenDialog(selectedDriver);
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Düzenle
                </MenuItem>
                <MenuItem onClick={() => {
                    if (selectedDriver) handleDeleteDriver(selectedDriver);
                    handleMenuClose();
                }}>
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
                        {editingDriver ? 'Sürücü Düzenle' : 'Yeni Sürücü Ekle'}
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
                                    label="RFID Kart ID"
                                    value={formData.rfidCardId}
                                    onChange={(e) => setFormData({ ...formData, rfidCardId: e.target.value })}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CardIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Ehliyet Numarası"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LicenseIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Ad"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Soyad"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Telefon"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Email (Opsiyonel)"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="Ehliyet Son Kullanma Tarihi"
                                    type="date"
                                    value={formData.licenseExpiryDate}
                                    onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                                    required
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon />
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
                            {editingDriver ? 'Güncelle' : 'Ekle'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default DriversPage;