import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/authAPI';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Alert,
    Link as MuiLink,
    CircularProgress
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Базовая валидация
        if (!email.trim()) {
            setError(t('email_required'));
            return;
        }
        
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError(t('valid_email_required'));
            return;
        }

        setError(null);
        setLoading(true);
        
        try {
            await requestPasswordReset(email);
            setIsSubmitted(true);
        } catch (error) {
            setError(t('password_reset_request_failed'));
        } finally {
            setLoading(false);
        }
    };

    const renderRequestForm = () => (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('email')}
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />
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
                {loading ? <CircularProgress size={24} /> : t('submit')}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink component={Link} to="/login" variant="body2">
                    <ArrowBack sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {t('back_to_login')}
                </MuiLink>
            </Box>
        </Box>
    );

    const renderSuccessMessage = () => (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
                {t('password_reset_email_sent')}
            </Alert>
            <Typography variant="body1" paragraph>
                {t('password_reset_email_sent_message')}
            </Typography>
            <Button
                variant="outlined"
                color="primary"
                component={Link}
                to="/login"
                sx={{ mt: 2 }}
            >
                {t('back_to_login')}
            </Button>
        </Box>
    );

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        {t('reset_password')}
                    </Typography>
                    
                    {!isSubmitted && (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            {t('reset_password_instruction')}
                        </Typography>
                    )}
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    {isSubmitted ? renderSuccessMessage() : renderRequestForm()}
                </Paper>
            </Box>
        </Container>
    );
};

export default ForgotPassword; 