import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../../api/authAPI';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Alert,
    CircularProgress
} from '@mui/material';
import { Lock } from '@mui/icons-material';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        // Извлекаем токен из URL
        const searchParams = new URLSearchParams(location.search);
        const tokenParam = searchParams.get('token');
        
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            // Если токена нет, показываем ошибку
            setError(t('verification_failed'));
        }
    }, [location.search, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Базовая валидация
        if (!password) {
            setError(t('password_required'));
            return;
        }
        
        if (password.length < 8) {
            setError(t('password_min_length'));
            return;
        }
        
        if (password !== confirmPassword) {
            setError(t('passwords_dont_match'));
            return;
        }

        setError(null);
        setLoading(true);
        
        try {
            await resetPassword(token, password);
            setIsSubmitted(true);
            
            // После успешного сброса пароля, перенаправляем на страницу входа через 3 секунды
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setError(t('verification_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Если нет токена, показываем сообщение об ошибке
    if (!token && !loading) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                        <Typography component="h1" variant="h5" align="center" gutterBottom>
                            {t('reset_password')}
                        </Typography>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {t('verification_failed')}
                        </Alert>
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Button 
                                variant="outlined" 
                                component={Link} 
                                to="/login"
                            >
                                {t('back_to_login')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        {t('set_new_password')}
                    </Typography>
                    
                    {!isSubmitted && (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            {t('set_new_password_instruction')}
                        </Typography>
                    )}
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    {isSubmitted ? (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {t('password_reset_successful')}
                            </Alert>
                            <Typography variant="body2" color="text.secondary">
                                {t('back_to_login')}
                            </Typography>
                            <CircularProgress size={24} sx={{ mt: 2 }} />
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label={t('password')}
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                helperText={t('password_min_length')}
                                InputProps={{
                                    startAdornment: <Lock color="action" sx={{ mr: 1 }} />
                                }}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label={t('confirm_password')}
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: <Lock color="action" sx={{ mr: 1 }} />
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : t('reset_password')}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default ResetPassword; 