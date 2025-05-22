import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { verifyEmail } from '../../api/authAPI';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Typography,
    Paper,
    Container,
    Alert,
    CircularProgress
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

const VerifyEmail: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        const verifyUserEmail = async () => {
            // Извлекаем токен из URL
            const searchParams = new URLSearchParams(location.search);
            const token = searchParams.get('token');
            
            if (!token) {
                setError(t('verification_failed'));
                setIsVerifying(false);
                return;
            }
            
            try {
                await verifyEmail(token);
                setIsSuccess(true);
            } catch (error) {
                setError(t('verification_failed'));
            } finally {
                setIsVerifying(false);
            }
        };
        
        verifyUserEmail();
    }, [location.search, t]);

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                    <Typography component="h1" variant="h5" gutterBottom>
                        {t('verification_required')}
                    </Typography>
                    
                    {isVerifying ? (
                        <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CircularProgress size={60} />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                {t('loading')}...
                            </Typography>
                        </Box>
                    ) : isSuccess ? (
                        <Box sx={{ mt: 3 }}>
                            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {t('verification_successful')}
                            </Alert>
                            <Typography variant="body1" paragraph>
                                {t('verification_successful')}. {t('now_you_can_login')}
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                to="/login"
                                sx={{ mt: 2 }}
                            >
                                {t('login')}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 3 }}>
                            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                            <Typography variant="body1" paragraph>
                                {t('verification_failed_description')}
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                to="/login"
                                sx={{ mt: 2 }}
                            >
                                {t('back_to_login')}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default VerifyEmail; 