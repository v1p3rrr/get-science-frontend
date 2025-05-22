import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, selectEvent } from '../../../api/eventsSlice';
import { AppDispatch, RootState } from '../../../app/store';
import { ApplicationRequest, FileApplicationResponse, Event, FileApplicationRequest, FileType } from '../../../models/Models';
import { submitApplicationAPI, updateUserApplicationAPI, fetchApplicationByIdAPI, deleteApplicationAPI, fetchFileAPI, deleteFileAPI } from '../../../api/applicationsAPI';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Paper,
  FormGroup,
  FormLabel,
  Input,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Backdrop,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { AttachFile, Delete as DeleteIcon, Download as DownloadIcon, Close as CloseIcon } from '@mui/icons-material';

// Интерфейс для метаданных файла
interface ApplicationFileMetadataDTO {
  type: string;
  isEncrypted: boolean;
  docRequiredId: number;
}

// Определяем интерфейс для загруженного файла
interface UploadedFile {
  docRequiredId: number;
  file: File;
  fileName: string;
  isEncrypted: boolean;
  type: string;
}

const ApplicationForm: React.FC = () => {
  const { t } = useTranslation();
  const { eventId: urlEventId, applicationId: urlApplicationId } = useParams<{ eventId: string, applicationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();
  
  // Состояния для ID события и заявки
  const [eventId, setEventId] = useState<number | undefined>(urlEventId ? Number(urlEventId) : undefined);
  
  // Получаем данные о событии из Redux store
  const eventData = useSelector((state: RootState) => selectEvent(state, Number(eventId)));
  const eventStatus = useSelector((state: RootState) => state.events.status);
  
  // Состояния для формы
  const [message, setMessage] = useState('');
  const [isObserver, setIsObserver] = useState(false);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileApplicationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [encryptedFileIds, setEncryptedFileIds] = useState<number[]>([]);
  
  // Определяем, редактируем ли мы существующую заявку
  const applicationId = urlApplicationId || new URLSearchParams(location.search).get('applicationId');
  const isEdit = Boolean(applicationId);
  
  // Функция для определения допустимых расширений файлов
  const getAcceptedFileExtensions = (fileType: FileType): string => {
    switch (fileType) {
      case FileType.DOCUMENT:
        return '.doc,.docx,.odt,.rtf,.txt,.md,.tex,.wps,.pdf,.epub,.mobi,.ps,.djvu';
      case FileType.TABLE:
        return '.xls,.xlsx,.ods,.csv,.tsv,.xlsm,.xlsb,.numbers';
      case FileType.PRESENTATION:
        return '.ppt,.pptx,.odp,.key,.pps,.ppsx';
      case FileType.IMAGE:
        return '.jpg,.jpeg,.png,.bmp,.gif,.tiff,.tif,.webp,.heif,.heic,.svg,.eps,.ai,.cdr,.raw,.cr2,.nef,.arw,.dng,.orf,.rw2,.sr2,.raf,.3fr';
      case FileType.VIDEO:
        return '.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v,.3gp,.ogv';
      case FileType.AUDIO:
        return '.mp3,.wav,.flac,.ogg,.aac,.m4a,.wma,.aiff,.aif,.opus,.alac';
      case FileType.ARCHIVE:
        return '.zip,.rar,.7z,.tar,.tgz,.tar.gz,.tbz2,.tar.bz2,.tar.xz,.gz,.bz2,.xz,.zst,.iso,.cab,.lz,.lzma';
      case FileType.ANY:
      default:
        return '*';
    }
  };
  
  // Проверяем, валидно ли расширение файла для указанного типа
  const isFileExtensionValid = (fileName: string, fileType: FileType): boolean => {
    if (fileType === FileType.ANY) return true;
    
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    const acceptedExtensions = getAcceptedFileExtensions(fileType).split(',');
    
    return acceptedExtensions.some(ext => ext === extension || ext === '*');
  };

  // Загружаем существующую заявку, если мы в режиме редактирования
  useEffect(() => {
    if (isEdit && applicationId) {
      setLoading(true);
      fetchApplicationByIdAPI(Number(applicationId))
        .then(response => {
          setMessage(response.message || '');
          setIsObserver(response.isObserver);
          setExistingFiles(response.fileApplications || []);
          // Получаем eventId из заявки и устанавливаем его
          if (response.eventId) {
            setEventId(response.eventId);
          }
        })
        .catch(error => {
          console.error('Failed to load application:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEdit, applicationId]);

  // Загружаем данные о событии при загрузке компонента или изменении eventId
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(Number(eventId)));
    }
  }, [dispatch, eventId]);

  // Модифицируем handleFileChange для проверки типа файла и сохранения типа документа
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docRequiredId: number) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    if (!file) return;
  
    // Находим требуемый документ в мероприятии по ID
    const docRequired = eventData?.documentsRequired?.find((doc: any) => doc.docRequiredId === docRequiredId);
    
    // Проверяем, что тип файла соответствует требованиям
    if (docRequired?.fileType) {
      const acceptedExtensions = getAcceptedFileExtensions(docRequired.fileType).split(',');
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (docRequired.fileType !== FileType.ANY && !acceptedExtensions.some(ext => ext === fileExtension || ext === '*')) {
        alert(t('file_type_not_allowed'));
        return;
      }
    }

    const docType = docRequired?.type || "Document";

    const newUploadedFiles = [...uploadedFiles];
    const existingIndex = newUploadedFiles.findIndex(f => f.docRequiredId === docRequiredId);
    
    if (existingIndex !== -1) {
      newUploadedFiles[existingIndex] = {
        ...newUploadedFiles[existingIndex],
        file,
        fileName: file.name,
        isEncrypted: isEncryptionEnabled && encryptedFileIds.includes(docRequiredId),
        type: docType
      };
    } else {
      newUploadedFiles.push({
        docRequiredId,
        file,
        fileName: file.name,
        isEncrypted: isEncryptionEnabled && encryptedFileIds.includes(docRequiredId),
        type: docType
      });
    }
    
    setUploadedFiles(newUploadedFiles);
  };
  
  // Включение/отключение шифрования для файла
  const toggleEncryption = (docRequiredId: number, isEnabled: boolean) => {
    if (isEnabled && !encryptedFileIds.includes(docRequiredId)) {
      setEncryptedFileIds([...encryptedFileIds, docRequiredId]);
    } else if (!isEnabled && encryptedFileIds.includes(docRequiredId)) {
      setEncryptedFileIds(encryptedFileIds.filter(id => id !== docRequiredId));
    }
    
    // Обновляем статус шифрования в uploaded файлах
    const newUploadedFiles = uploadedFiles.map(file => {
      if (file.docRequiredId === docRequiredId) {
        return { ...file, isEncrypted: isEnabled };
      }
      return file;
    });
    
    setUploadedFiles(newUploadedFiles);
  };

  // Удаление файла
  const removeFile = (docRequiredId: number) => {
    setUploadedFiles(uploadedFiles.filter(file => file.docRequiredId !== docRequiredId));
  };

  // Функция для скачивания существующего файла
  const downloadExistingFile = async (event: React.MouseEvent, file: FileApplicationResponse) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      if (applicationId) {
        const result = await fetchFileAPI(Number(applicationId), file.fileId, file.fileName, file.isEncryptionEnabled);
        if (file.isEncryptionEnabled) {
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
          downloadLink.setAttribute('download', file.fileName);
          downloadLink.target = '_blank'; // Добавляем для совместимости с браузерами
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }
    } catch (error) {
      alert(t('failed_to_download_file'));
    }
  };

  // Получение загруженного файла для документа
  const getUploadedFileForDoc = (docRequiredId: number) => {
    return uploadedFiles.find(file => file.docRequiredId === docRequiredId);
  };
  
  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    if (!message.trim() && !eventData?.observersAllowed) {
      return;
    }
    
    // Проверяем, что все обязательные файлы загружены
    const mandatoryDocs = eventData?.documentsRequired?.filter(doc => doc.mandatory) || [];
    const areAllMandatoryDocsUploaded = mandatoryDocs.every(doc => {
      // Проверяем наличие существующего файла для данного типа документа
      const existingFile = existingFiles.some(file => 
        file.docRequired && file.docRequired.docRequiredId === doc.docRequiredId
      );
      // Проверяем наличие нового загруженного файла
      const uploadedFile = getUploadedFileForDoc(doc.docRequiredId);
      return existingFile || uploadedFile;
    });
    
    if (!areAllMandatoryDocsUploaded) {
      alert(t('required_files'));
      return;
    }
    
    setLoading(true);
    
    // Формируем данные для отправки
    // Формируем базовые данные заявки
    const applicationData: ApplicationRequest = {
      eventId: Number(eventId),
      profileId: null, // Будет заполнено на сервере из JWT
      status: 'PENDING',
      submissionDate: new Date().toISOString(),
      message: message.trim(),
      isObserver,
      verdict: null,
      fileApplications: existingFiles.map(file => ({
        fileId: file.fileId,
        fileName: file.fileName,
        filePath: file.filePath,
        uploadDate: file.uploadDate,
        fileType: file.fileType,
        isEncryptionEnabled: file.isEncryptionEnabled
      }))
    };
    
    // Подготавливаем файлы и метаданные в правильном порядке
    const filesToUpload: File[] = [];
    const fileMetadataList: ApplicationFileMetadataDTO[] = [];
    
    // Добавляем файлы и их метаданные в одинаковом порядке
    uploadedFiles.forEach(uploadedFile => {
      filesToUpload.push(uploadedFile.file);
      fileMetadataList.push({
        type: uploadedFile.type,
        isEncrypted: uploadedFile.isEncrypted,
        docRequiredId: uploadedFile.docRequiredId
      });
    });
    
    try {
      if (isEdit) {
        // Обновляем существующую заявку
        await updateUserApplicationAPI(Number(applicationId), applicationData, filesToUpload, fileMetadataList);
      } else {
        // Создаем новую заявку
        await submitApplicationAPI(applicationData, filesToUpload, fileMetadataList);
      }
      navigate('/my-applications');
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert(t('application_submission_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Удаление заявки
  const handleDeleteApplication = async () => {
    if (!applicationId) return;
    
    if (window.confirm(t('confirm_delete_application'))) {
      setLoading(true);
      try {
        await deleteApplicationAPI(Number(applicationId));
        navigate('/my-applications');
      } catch (error) {
        console.error('Failed to delete application:', error);
        alert(t('failed_to_delete_application'));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Проверка, является ли документ обязательным
  const isDocRequiredMandatory = (docRequiredId: number): boolean => {
    if (!eventData) return false;
    
    return !!eventData.documentsRequired?.find(doc => 
      doc.docRequiredId === docRequiredId && doc.mandatory
    );
  };
  
  // Локальное удаление файла из состояния (без запроса на сервер)
  const handleRemoveExistingFile = async (docRequiredId: number) => {
    // Не даем удалить обязательный файл
    if (isDocRequiredMandatory(docRequiredId) && !getUploadedFileForDoc(docRequiredId)) {
      alert(t('cannot_delete_mandatory_file'));
      return;
    }
    
    // Находим все файлы с этим docRequiredId
    const filesToRemove = existingFiles.filter(file => 
      file.docRequired && file.docRequired.docRequiredId === docRequiredId
    );
    
    try {
      // Удаляем каждый файл с сервера
      for (const file of filesToRemove) {
        await deleteFileAPI(file.fileId);
      }
      
      // Удаляем файл из локального состояния
      setExistingFiles(prevFiles => 
        prevFiles.filter(file => 
          !file.docRequired || file.docRequired.docRequiredId !== docRequiredId
        )
      );
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert(t('failed_to_delete_file'));
    }
  };
  
  if (loading || eventStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!eventData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" align="center">{t('event_not_found')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        {loading && (
          <Backdrop
            sx={{ 
              position: 'absolute',
              color: '#fff', 
              zIndex: (theme) => theme.zIndex.drawer + 1,
              backgroundColor: 'transparent'
            }}
            open={true}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}
        
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
        
        <Typography variant="h5" align="center" gutterBottom>
          {isEdit ? t('edit_application') : t('new_application')}
        </Typography>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          {eventData.title}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label={t('message')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              error={submitted && !message.trim() && !eventData.observersAllowed}
              helperText={submitted && !message.trim() && !eventData.observersAllowed ? t('required_message') : ''}
            />
          </Box>
          
          {eventData.observersAllowed && (
            <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isObserver}
                  onChange={(e) => setIsObserver(e.target.checked)}
                />
              }
              label={t('apply_as_observer')}
              />
              </Box>
            )}
            
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('application_files')}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isEncryptionEnabled}
                    onChange={(e) => setIsEncryptionEnabled(e.target.checked)}
                  />
                }
                label={t('enable_encryption')}
              />
              {isEncryptionEnabled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('encryption_info')}
                </Alert>
            )}
            </Box>
            
            {/* Список требуемых документов */}
            {eventData.documentsRequired.map((doc) => (
              <Box key={doc.docRequiredId} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  {doc.type}
                  {doc.mandatory && <Typography component="span" color="error" sx={{ ml: 0.5 }}>*</Typography>}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {doc.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('allowed_file_type')}: {t(doc.fileType.toLowerCase())}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFile />}
                    sx={{ mt: 1 }}
                  >
                    {t('attach_file')}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleFileChange(e, doc.docRequiredId)}
                      accept={getAcceptedFileExtensions(doc.fileType)}
                    />
                  </Button>
                  
                  {isEncryptionEnabled && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={encryptedFileIds.includes(doc.docRequiredId)}
                          onChange={(e) => toggleEncryption(doc.docRequiredId, e.target.checked)}
                        />
                      }
                      label={t('encrypted')}
                    />
                  )}
                </Box>
                
                {getUploadedFileForDoc(doc.docRequiredId) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, width: { xs: '100%', sm: '350px' } }}>
                    <Paper
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1,
                        width: '100%',
                        backgroundColor: (theme) => theme.palette.mode === 'light' 
                          ? theme.palette.grey[100] 
                          : theme.palette.grey[800]
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getUploadedFileForDoc(doc.docRequiredId)?.fileName}
                          {getUploadedFileForDoc(doc.docRequiredId)?.isEncrypted && (
                            <Chip size="small" label={t('encrypted')} color="success" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        
                        <Tooltip title={t('remove_file')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFile(doc.docRequiredId)}
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              borderRadius: '50%'
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  </Box>
                )}
                
                {/* Отображение существующих файлов при редактировании */}
                {isEdit && existingFiles.some(file => file.docRequired && file.docRequired.docRequiredId === doc.docRequiredId) && !getUploadedFileForDoc(doc.docRequiredId) && (
                  <Box sx={{ mt: 2, width: { xs: '100%', sm: '350px' } }}>
                    {existingFiles
                      .filter(file => file.docRequired && file.docRequired.docRequiredId === doc.docRequiredId)
                      .map(file => (
                        <Paper 
                          key={file.fileId}
                          elevation={0}
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 1,
                            backgroundColor: (theme) => theme.palette.mode === 'light' 
                              ? theme.palette.grey[100] 
                              : theme.palette.grey[800],
                            mt: 1
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            fontWeight={500}
                            sx={{ mb: 1 }}
                          >
                            {t('existing_file')}
                            {file.isEncryptionEnabled && (
                              <Chip size="small" label={t('encrypted')} color="success" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs>
            <Button
                                variant="outlined"
                                size="small"
              fullWidth
                                startIcon={<DownloadIcon />}
                                onClick={(e) => downloadExistingFile(e, file)}
                                sx={{ 
                                  justifyContent: 'flex-start',
                                  textTransform: 'none',
                                  textAlign: 'left',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {file.fileName}
            </Button>
                            </Grid>
                            {/* Кнопка удаления для необязательных файлов */}
                            {file.docRequired && !isDocRequiredMandatory(file.docRequired.docRequiredId) && (
                              <Grid item>
                                <Tooltip title={t('remove_file')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveExistingFile(file.docRequired!.docRequiredId)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      ))
                    }
                  </Box>
                )}
              </Box>
            ))}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{ flex: { xs: 1, sm: 'auto' } }}
              >
                {isEdit ? t('update_application') : t('submit_application')}
              </Button>

              {isEdit && (
                <Button
                  variant="outlined" 
                color="error"
                  onClick={handleDeleteApplication}
                  sx={{ flex: { xs: 1, sm: 'auto' } }}
              >
                {t('delete_application')}
              </Button>
            )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ApplicationForm;
