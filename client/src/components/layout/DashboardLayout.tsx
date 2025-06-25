import React, { useState } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    useTheme,
    useMediaQuery,
    Badge,
    Chip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    DirectionsCar as CarsIcon,
    MyLocation as TrackingIcon,
    Analytics as AnalyticsIcon,
    Route as RouteIcon,
    AccountCircle,
    Logout,
    Settings,
    Notifications,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    {
        text: 'Performans Paneli',
        icon: <DashboardIcon />,
        path: '/',
        description: 'Genel Bakış'
    },
    {
        text: 'Sürücüler',
        icon: <PeopleIcon />,
        path: '/drivers',
        description: 'Sürücü Yönetimi'
    },
    {
        text: 'Araçlar',
        icon: <CarsIcon />,
        path: '/vehicles',
        description: 'Araç Yönetimi'
    },
    {
        text: 'Canlı Takip',
        icon: <TrackingIcon />,
        path: '/live-tracking',
        description: 'Gerçek Zamanlı Konum'
    },
    {
        label: 'Rota Geçmişi',
        path: '/route-history',
        icon: <RouteIcon />,
        roles: ['admin', 'operator']
    },
    {
        text: 'Analitik',
        icon: <AnalyticsIcon />,
        path: '/analytics',
        description: 'Raporlar ve İstatistikler'
    },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleMenuClose();
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                        }}
                    >
                        🚗
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Vehicle Track
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Araç Takip Sistemi
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2 }}>
                <List>
                    {menuItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        '&.Mui-selected': {
                                            backgroundColor: theme.palette.primary.main,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark,
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'white',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: isSelected ? 'white' : theme.palette.text.secondary,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        secondary={!isSelected && item.description}
                                        primaryTypographyProps={{
                                            fontWeight: isSelected ? 600 : 500,
                                            fontSize: '0.95rem',
                                        }}
                                        secondaryTypographyProps={{
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.default,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Aktif Kullanıcı
                    </Typography>
                    <Chip
                        label={user?.role?.toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { lg: `${DRAWER_WIDTH}px` },
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
                elevation={0}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { lg: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton color="inherit">
                            <Badge badgeContent={3} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>

                        <IconButton
                            size="large"
                            aria-label="account menu"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenuClick}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {user?.email?.[0]?.toUpperCase()}
                            </Avatar>
                        </IconButton>

                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <Box sx={{ p: 2, minWidth: 200 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {user?.email}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user?.role} kullanıcısı
                                </Typography>
                            </Box>
                            <Divider />
                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon>
                                    <Settings fontSize="small" />
                                </ListItemIcon>
                                Ayarlar
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <Logout fontSize="small" />
                                </ListItemIcon>
                                Çıkış Yap
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            border: 'none',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            border: 'none',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                }}
            >
                <Toolbar />
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};