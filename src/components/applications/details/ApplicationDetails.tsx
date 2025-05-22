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
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Link as MuiLink,
  Chip,
  useTheme,
  useMediaQuery,
  ListItemButton,
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ChatBubbleOutline as ChatIcon,
  LabelImportant as LabelImportantIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Add as ApplyIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ApplicationResponse } from '../../../models/Models';
import { fetchUserApplicationsAPI, deleteApplicationAPI, fetchFileAPI } from '../../../api/applicationsAPI';
import { getUserRoles, getToken } from '../../../services/auth';
import { format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { exportEventToCalendarAPI } from '../../../api/eventsAPI';

const ApplicationDetails: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const appId = applicationId ? parseInt(applicationId, 10) : 0;
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const userRoles = getUserRoles();
  const isAuthenticated = !!getToken();

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      try {
        const data = await fetchUserApplicationsAPI();
        const found = data.find((a: ApplicationResponse) => a.applicationId === appId);
        if (found) {
          setApplication(found);
        } else {
          setError(t('application_not_found') || 'Заявка не найдена');
        }
      } catch (err) {
        setError(t('failed_to_load_application') || 'Не удалось загрузить заявку');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [appId, t]);

  const handleDeleteApplication = async () => {
    if (!application) return;
    
    setDeleteLoading(true);
    try {
      await deleteApplicationAPI(application.applicationId);
      navigate('/my-applications');
    } catch (err) {
      setError(t('failed_to_delete_application') || 'Failed to delete application');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleFileDownload = async (e: React.MouseEvent, fileId: number, fileName: string, isEncrypted: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await fetchFileAPI(application!.applicationId, fileId, fileName, isEncrypted);
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
        // Создаем временную ссылку и кликаем по ней, чтобы скачать файл напрямую
        const downloadLink = document.createElement('a');
        downloadLink.href = link;
        downloadLink.setAttribute('download', fileName);
        downloadLink.target = '_blank'; // Добавляем для совместимости с браузерами
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (error) {
      alert(t('failed_to_download_file'));
    }
  };

  const InfoItem = ({ icon, label, value, valueComponent }: { icon: React.ReactNode; label: string; value?: string | React.ReactNode; valueComponent?: React.ReactNode }) => (
    <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
      <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{icon}</ListItemIcon>
      <ListItemText 
        primary={label} 
        secondary={valueComponent || value || '-'} 
        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
        secondaryTypographyProps={{ variant: 'body1', fontWeight: 500, color: 'text.primary', component: 'div' }}
      />
    </Grid>
  );

  const getStatusChip = (status: string) => {
    let color: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
    switch (status) {
      case 'APPROVED': color = 'success'; break;
      case 'REJECTED': color = 'error'; break;
      case 'PENDING': color = 'warning'; break;
    }
    return <Chip label={t(status)} color={color} size="small" />;
  };

  // Функция для сокращения имени файла посередине с многоточием
  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) return fileName;
    
    const halfLength = Math.floor(maxLength / 2);
    const firstHalf = fileName.substring(0, halfLength);
    const secondHalf = fileName.substring(fileName.length - halfLength);
    
    return `${firstHalf}...${secondHalf}`;
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

  if (error || !application) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography color="error">{error || t('application_not_found')}</Typography>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          {t('back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 3, mb: 3, px: { xs: 1, sm: 2 } }}>
       <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
         <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
           <Tooltip title={t('close')}>
             <IconButton
                 size="small"
                 color="default"
                 onClick={() => navigate(-1)}
                 sx={{
                   width: 32,
                   height: 32,
                   borderRadius: '50%'
                 }}
             >
               <CloseIcon fontSize="small" />
             </IconButton>
           </Tooltip>
         </Box>


        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600} color="primary.main">
            {t('application_details')} #{application.applicationId}
          </Typography>
          <Grid container item xs={12} sm="auto" spacing={0.5} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
            {isAuthenticated && userRoles.includes('USER') && (
              <Grid item>
                <Tooltip title={t('chat_with_organizer')}>
                  <IconButton 
                    color="info" 
                    size="small"
                    onClick={() => navigate(`/events/${application.eventId}/chat`, { state: { from: 'application' } })}
                  >
                    <ChatIcon fontSize="small"/>
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
            <Grid item>
            <Tooltip title={t('edit')}>
              <IconButton 
                color="primary" 
                  size="small"
                onClick={() => navigate(`/applications/${application.applicationId}/edit`)}
              >
                  <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            </Grid>
            <Grid item>
            <Tooltip title={t('delete')}>
              <IconButton 
                color="error" 
                  size="small"
                onClick={() => setDeleteDialogOpen(true)}
              >
                  <DeleteIcon fontSize="small"/>
              </IconButton>
            </Tooltip>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid 
            item xs={12} sm={6} 
            component={ListItemButton}
            onClick={() => navigate(`/events/${application.eventId}`)}
            sx={{ 
                borderRadius: 1,
                py: { xs: 0.5, sm: 1 },
                px: { xs: 1, sm: 1.5 },
                '&:hover': { backgroundColor: 'action.hover' },
                mb: { xs: 1.5, sm: 2 }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <EventIcon />
            </ListItemIcon>
            <ListItemText 
              primary={t('event')} 
              secondary={application.eventName} 
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', fontWeight: 500, color: 'text.primary' }}
            />
          </Grid>
          
          <InfoItem 
            icon={<ScheduleIcon />} 
            label={t('submission_date')} 
            value={format(new Date(application.submissionDate), 'Pp', { locale: i18n.language === 'ru' ? ruLocale : undefined })} 
          />

          <InfoItem 
            icon={<HowToRegIcon />} 
            label={t('status')} 
            valueComponent={getStatusChip(application.status)} 
          />
          
          <InfoItem 
            icon={<LabelImportantIcon />} 
            label={t('role')} 
            value={application.isObserver ? t('observer') : t('participant')} 
          />

          <InfoItem 
            icon={<GavelIcon />} 
            label={t('verdict')} 
            value={application.verdict || t('no_verdict')} 
          />

          <InfoItem 
            icon={<MessageIcon />} 
            label={t('message')} 
            value={application.message || t('no_message')} 
            />
        </Grid>
        
        {application.fileApplications.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }}/> 
              {t('uploaded_files')}
            </Typography>
            
            <Grid container spacing={2}>
              {application.fileApplications.map(file => (
                <Grid item xs={12} sm={6} md={4} key={file.fileId}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800],
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ mb: 1 }}
                    >
                      {(file.docRequired && file.docRequired.type) || t('other')}
                    </Typography>
                    
                <Button
                  variant="outlined"
                  size="small"
                      fullWidth
                  startIcon={<DownloadIcon />}
                      onClick={(e) => handleFileDownload(e, file.fileId, file.fileName, file.isEncryptionEnabled)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                >
                      {truncateFileName(file.fileName)}
                </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box mt={4}>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            fullWidth
            onClick={() => {
              try {
                exportEventToCalendarAPI(application.eventId);
              } catch (error) {
                console.error('Failed to export calendar:', error);
              }
            }}
            startIcon={<CalendarIcon/>}
          >
            {t('export_to_calendar')}
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth={isMobile}
      >
        <DialogTitle>{t('confirm_delete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirm_cancel_application_text')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleteLoading}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleDeleteApplication} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit"/> : <DeleteIcon />}
          >
            {t('delete_confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetails; 