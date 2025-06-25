import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
    Container,
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Container maxWidth="sm">
                <Card
                    sx={{
                        maxWidth: 440,
                        width: '100%',
                        mx: 'auto',
                        backdropFilter: 'blur(20px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    }}
                >
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box textAlign="center" mb={4}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    mx: 'auto',
                                    mb: 2,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                }}
                            >
                                🚗
                            </Box>
                            <Typography variant="h4" gutterBottom fontWeight={700} color="text.primary">
                                Vehicle Track
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Araç takip sistemine hoş geldiniz
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    borderRadius: 2,
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email Adresi"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Şifre"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                    },
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Giriş Yap'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default LoginPage;