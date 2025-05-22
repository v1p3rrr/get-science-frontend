import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/authAPI';
import { RoleTypes } from '../../models/Models';
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
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { Email, Person, Lock } from '@mui/icons-material';
import axios from "axios";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const { t } = useTranslation();

    const steps = [t('register'), t('verification_required')];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Валидация
        if (!firstName.trim()) {
            setError(t('first_name_required'));
            return;
        }
        
        if (!lastName.trim()) {
            setError(t('last_name_required'));
            return;
        }
        
        if (!email.trim()) {
            setError(t('email_required'));
            return;
        }
        
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError(t('valid_email_required'));
            return;
        }
        
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
        
        const role = isOrganizer ? RoleTypes.ORGANIZER : RoleTypes.USER;

        try {
            await registerUser({
                firstName,
                lastName,
                role,
                email,
                password
            });

            // Переход к шагу подтверждения email
            setActiveStep(1);
        } catch (error: unknown) {
            let message = 'Ошибка регистрации';

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                message = error.response?.data?.error ?? message;

                if (status === 409) {
                    setError('Пользователь с таким email уже существует');
                } else if (status === 400) {
                    setError('Проверьте правильность заполнения полей');
                } else {
                    setError(message);
                }
            } else {
                setError('Непредвиденная ошибка');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderRegistrationForm = () => (
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="firstName"
                        required
                        fullWidth
                        id="firstName"
                        label={t('first_name')}
                        autoFocus
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        InputProps={{
                            startAdornment: <Person color="action" sx={{ mr: 1 }} />
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        id="lastName"
                        label={t('last_name')}
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        InputProps={{
                            startAdornment: <Person color="action" sx={{ mr: 1 }} />
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="email"
                        label={t('email')}
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        helperText={t('email_problems')}
                        InputProps={{
                            startAdornment: <Email color="action" sx={{ mr: 1 }} />
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
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
                </Grid>
                <Grid item xs={12}>
                    <TextField
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
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isOrganizer}
                                onChange={(e) => setIsOrganizer(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={t('register_as_organizer')}
                    />
                </Grid>
            </Grid>
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : t('register')}
            </Button>
            <Grid container justifyContent="flex-end">
                <Grid item>
                    <MuiLink component={Link} to="/login" variant="body2">
                        {t('already_have_account')} {t('login')}
                    </MuiLink>
                </Grid>
            </Grid>
        </Box>
    );

    const renderVerificationRequired = () => (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
                {t('verification_required')}
            </Typography>
            <Typography variant="body1" paragraph>
                {t('verification_message')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <MuiLink href="#" onClick={() => console.log('Resend verification')}>
                    {t('verification_resend')}
                </MuiLink>
            </Typography>
            <Button
                variant="outlined"
                color="primary"
                component={Link}
                to="/login"
                sx={{ mt: 3 }}
            >
                {t('back_to_login')}
            </Button>
        </Box>
    );

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        {activeStep === 0 ? t('register') : t('verification_required')}
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    {activeStep === 0 ? renderRegistrationForm() : renderVerificationRequired()}
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
