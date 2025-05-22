import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
  Backdrop
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getProfileById } from '../../api/profileAPI';
import { ProfileData } from '../../models/Models';

const PublicProfile: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        const id = parseInt(profileId, 10);
        const response = await getProfileById(id);
        console.log('Полученный профиль:', response);
        
        if (!response.avatarPresignedUrl && response.avatarUrl) {
          response.avatarPresignedUrl = response.avatarUrl;
        }
        
        setProfile(response);
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setError(t('failed_to_load_profile'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, t]);

  if (loading) {
    return (
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
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography color="error">{error || t('user_not_found')}</Typography>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          {t('back')}
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          mt: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)} 
            sx={{ mb: 2 }}
          >
            {t('back')}
          </Button>
        </Box>

        <Box sx={{display: 'flex', alignItems: 'flex-start', mb: 4}}>
          <Box sx={{position: 'relative'}}>
            <Avatar
                src={profile.avatarPresignedUrl || profile.avatarUrl || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  mr: 3,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.3s, box-shadow 0.3s',
                }}
            >
              {!profile.avatarPresignedUrl && !profile.avatarUrl && profile.firstName?.[0]?.toUpperCase()}
            </Avatar>
          </Box>
          
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Chip
              label={t(profile.role.toLowerCase())}
              color="primary" 
              variant="outlined" 
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('profile_details')}
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary={t('personal_information')} 
              secondary={`${profile.firstName} ${profile.lastName}`} 
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText 
              primary={t('contact_information')} 
              secondary={profile.email} 
            />
          </ListItem>
          
          {profile.aboutMe && (
            <>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={t('about_me')} 
                  secondary={profile.aboutMe} 
                />
              </ListItem>
            </>
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default PublicProfile; 