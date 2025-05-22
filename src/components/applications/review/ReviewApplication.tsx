import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  FormHelperText,
  Avatar,
  Tooltip,
  Backdrop,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarToday,
  HowToReg as HowToRegIcon,
  Gavel as GavelIcon,
  Message as MessageIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { ApplicationResponse, ApplicationDetailWithApplicantResponse } from '../../../models/Models';
import { 
  fetchApplicationsByOrganizerAPI, 
  updateApplicationAPI, 
  fetchFileAPI,
  fetchApplicationWithApplicantAPI,
  fetchApplicationWithOrganizerAPI
} from '../../../api/applicationsAPI';

const ReviewApplication: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const appId = applicationId ? parseInt(applicationId, 10) : 0;
  
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [applicationDetail, setApplicationDetail] = useState<ApplicationDetailWithApplicantResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Редактируемые поля
  const [status, setStatus] = useState<string>('PENDING');
  const [verdict, setVerdict] = useState<string>('');

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      try {
        // Запрашиваем детальную информацию о заявке с профилем заявителя
        const detailData = await fetchApplicationWithApplicantAPI(appId);
        setApplicationDetail(detailData);
        setApplication(detailData.application);
        setStatus(detailData.application.status);
        setVerdict(detailData.application.verdict || '');
      } catch (err) {
        // Если не удалось получить детальную информацию, пробуем получить обычную заявку
        try {
          const data = await fetchApplicationsByOrganizerAPI();
          const found = data.find((a: ApplicationResponse) => a.applicationId === appId);
          if (found) {
            setApplication(found);
            setStatus(found.status);
            setVerdict(found.verdict || '');
          } else {
            setError(t('application_not_found'));
          }
        } catch (fetchErr) {
          setError(t('failed_to_load_application'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [appId, t]);

  const handleFileDownload = async (applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
    try {
      const result = await fetchFileAPI(applicationId, fileId, fileName, isEncrypted);
      if (isEncrypted) {
        const { blob, downloadedFileName } = result;
        if (blob && downloadedFileName) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', downloadedFileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const { link } = result;
        window.open(link, '_blank');
      }
    } catch (error) {
      setError(t('failed_to_download_file'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    
    setSaveLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedApplication: ApplicationResponse = {
        ...application,
        status: status,
        verdict: verdict,
      };
      
      await updateApplicationAPI(appId, updatedApplication);
      setSuccess(t('application_updated_successfully'));
      setApplication(updatedApplication);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(t('application_update_failed'));
    } finally {
      setSaveLoading(false);
    }
  };

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
          <Typography variant="h6" color="white">{t('loading_application')}</Typography>
        </Backdrop>
      </Box>
    );
  }

  if (error && !application) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          {t('back')}
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography color="error">{t('application_not_found')}</Typography>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          {t('back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <form onSubmit={handleSubmit}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('review_application')}</Typography>
          </Box>
          
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Отображение информации о заявителе */}
          {applicationDetail?.applicant && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 4, 
                pb: 2, 
                borderBottom: '1px solid #e0e0e0',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1
                },
                transition: 'background-color 0.2s'
              }}
              onClick={() => navigate(`/profile/${applicationDetail.applicant.profileId}`)}
            >
              <Tooltip title={t('view_profile')}>
                <Avatar 
                  src={applicationDetail.applicant.avatarUrl || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 3,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                    transition: 'opacity 0.3s, box-shadow 0.3s'
                  }}
                >
                  {!applicationDetail.applicant.avatarUrl && applicationDetail.applicant.firstName?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5">
                  {applicationDetail.applicant.firstName} {applicationDetail.applicant.lastName}
                </Typography>
              </Box>
            </Box>
          )}
          
          <List>
            <ListItem 
              button 
              onClick={() => navigate(`/events/${application.eventId}`)}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
            >
              <ListItemIcon><EventIcon /></ListItemIcon>
              <ListItemText 
                primary={t('event')} 
                secondary={application.eventName} 
                secondaryTypographyProps={{
                  component: 'span',
                  color: 'primary'
                }}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon><CalendarToday /></ListItemIcon>
              <ListItemText primary={t('submission_date')} secondary={new Date(application.submissionDate).toLocaleString()} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon><HowToRegIcon /></ListItemIcon>
              <FormControl fullWidth>
                <InputLabel id="status-label">{t('status')}</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label={t('status')}
                  onChange={(e) => setStatus(e.target.value as string)}
                >
                  <MenuItem value="PENDING">{t('PENDING')}</MenuItem>
                  <MenuItem value="APPROVED">{t('APPROVED')}</MenuItem>
                  <MenuItem value="REJECTED">{t('REJECTED')}</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon><MessageIcon /></ListItemIcon>
              <ListItemText primary={t('message')} secondary={application.message || t('no_message')} />
            </ListItem>
            <Divider />
            <ListItem sx={{ alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ mt: 1 }}><GavelIcon /></ListItemIcon>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary">{t('verdict')}</Typography>
                <TextField 
                  fullWidth
                  multiline
                  rows={4}
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  placeholder={t('enter_verdict')}
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Box>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText 
                primary={t('role')} 
                secondary={application.isObserver ? t('observer') : t('participant')} 
              />
            </ListItem>
          </List>
          {application.fileApplications.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('uploaded_files')}</Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                {application.fileApplications.map(file => (
                  <Button
                    key={file.fileId}
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFileDownload(application.applicationId, file.fileId, file.fileName, file.isEncryptionEnabled)}
                    sx={{ textTransform: 'none', mb: 1 }}
                  >
                    {file.fileName}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
          
          {/* Кнопка сохранения внизу и меньшего размера */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              type="submit"
              disabled={saveLoading}
            >
              {saveLoading ? <CircularProgress size={20} /> : t('save_changes')}
            </Button>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};

export default ReviewApplication; 