import React, { useState } from 'react';
import {useNavigate, Link, useLocation} from 'react-router-dom';
import { loginUser } from '../../api/authAPI';
import { saveToken } from "../../services/auth";
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
    Grid,
    CircularProgress
} from '@mui/material';
import { Email, Lock } from '@mui/icons-material';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const sessionExpired = query.get('sessionExpired') === 'true';
    const redirectPath = query.get('redirect') || '/events';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            const { accessToken, refreshToken } = await loginUser({ email, password });
            saveToken(accessToken, refreshToken);
            navigate(redirectPath);
        } catch (error) {
            setError(t('login_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        {t('login')}
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    {sessionExpired && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {t('session_expired')}
                        </Alert>
                    )}
                    
                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
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
                        
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={t('password')}
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                            {loading ? <CircularProgress size={24} /> : t('login')}
                        </Button>
                        
                        <Grid container>
                            <Grid item xs>
                                <MuiLink component={Link} to="/forgot-password" variant="body2">
                                    {t('forgot_password')}
                                </MuiLink>
                            </Grid>
                            <Grid item>
                                <MuiLink component={Link} to="/register" variant="body2">
                                    {t('no_account')} {t('register')}
                                </MuiLink>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
