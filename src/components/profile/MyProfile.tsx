import React, { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Backdrop
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile, uploadAvatar, ProfileUpdateData } from '../../api/profileAPI';
import { ProfileData } from '../../models/Models';
import {changePassword, logoutAllSessions} from "../../api/authAPI";

const MyProfile: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = React.useState<ProfileData>({
    profileId: 0,
    firstName: '',
    lastName: '',
    aboutMe: null,
    avatarUrl: null,
    avatarPresignedUrl: null,
    email: '',
    role: '',
    isActive: true,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [confirmResetDialogOpen, setConfirmResetDialogOpen] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState<string | null>(null);
  
  // Новое состояние для временного хранения выбранного файла и URL
  const [selectedAvatarFile, setSelectedAvatarFile] = React.useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = React.useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfile(response);
        setError(null);
      } catch (err) {
        setError(t('failed_to_load_profile'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    
    // Очистка URL при размонтировании компонента
    return () => {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
    };
  }, [t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      // Базовое обновление профиля
      const updateData: ProfileUpdateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        aboutMe: profile.aboutMe
      };
      let updatedProfile = await updateProfile(updateData);
      
      // Если выбрана новая аватарка, загружаем её
      if (selectedAvatarFile) {
        updatedProfile = await uploadAvatar(selectedAvatarFile);
        
        // Очищаем локальное состояние после успешной загрузки
        setSelectedAvatarFile(null);
        if (previewAvatarUrl) {
          URL.revokeObjectURL(previewAvatarUrl);
        }
      }
      
      setProfile(updatedProfile);
      setSuccess(true);
    } catch (err) {
      setError(t('failed_to_save_profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Проверяем, что это изображение
    if (!file.type.startsWith('image/')) {
      setError(t('avatar_upload_error'));
      return;
    }
    
    // Очищаем предыдущий превью URL, если он был
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
    }
    
    // Создаем локальный URL для предпросмотра
    const previewUrl = URL.createObjectURL(file);
    setPreviewAvatarUrl(previewUrl);
    setSelectedAvatarFile(file);
    
    // Сброс сообщений об ошибках
    setError(null);
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('fill_all_fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwords_do_not_match'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('password_min_length')); // Добавь перевод
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(t('password_updated_successfully'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.response?.data?.message;
      if (message === 'Current password is incorrect') {
        setPasswordError(t('current_password_incorrect'));
      } else {
        setPasswordError(message || t('password_change_failed'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      {loading ? (
        <Box position="relative" width="100%" height="100%" minHeight="400px">
          <Backdrop
            sx={{ 
              position: 'absolute',
              color: '#fff', 
              zIndex: (theme) => theme.zIndex.drawer + 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              backgroundColor: 'transparent'
            }}
            open={true}
          >
            <CircularProgress color="primary" size={60} />
            <Typography variant="h6" color="white">{t('loading_profile')}</Typography>
          </Backdrop>
        </Box>
      ) : (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            mt: 4,
            backgroundColor: 'background.paper',
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                <Tooltip title={t('change_avatar')}>
                  <Avatar
                    // Используем локальное превью, если оно есть, иначе - серверное изображение
                    src={previewAvatarUrl || profile.avatarPresignedUrl || undefined}
                    sx={{
                      width: 100,
                      height: 100,
                      mr: 3,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                      },
                      transition: 'opacity 0.3s, box-shadow 0.3s'
                    }}
                    onClick={handleAvatarClick}
                  >
                    {!previewAvatarUrl && !profile.avatarPresignedUrl && profile.firstName?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
                
                {saving && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '50%',
                      mr: 3
                    }}
                  >
                    <CircularProgress size={50} sx={{ color: 'white' }} />
                  </Box>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Box>
              
              <Box>
                <Typography variant="h5" component="h1">
                  {t('my_profile')}
                </Typography>
                <Chip
                  label={t(profile.role.toLowerCase())}
                  color="primary" 
                  variant="outlined" 
                  size="small"
                  sx={{ mt: 1 }}
                />
                {selectedAvatarFile && (
                  <Chip 
                    label={t('new_avatar_selected')} 
                    color="success" 
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 1, ml: 1 }}
                  />
                )}
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {t('profile_saved_successfully')}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
                <TextField
                  fullWidth
                  label={t('first_name')}
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  disabled={saving}
                  required
                />
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
                <TextField
                  fullWidth
                  label={t('last_name')}
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  disabled={saving}
                  required
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  type="email"
                  label={t('email')}
                  value={profile.email}
                  disabled={true}
                  required
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('about_me')}
                  placeholder={t('about_me_placeholder')}
                  value={profile.aboutMe || ''}
                  onChange={(e) => setProfile({ ...profile, aboutMe: e.target.value || null })}
                  disabled={saving}
                />
              </Box>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t('save_changes')
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
          <Box mt={3}>
            {!showPasswordForm ? (
                <Typography
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setShowPasswordForm(true)}
                >
                  {t('change_password')}
                </Typography>
            ) : (
                <>
                  <TextField
                      label={t('current_password')}
                      type="password"
                      fullWidth
                      margin="normal"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <TextField
                      label={t('new_password')}
                      type="password"
                      fullWidth
                      margin="normal"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <TextField
                      label={t('confirm_password')}
                      type="password"
                      fullWidth
                      margin="normal"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
                  {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordSuccess}</Alert>}

                  <Box display="flex" gap={2} mt={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePasswordChange}
                        disabled={passwordLoading}
                    >
                      {t('save')}
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError(null);
                          setPasswordSuccess(null);
                        }}
                    >
                      {t('cancel')}
                    </Button>
                  </Box>
                </>
            )}
          </Box>
          {resetSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {resetSuccess}
              </Alert>
          )}

          <Typography
              variant="body2"
              color="error"
              sx={{ cursor: 'pointer', mt: 2 }}
              onClick={() => setConfirmResetDialogOpen(true)}
          >
            {t('reset_all_sessions')}
          </Typography>

          <Dialog open={confirmResetDialogOpen} onClose={() => setConfirmResetDialogOpen(false)}>
            <DialogTitle>{t('confirm_logout_all_title')}</DialogTitle>
            <DialogContent>
              <Typography>{t('confirm_logout_all_text')}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmResetDialogOpen(false)}>{t('cancel')}</Button>
              <Button
                  color="error"
                  onClick={async () => {
                    try {
                      await logoutAllSessions();
                      setResetSuccess(t('logout_all_success'));
                    } catch (e) {
                      setPasswordError(t('logout_all_failed'));
                    } finally {
                      setConfirmResetDialogOpen(false);
                    }
                  }}
              >
                {t('confirm')}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      )}
    </Container>
  );
};

export default MyProfile; 