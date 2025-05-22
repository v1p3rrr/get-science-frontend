import React, { useEffect, useState } from 'react';
import { fetchApplicationsByOrganizerAPI, fetchFileAPI } from '../../../api/applicationsAPI';
import { ApplicationResponse } from '../../../models/Models';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Backdrop,
  CircularProgress,
  List,
  ListItem,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const OrganizerApplications: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Функция для сокращения имени файла посередине с многоточием
    const truncateFileName = (fileName: string, maxLength: number = 20) => {
        if (fileName.length <= maxLength) return fileName;
        
        const halfLength = Math.floor(maxLength / 2);
        const firstHalf = fileName.substring(0, halfLength);
        const secondHalf = fileName.substring(fileName.length - halfLength);
        
        return `${firstHalf}...${secondHalf}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await fetchApplicationsByOrganizerAPI();
                setApplications(data);
            } catch (error) {
                alert(t('failed_to_fetch_applications'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [t]);

    const handleApplicationClick = (applicationId: number) => {
        navigate(`/applications/${applicationId}/review`);
    };

    const handleFileDownload = async (event: React.MouseEvent, applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
        event.stopPropagation(); // Предотвращаем переход на страницу рецензирования при клике на кнопку скачивания файла
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
            alert('Failed to download file');
        }
    };

    return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', mt: 4 }}>
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
            <Typography variant="h6" color="white">{t('loading_applications')}</Typography>
          </Backdrop>
        </Box>
      ) : applications.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {t('no_applications_received')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {applications.map(application => (
            <Paper 
              key={application.applicationId} 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                cursor: 'pointer', 
                '&:hover': { 
                  boxShadow: 6 
                },
                transition: 'box-shadow 0.3s ease-in-out'
              }}
              onClick={() => handleApplicationClick(application.applicationId)}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{t('event')}: {application.eventName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('submission_date')}:</strong> {new Date(application.submissionDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>{t('message')}:</strong> {application.message}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'inline', fontWeight: 500 }}>{t('verdict')}:</Typography>
                    <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>{application.verdict || '-'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'inline', fontWeight: 500 }}>{t('status')}:</Typography>
                    <Chip label={t(application.status)} color={application.status === 'APPROVED' ? 'success' : application.status === 'REJECTED' ? 'error' : 'warning'} sx={{ ml: 1 }} />
                  </Box>
                </Grid>
              </Grid>
              
                  {application.fileApplications.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ 
                    borderTop: 1, 
                    borderColor: 'divider', 
                    py: 2, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight={500}>{t('uploaded_files')}</Typography>
                  </Box>
                  <Grid container spacing={2}>
                        {application.fileApplications.map(file => (
                      <Grid item xs={12} sm={6} md={4} key={file.fileId}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 1,
                            height: '100%',
                            backgroundColor: (theme) => theme.palette.mode === 'light' 
                              ? theme.palette.grey[100] 
                              : theme.palette.grey[800]
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDownload(e, application.applicationId, file.fileId, file.fileName, file.isEncryptionEnabled);
                            }}
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
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
    );
};

export default OrganizerApplications;