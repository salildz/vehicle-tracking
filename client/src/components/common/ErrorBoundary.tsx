import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        // localStorage'ı temizle
        localStorage.clear();
        this.setState({ hasError: false });
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="100vh"
                    p={3}
                    bgcolor="background.default"
                >
                    <Paper
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            maxWidth: 500,
                            width: '100%',
                        }}
                    >
                        <ErrorOutline
                            sx={{
                                fontSize: 64,
                                color: 'error.main',
                                mb: 2,
                            }}
                        />
                        <Typography variant="h5" gutterBottom>
                            Bir şeyler ters gitti
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            Uygulama beklenmedik bir hatayla karşılaştı.
                        </Typography>

                        {process.env.NODE_ENV === 'development' && (
                            <Typography
                                variant="body2"
                                color="error"
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'error.light',
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    textAlign: 'left',
                                }}
                            >
                                {this.state.error?.message}
                            </Typography>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button variant="contained" onClick={this.handleReload}>
                                Sayfayı Yenile
                            </Button>
                            <Button variant="outlined" onClick={this.handleReset}>
                                Sıfırla ve Giriş Yap
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}