import React, {useEffect, useState} from 'react';
import {fetchUserApplicationsAPI, deleteApplicationAPI, fetchFileAPI} from '../../../api/applicationsAPI';
import {ApplicationResponse} from '../../../models/Models';
import {useTranslation} from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Grid,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions, 
    Tooltip,
    Backdrop,
    CircularProgress,
    List,
    ListItem
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import {useNavigate} from 'react-router-dom';

const MyApplications: React.FC = () => {
    const {t} = useTranslation();
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
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
        const fetchApplications = async () => {
            setStatus('loading');
            try {
                const data = await fetchUserApplicationsAPI();
                setApplications(data);
                setStatus('succeeded');
            } catch (error) {
                setStatus('failed');
                console.error(error);
            }
        };
        fetchApplications();
    }, []);

    const handleDelete = async (applicationId: number) => {
        try {
            await deleteApplicationAPI(applicationId);
            setApplications(applications.filter(app => app.applicationId !== applicationId));
        } catch (error) {
            alert(t('failed_to_delete_application'));
        }
    };

    const handleFileDownload = async (e: React.MouseEvent, applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
        e.stopPropagation();
        try {
            const result = await fetchFileAPI(applicationId, fileId, fileName, isEncrypted);
            if (isEncrypted) {
                const {blob, downloadedFileName} = result;
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
                const {link} = result;
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

    const openCancelDialog = (e: React.MouseEvent, applicationId: number) => {
        e.stopPropagation();
        setSelectedAppId(applicationId);
        setCancelDialogOpen(true);
    };

    const closeCancelDialog = () => {
        setCancelDialogOpen(false);
        setSelectedAppId(null);
    };

    const confirmCancel = async () => {
        if (selectedAppId !== null) {
            await handleDelete(selectedAppId);
            closeCancelDialog();
        }
    };

    if (status === 'loading') {
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
                    <Typography variant="h6" color="white">{t('loading_applications')}</Typography>
                </Backdrop>
            </Box>
        );
    }

    if (status === 'failed') {
        return <Typography align="center" color="error" sx={{mt: 6}}>{t('failed_to_load_applications')}</Typography>;
    }

    return (
        <Box sx={{width: '100%', maxWidth: 1100, mx: 'auto', mt: 4}}>
            {applications.length === 0 ? (
                <Paper elevation={2} sx={{p: 4, borderRadius: 3, textAlign: 'center', mt: 4}}>
                    <Typography variant="h6" color="text.secondary">
                        {t('no_applications_submitted')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{mt: 2}}>
                        {t('find_events_to_apply')}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{mt: 3}}
                        onClick={() => navigate('/events')}
                    >
                        {t('browse_events')}
                    </Button>
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
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                }
                            }}
                            onClick={() => navigate(`/applications/${application.applicationId}`)}
                        >
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <Typography variant="h6"
                                                sx={{mb: 1}}>{t('event')}: {application.eventName}</Typography>
                                    <Chip label={t(application.status)}
                                          color={application.status === 'APPROVED' ? 'success' : application.status === 'REJECTED' ? 'error' : 'warning'}
                                          sx={{mb: 1}}/>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{t('submission_date')}:</strong> {new Date(application.submissionDate).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="body2"
                                                sx={{mb: 1}}><strong>{t('message')}:</strong> {application.message}
                                    </Typography>
                                    {application.verdict && (
                                        <Typography variant="body2"
                                                    sx={{mb: 1}}><strong>{t('verdict')}:</strong> {application.verdict}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={3} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: {xs: 'flex-start', md: 'flex-end'},
                                    gap: 2
                                }}>
                                    <Box sx={{display: 'flex', gap: 1}}>
                                        <Tooltip title={t('edit')}>
                                            <IconButton
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/applications/${application.applicationId}/edit`);
                                                }}
                                                sx={{
                                                    minWidth: 0,
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    p: 0,
                                                    backgroundColor: 'transparent',
                                                    transition: 'background 0.2s',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                    },
                                                }}
                                                aria-label={t('edit')}
                                            >
                                                <EditIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('delete')}>
                                            <IconButton
                                                color="error"
                                                onClick={(e) => openCancelDialog(e, application.applicationId)}
                                                sx={{
                                                    minWidth: 0,
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    p: 0,
                                                    backgroundColor: 'transparent',
                                                    transition: 'background 0.2s',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                                    },
                                                }}
                                                aria-label={t('delete')}
                                            >
                                                <CancelOutlinedIcon/>
                                            </IconButton>
                                        </Tooltip>
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

            <Dialog open={cancelDialogOpen} onClose={closeCancelDialog}>
                <DialogTitle>{t('confirm_cancel_application_title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('confirm_cancel_application_text')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCancelDialog}>{t('cancel')}</Button>
                    <Button color="error" onClick={confirmCancel}>{t('cancel_confirm')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyApplications;
