import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';
import type { Driver, Vehicle, SessionFilters } from '../../types';

interface RouteFilterProps {
    type: 'driver' | 'vehicle';
    onSearch: (filters: SessionFilters) => void;
    loading: boolean;
}

export const RouteFilter: React.FC<RouteFilterProps> = React.memo(({
    type,
    onSearch,
    loading
}) => {
    // State
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedId, setSelectedId] = useState<number | ''>('');
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
    const [dataLoading, setDataLoading] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Reset selection when type changes
    useEffect(() => {
        setSelectedId('');
    }, [type]);

    // Load drivers and vehicles
    const loadData = useCallback(async () => {
        try {
            setDataLoading(true);
            const [driversData, vehiclesData] = await Promise.all([
                driverService.getAll(),
                vehicleService.getAll()
            ]);

            setDrivers(driversData.filter(d => d.isActive));
            setVehicles(vehiclesData.filter(v => v.isActive));
        } catch (error) {
            console.error('Failed to load filter data:', error);
        } finally {
            setDataLoading(false);
        }
    }, []);

    // Handle search
    const handleSearch = useCallback(() => {
        const filters: SessionFilters = {};

        if (type === 'driver' && selectedId) {
            filters.driverId = selectedId as number;
        }
        if (type === 'vehicle' && selectedId) {
            filters.vehicleId = selectedId as number;
        }
        if (startDate) {
            filters.startDate = startDate.toISOString();
        }
        if (endDate) {
            filters.endDate = endDate.toISOString();
        }

        onSearch(filters);
    }, [type, selectedId, startDate, endDate, onSearch]);

    // Memoized items and labels
    const { items, getItemLabel, selectLabel, allLabel } = useMemo(() => {
        const items = type === 'driver' ? drivers : vehicles;

        const getItemLabel = (item: Driver | Vehicle) => {
            if (type === 'driver') {
                const driver = item as Driver;
                return `${driver.firstName} ${driver.lastName}`;
            } else {
                const vehicle = item as Vehicle;
                return `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`;
            }
        };

        const selectLabel = type === 'driver' ? 'Sürücü Seçin' : 'Araç Seçin';
        const allLabel = type === 'driver' ? 'Tüm Sürücüler' : 'Tüm Araçlar';

        return { items, getItemLabel, selectLabel, allLabel };
    }, [type, drivers, vehicles]);

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {type === 'driver' ? 'Sürücü Bazlı Filtre' : 'Araç Bazlı Filtre'}
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>{selectLabel}</InputLabel>
                            <Select
                                value={selectedId}
                                label={selectLabel}
                                onChange={(e) => setSelectedId(e.target.value as number)}
                                disabled={dataLoading}
                            >
                                <MenuItem value="">{allLabel}</MenuItem>
                                {items.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {getItemLabel(item)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={6}>
                        <DatePicker
                            label="Başlangıç Tarihi"
                            value={startDate}
                            onChange={setStartDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={6}>
                        <DatePicker
                            label="Bitiş Tarihi"
                            value={endDate}
                            onChange={setEndDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                            disabled={loading || dataLoading}
                            fullWidth
                            size="large"
                        >
                            {loading ? 'Aranıyor...' : 'Ara'}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
});

RouteFilter.displayName = 'RouteFilter';