import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  EventRequest,
  DocRequiredRequest,
  Reviewer,
  EventFormat, EventStatus, ModerationStatus, FileEventRequest, FileEvent, EventType, FileType
} from '../../../models/Models';
import { createEventAPI, deleteEventAPI, searchUsersAPI, updateEventAPI, updateEventModerationStatusAPI, exportEventParticipantsToExcel } from '../../../api/eventsAPI';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../../styles/style.css';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Backdrop
} from '@mui/material';
import Grid from '@mui/material/Grid';

import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add, Delete, FileDownload as FileDownloadIcon, Clear } from '@mui/icons-material';
import { enUS, ru } from 'date-fns/locale';
import axiosInstance from '../../../util/axiosInstance';

// Добавляю компонент LoadingOverlay для отображения индикатора загрузки
const LoadingOverlay = ({ loading }: { loading: boolean }) => {
  if (!loading) return null;

  return (
    <Backdrop
      sx={{
        position: 'absolute',
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'transparent'
      }}
      open={loading}
    >
      <CircularProgress color="primary" size={60} />
    </Backdrop>
  );
};

type Material = {
  tempId?: string;
  fileId?: number;
  name: string;
  category: string;
  description: string;
  file: File | null;
  filePath?: string;
  uploadError?: string;
  uploadDate?: string;
  originalFileType?: string;
  fileName?: string;
  originalCategory?: string;
  originalDescription?: string;
};

type EventFormProps = {
  mode?: 'create' | 'edit' | 'edit_coowner' | 'moderate';
  initialData?: Partial<Omit<EventRequest, 'fileEvents' | 'status' | 'type'> & { status: string; type: string }> & {
    applicationStart?: string;
    applicationEnd?: string;
    hidden?: boolean;
    materials?: Material[];
    fileEvents?: FileEvent[];
    coowners?: Reviewer[];
    type: string;
    results?: string;
  };
  onSave: (event: EventRequest) => void;
  onCancel?: () => void;
  isOrganizer?: boolean;
};

const EventForm: React.FC<EventFormProps> = ({
  mode = 'create',
  initialData = {},
  onSave,
  onCancel,
  isOrganizer = false,
}) => {
  const { t, i18n } = useTranslation();
  const {
    title: initialTitle = '',
    description: initialDescription = '',
    organizerDescription: initialOrganizerDescription = '',
    dateStart: initialDateStart = '',
    dateEnd: initialDateEnd = '',
    applicationStart: initialApplicationStart = '',
    applicationEnd: initialApplicationEnd = '',
    location: initialLocation = '',
    theme: initialTheme = '',
    format: initialFormat = EventFormat.ONLINE,
    observersAllowed: initialObserversAllowed = false,
    hidden: initialHidden = false,
    status: initialStatus = EventStatus.DRAFT,
    type: initialTypeString = EventType.CONFERENCE,
    moderationStatus: initialModerationStatus = ModerationStatus.PENDING,
    results: initialResults = '',
    documentsRequired: initialDocumentsRequired = [],
    materials: initialMaterials = [],
    reviewers: initialReviewersFromData = initialData.reviewers || [],
    coowners: initialCoownersFromData = initialData.coowners || [],
  } = initialData || {};

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [organizerDescription, setOrganizerDescription] = useState(initialOrganizerDescription);
  const [dateStart, setDateStart] = useState<Date | null>(initialDateStart ? new Date(initialDateStart) : null);
  const [dateEnd, setDateEnd] = useState<Date | null>(initialDateEnd ? new Date(initialDateEnd) : null);
  const [applicationStart, setApplicationStart] = useState<Date | null>(initialApplicationStart ? new Date(initialApplicationStart) : null);
  const [applicationEnd, setApplicationEnd] = useState<Date | null>(initialApplicationEnd ? new Date(initialApplicationEnd) : null);
  const [location, setLocation] = useState(initialLocation);
  const [theme, setTheme] = useState(initialTheme);
  const [format, setFormat] = useState(initialFormat);
  const [type, setType] = useState<EventType>(initialTypeString as EventType);
  const [observersAllowed, setObserversAllowed] = useState(initialObserversAllowed);
  const [hidden, setHidden] = useState(initialHidden);
  const [status, setStatus] = useState<EventStatus>(initialStatus as EventStatus);
  const [moderationStatus, setModerationStatus] = useState(initialModerationStatus);
  const [results, setResults] = useState(initialResults);
  const [documentsRequired, setDocumentsRequired] = useState<Array<{
    docRequiredId?: number;
    type: string;
    fileType: FileType;
    description: string;
    mandatory: boolean;
  }>>(initialDocumentsRequired?.length ? initialDocumentsRequired : []);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [showFillAllFieldsError, setShowFillAllFieldsError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>(initialReviewersFromData);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [reviewerResults, setReviewerResults] = useState<Reviewer[]>([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [reviewerError, setReviewerError] = useState('');
  const [coowners, setCoowners] = useState<Reviewer[]>(initialCoownersFromData);
  const [coownerSearch, setCoownerSearch] = useState('');
  const [coownerResults, setCoownerResults] = useState<Reviewer[]>([]);
  const [coownerLoading, setCoownerLoading] = useState(false);
  const [coownerError, setCoownerError] = useState('');
  const [addressInput, setAddressInput] = useState(initialLocation);
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const debounceTimeout = useRef<number>();
  const [isOrganizerOrCoowner, setIsOrganizerOrCoowner] = useState(isOrganizer || false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const handleAddDocument = () => setDocumentsRequired([...documentsRequired, { type: '', fileType: FileType.ANY, description: '', mandatory: false }]);
  const handleDocumentChange = (idx: number, field: keyof typeof documentsRequired[0], value: string | boolean) => {
    const docs = [...documentsRequired];
    (docs[idx] as any)[field] = value;
    setDocumentsRequired(docs);
  };
  const handleRemoveDocument = (idx: number) => setDocumentsRequired(documentsRequired.filter((_, i) => i !== idx));

  const handleAddMaterial = () => setMaterials([...materials, { tempId: Date.now().toString(), name: '', category: '', description: '', file: null }]);
  const handleMaterialChange = (idx: number, field: keyof Material, value: string | File | null) => {
    const mats = [...materials];
    (mats[idx] as any)[field] = value;
    setMaterials(mats);
  };
  const handleRemoveMaterial = (idx: number) => setMaterials(materials.filter((_, i) => i !== idx));

  const handleDateChange = (setter: (date: Date | null) => void, minDate?: Date) =>
    (value: unknown, _?: string) => {
      if (value instanceof Date && !isNaN(value.getTime())) {
        if (minDate && value < minDate) {
          return;
        }
        setter(value);

        // Если меняется дата окончания мероприятия, проверяем валидность дат приёма заявок
        if (setter === setDateEnd) {
          if (applicationStart && applicationStart > value) {
            setApplicationStart(null);
          }
          if (applicationEnd && applicationEnd > value) {
            setApplicationEnd(null);
          }
        }
      } else {
        setter(null);
      }
    };

  // Функция для сброса значения даты
  const handleClearDate = (setter: (date: Date | null) => void) => () => {
    setter(null);
    };

  const handleFileChange = (idx: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const mats = [...materials];
    mats[idx].file = fileList[0];
    setMaterials(mats);
  };

  const handleReviewerSearch = async () => {
    setReviewerLoading(true);
    setReviewerError('');
    try {
      const results = await searchUsersAPI(reviewerSearch);
      setReviewerResults(results);
      if (results.length === 0) setReviewerError(t('user_not_found'));
    } catch (e) {
      setReviewerError(t('search_error'));
    } finally {
      setReviewerLoading(false);
    }
  };

  const handleAddReviewer = (user: Reviewer) => {
    if (!reviewers.some(r => r.profileId === user.profileId)) {
      setReviewers([...reviewers, user]);
    }
    setReviewerResults([]);
    setReviewerSearch('');
  };

  const handleRemoveReviewer = (profileId: number) => {
    setReviewers(reviewers.filter(r => r.profileId !== profileId));
  };

  const handleCoownerSearch = async () => {
    setCoownerLoading(true);
    setCoownerError('');
    try {
      const results = await searchUsersAPI(coownerSearch);
      setCoownerResults(results);
      if (results.length === 0) setCoownerError(t('user_not_found'));
    } catch (e) {
      setCoownerError(t('search_error'));
    } finally {
      setCoownerLoading(false);
    }
  };

  const handleAddCoowner = (user: Reviewer) => {
    if (!coowners.some(r => r.profileId === user.profileId)) {
      setCoowners([...coowners, user]);
    }
    setCoownerResults([]);
    setCoownerSearch('');
  };

  const handleRemoveCoowner = (profileId: number) => {
    setCoowners(coowners.filter(r => r.profileId !== profileId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);
    setShowFillAllFieldsError(false);

    let hasError = false;
    if (!title.trim() || !description.trim() || !organizerDescription.trim() || !dateStart || !dateEnd || !applicationStart || !applicationEnd || !location.trim() || !theme.trim() || !format.trim() || !status.trim()) {
      hasError = true;
    }

    if (documentsRequired.length > 0) {
      for (let i = 0; i < documentsRequired.length; i++) {
        const doc = documentsRequired[i];
        if (
            !doc.type.trim() ||
            !doc.fileType ||
            !doc.description.trim()
        ) {
          hasError = true;
        }
      }
    }

    // Убираем проверку обязательных полей для материалов
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      // Проверяем только наличие файла для новых материалов
      if (!mat.fileId && !mat.file) {
        hasError = true;
        const newMaterials = [...materials];
        newMaterials[i].uploadError = t('file_is_required_for_new_material');
        setMaterials(newMaterials);
      }
    }

    if (hasError) {
      setShowFillAllFieldsError(true);
      return;
    }

    setShowFillAllFieldsError(false);
    setSaving(true);

    // Подготовка данных для отправки на сервер
    const filesToUpload: File[] = [];
    const fileEventRequestList: FileEventRequest[] = [];

    // Собираем файлы и их метаданные в одинаковом порядке
    materials.forEach(mat => {
      if (mat.file) {
        filesToUpload.push(mat.file);
        fileEventRequestList.push({
          fileName: mat.name || mat.file.name,
          filePath: '',
          uploadDate: new Date().toISOString(),
          fileType: mat.file.type || '',
          fileKindName: "MATERIAL",
          category: mat.category || '',
          description: mat.description || ''
        });
      }
    });

    const payloadForApi: EventRequest = {
      title,
      description,
      organizerDescription,
      dateStart: dateStart!.toISOString(),
      dateEnd: dateEnd!.toISOString(),
      applicationStart: applicationStart!.toISOString(),
      applicationEnd: applicationEnd!.toISOString(),
      location: addressInput,
      theme,
      format,
      type,
      observersAllowed,
      results,
      documentsRequired: documentsRequired.map(doc => ({
        type: doc.type,
        fileType: doc.fileType,
        description: doc.description,
        mandatory: doc.mandatory
      })),
      fileEvents: materials
        .filter(mat => !mat.file && mat.fileId) // Только существующие файлы без загрузки новых
        .map(mat => ({
          fileId: mat.fileId,
          // Если новое имя пустое - используем оригинальное имя
          fileName: mat.name.trim() || mat.fileName || '',
          filePath: mat.filePath || '',
          uploadDate: mat.uploadDate || new Date().toISOString(),
          fileType: mat.originalFileType || '',
          fileKindName: "MATERIAL",
          // Если новая категория пустая - используем оригинальную или пустую строку
          category: mat.category.trim() || '',
          // Если новое описание пустое - используем оригинальное или пустую строку
          description: mat.description.trim() || ''
        })),
      status,
      hidden,
      moderationStatus,
      reviewers,
      coowners
    };

    try {
      let eventId: number | string;

      if ((mode === 'edit' || mode === 'edit_coowner') && (initialData as any)?.eventId) {
        eventId = (initialData as any).eventId;
        await updateEventAPI(eventId as number, payloadForApi, filesToUpload, fileEventRequestList);
      } else if ((mode === 'moderate') && (initialData as any)?.eventId) {
        eventId = (initialData as any).eventId;
        await updateEventModerationStatusAPI(eventId as number, moderationStatus);
      } else {
        eventId = await createEventAPI(payloadForApi, filesToUpload, fileEventRequestList);
      }

      onSave(payloadForApi);

      // После успешного сохранения, навигация зависит от режима
      if (mode === 'moderate') {
        navigate(-1); // Возвращаемся на предыдущую страницу (список модерации)
      } else {
        navigate(eventId ? `/events/${eventId}` : `/my-events/`); // Переходим на страницу просмотра ивента для других режимов
      }
    } catch (error) {
      alert(t('error_creating_event'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);
  const handleConfirmDelete = async () => {
    const eventId = (initialData as any)?.eventId;
    if (mode === 'edit' && eventId) {
      const success = await deleteEventAPI(eventId);
      if (success) {
        navigate('/my-events');
      }
    }
    setDeleteDialogOpen(false);
  };

  const localeMap: Record<string, Locale> = { ru, en: enUS, enUS };
  const currentLocale = localeMap[i18n.language] || enUS;

  const areEventDatesFilled = !!dateStart && !!dateEnd;

  useEffect(() => {
    if (!areEventDatesFilled) {
      setApplicationStart(null);
      setApplicationEnd(null);
    }
  }, [dateStart, dateEnd]);

  const fetchAddressSuggestions = async (query: string) => {
    setAddressLoading(true);
    try {
      const response = await axiosInstance.get(`/address/suggest`, {
        params: { query }
      });
      setAddressOptions(response.data.map((item: any) => item.label || ''));
    } catch (error) {
      setAddressOptions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressInputChange = useCallback(
      (_: React.SyntheticEvent, value: string) => {
        setAddressInput(value)
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current)
        }
        if (value.trim().length < 3) {
          setAddressOptions([])
          return
        }
        debounceTimeout.current = window.setTimeout(() => {
          fetchAddressSuggestions(value)
        }, 400)
      },
      []
  )

  const getFormTitle = () => {
    console.log(mode);
    switch (mode) {
      case 'edit':
        return t('edit_event');
      case 'edit_coowner':
        return t('edit_coowner_event');
      case 'moderate':
        return t('moderate_event');
      default:
        return t('create_event');
    }
  };

  const getSubmitButtonLabel = () => {
    if (mode === 'edit' || mode === 'edit_coowner') return t('save');
    if (mode === 'moderate') return t('submit_moderation');
    return t('create_event');
  };

  useEffect(() => {
    const fileEventsFromProps = initialData?.fileEvents;
    const materialsPropDirectly = initialData?.materials; // Это initialData.materials, если существует

    let derivedNewMaterialsState: Material[] = [];

    if (fileEventsFromProps && fileEventsFromProps.length > 0) {
      derivedNewMaterialsState = fileEventsFromProps.map(fe => ({
        fileId: fe.fileId,
        name: fe.fileName,
        category: fe.category,
        description: fe.description,
        file: null,
        filePath: fe.filePath,
        uploadDate: fe.uploadDate,
        originalFileType: fe.fileType,
        // Сохраняем оригинальные значения для возможного восстановления
        fileName: fe.fileName,
        originalCategory: fe.category,
        originalDescription: fe.description,
        tempId: `existing-${fe.fileId}`
      }));
    } else if (materialsPropDirectly && materialsPropDirectly.length > 0) {
      derivedNewMaterialsState = materialsPropDirectly.map(m => ({
        ...m,
        file: m.file || null,
        // Сохраняем оригинальные значения для полей, если они есть
        fileName: m.name || m.fileName,
        originalCategory: m.category,
        originalDescription: m.description,
        tempId: m.tempId || `initial-prop-${Date.now()}-${Math.random()}`
      }));
    }

    if (JSON.stringify(materials) !== JSON.stringify(derivedNewMaterialsState)) {
      setMaterials(derivedNewMaterialsState);
    }
  }, [initialData?.fileEvents, initialData?.materials]);

  useEffect(() => {
    if (initialData) {
      const userEmail = localStorage.getItem('userEmail');
      const isUserOrganizer = isOrganizer;
      const isUserCoowner = initialData.coowners?.some(coowner => coowner.email === userEmail) || false;
      setIsOrganizerOrCoowner(isUserOrganizer || isUserCoowner);
    }
  }, [initialData, isOrganizer]);

  const handleExportParticipants = async () => {
    const eventId = (initialData as any)?.eventId;
    if (!eventId) return;

    try {
      const url = await exportEventParticipantsToExcel(eventId);
      // Создаем ссылку для скачивания файла
      const link = document.createElement('a');
      link.href = url;
      const fileName = (initialData as any)?.title || 'event';
      link.setAttribute('download', `${fileName}_participants.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при экспорте участников:', error);
    }
  };

  // Функция для обрезки имени файла посередине
  const truncateFilename = (filename: string, maxLength: number = 25): string => {
    if (!filename || filename.length <= maxLength) return filename;

    const extension = filename.includes('.') ? filename.split('.').pop() : '';
    const nameWithoutExt = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;

    const halfLength = Math.floor((maxLength - 3) / 2);
    const start = nameWithoutExt.substring(0, halfLength);
    const end = nameWithoutExt.substring(nameWithoutExt.length - halfLength);

    return extension
      ? `${start}...${end}.${extension}`
      : `${start}...${end}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={currentLocale}>
      <Grid container spacing={0} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 700, minWidth: 400, margin: 'auto', mt: 4, position: 'relative' }}>
            <LoadingOverlay loading={saving} />
            <Typography variant="h5" gutterBottom align="center">
              {getFormTitle()}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container direction="column" alignItems="center" spacing={2}>
                <Grid item xs={12} sx={{ width: '100%' }} component="div">
                  <TextField
                    label={t('title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                    disabled={mode === 'moderate' as any}
                    error={wasSubmitted && !title.trim()}
                    helperText={wasSubmitted && !title.trim() ? t('required_field') : ''}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <TextField
                    label={t('description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    required
                    disabled={mode === 'moderate' as any}
                    error={wasSubmitted && !description.trim()}
                    helperText={wasSubmitted && !description.trim() ? t('required_field') : ''}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <TextField
                    label={t('organizer_description')}
                    value={organizerDescription}
                    onChange={(e) => setOrganizerDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    disabled={mode === 'moderate' as any}
                    error={wasSubmitted && !organizerDescription.trim()}
                    helperText={wasSubmitted && !organizerDescription.trim() ? t('required_field') : ''}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label={t('start_date')}
                        value={dateStart}
                        onChange={(value, keyboardInputValue) => handleDateChange(setDateStart)(value, keyboardInputValue)}
                        minDateTime={new Date()}
                        maxDateTime={dateEnd || undefined}
                        ampm={false}
                        PopperProps={{
                          sx: {
                            '.MuiPickersPopper-paper': { minWidth: 360 },
                            '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                            '.MuiPickersArrowSwitcher-root': {
                              display: 'flex',
                              justifyContent: 'flex-end',
                              '& .MuiButtonBase-root': {
                                padding: '4px',
                                minWidth: '30px'
                              }
                            }
                          }
                        }}
                        disabled={mode === 'moderate' as any}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !dateStart}
                            helperText={wasSubmitted && !dateStart ? t('required_field') : ''}
                            inputProps={{ ...params.inputProps, placeholder: t('datetime_placeholder') }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                '& .MuiInputAdornment-root': {
                                  marginLeft: 0,
                                  '& .MuiButtonBase-root': {
                                    padding: '4px',
                                  }
                                }
                              },
                              endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  {dateStart && mode !== 'moderate' && (
                                    <IconButton
                                      size="small"
                                      onClick={handleClearDate(setDateStart)}
                                    >
                                      <Clear fontSize="small" />
                                    </IconButton>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </Box>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label={t('end_date')}
                        value={dateEnd}
                        onChange={(value, keyboardInputValue) => handleDateChange(setDateEnd, dateStart || new Date())(value, keyboardInputValue)}
                        minDateTime={dateStart || new Date()}
                        ampm={false}
                        PopperProps={{
                          sx: {
                            '.MuiPickersPopper-paper': { minWidth: 360 },
                            '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                            '.MuiPickersArrowSwitcher-root': {
                              display: 'flex',
                              justifyContent: 'flex-end',
                              '& .MuiButtonBase-root': {
                                padding: '4px',
                                minWidth: '30px'
                              }
                            }
                          }
                        }}
                        disabled={mode === 'moderate' as any}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !dateEnd}
                            helperText={wasSubmitted && !dateEnd ? t('required_field') : ''}
                            inputProps={{ ...params.inputProps, placeholder: t('datetime_placeholder') }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                '& .MuiInputAdornment-root': {
                                  marginLeft: 0,
                                  '& .MuiButtonBase-root': {
                                    padding: '4px',
                                  }
                                }
                              },
                              endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  {dateEnd && mode !== 'moderate' && (
                                    <IconButton
                                      size="small"
                                      onClick={handleClearDate(setDateEnd)}
                                    >
                                      <Clear fontSize="small" />
                                    </IconButton>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </Box>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label={t('application_start')}
                        value={applicationStart}
                        onChange={(value, keyboardInputValue) => handleDateChange(setApplicationStart)(value, keyboardInputValue)}
                        minDateTime={new Date()}
                        maxDateTime={applicationEnd || dateEnd || undefined}
                        ampm={false}
                        disabled={!areEventDatesFilled || mode === 'moderate' as any}
                        PopperProps={{
                          sx: {
                            '.MuiPickersPopper-paper': { minWidth: 360 },
                            '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                            '.MuiPickersArrowSwitcher-root': {
                              display: 'flex',
                              justifyContent: 'flex-end',
                              '& .MuiButtonBase-root': {
                                padding: '4px',
                                minWidth: '30px'
                              }
                            }
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !applicationStart && areEventDatesFilled}
                            helperText={wasSubmitted && !applicationStart && areEventDatesFilled ? t('required_field') : ''}
                            inputProps={{ ...params.inputProps, placeholder: t('datetime_placeholder') }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                '& .MuiInputAdornment-root': {
                                  marginLeft: 0,
                                  '& .MuiButtonBase-root': {
                                    padding: '4px',
                                  }
                                }
                              },
                              endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  {applicationStart && mode !== 'moderate' && (
                                    <IconButton
                                      size="small"
                                      onClick={handleClearDate(setApplicationStart)}
                                    >
                                      <Clear fontSize="small" />
                                    </IconButton>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </Box>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label={t('application_end')}
                        value={applicationEnd}
                        onChange={(value, keyboardInputValue) => handleDateChange(setApplicationEnd, applicationStart || undefined)(value, keyboardInputValue)}
                        minDateTime={applicationStart || undefined}
                        maxDateTime={dateEnd || undefined}
                        ampm={false}
                        disabled={!areEventDatesFilled || mode === 'moderate' as any}
                        PopperProps={{
                          sx: {
                            '.MuiPickersPopper-paper': { minWidth: 360 },
                            '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                            '.MuiPickersArrowSwitcher-root': {
                              display: 'flex',
                              justifyContent: 'flex-end',
                              '& .MuiButtonBase-root': {
                                padding: '4px',
                                minWidth: '30px'
                              }
                            }
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !applicationEnd && areEventDatesFilled}
                            helperText={wasSubmitted && !applicationEnd && areEventDatesFilled ? t('required_field') : ''}
                            inputProps={{ ...params.inputProps, placeholder: t('datetime_placeholder') }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                '& .MuiInputAdornment-root': {
                                  marginLeft: 0,
                                  '& .MuiButtonBase-root': {
                                    padding: '4px',
                                  }
                                }
                              },
                              endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  {applicationEnd && mode !== 'moderate' && (
                                    <IconButton
                                      size="small"
                                      onClick={handleClearDate(setApplicationEnd)}
                                    >
                                      <Clear fontSize="small" />
                                    </IconButton>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </Box>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Autocomplete
                    freeSolo
                    options={addressOptions}
                    loading={addressLoading}
                    value={addressInput}
                    inputValue={addressInput}
                    onInputChange={(event, newValue) => {
                      console.log('Autocomplete onInputChange triggered with value:', newValue);
                      setLocation(newValue || '');
                      handleAddressInputChange(event, newValue);
                    }}
                    onChange={(event, value) => {
                      console.log('Autocomplete onChange triggered with value:', value);
                      setAddressInput(value || '');
                      setLocation(value || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('location')}
                        fullWidth
                        required
                        disabled={mode === 'moderate' as any}
                        error={wasSubmitted && !location.trim()}
                        helperText={wasSubmitted && !location.trim() ? t('required_field') : ''}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {addressLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <TextField
                    label={t('theme')}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    fullWidth
                    disabled={mode === 'moderate' as any}
                    error={wasSubmitted && !theme.trim()}
                    helperText={wasSubmitted && !theme.trim() ? t('required_field') : ''}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth required disabled={mode === 'moderate' as any}>
                        <InputLabel>{t('format')}</InputLabel>
                        <Select
                          value={format}
                          onChange={(e) => setFormat(e.target.value as EventFormat)}
                          label={t('format')}
                        >
                          {Object.values(EventFormat).map((format) => (
                            <MenuItem key={format} value={format}>
                              {t(format.toLowerCase())}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <FormControlLabel
                        control={<Checkbox checked={observersAllowed} disabled={mode === 'moderate' as any} onChange={e => setObserversAllowed(e.target.checked)} />}
                        label={t('allow_observers')}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <FormControl fullWidth required disabled={mode === 'moderate' as any}>
                    <InputLabel>{t('event_type_label')}</InputLabel>
                    <Select
                      value={type}
                      onChange={(e) => setType(e.target.value as EventType)}
                      label={t('event_type_label')}
                    >
                      {Object.values(EventType).map((eventType) => (
                        <MenuItem key={eventType} value={eventType}>
                          {t(eventType.toLowerCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Box sx={{ mt: 4, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{t('documents_required')}</Typography>
                    {documentsRequired.map((doc, index) => (
                      <Paper key={index} elevation={2} sx={{ p: 2, mb: 2, background: (theme) => theme.palette.background.paper }}>
                        <Grid container spacing={2} alignItems="center">
                          {/* 1 ряд: Тип документа и Тип файла */}
                        <Grid item xs={6}>
                            <TextField
                              label={t('document_type')}
                              value={doc.type}
                              onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                              fullWidth
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !doc.type.trim()}
                            helperText={wasSubmitted && !doc.type.trim() ? t('required_field') : ''}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel id={`file-type-label-${index}`}>{t('file_type')}</InputLabel>
                              <Select
                                labelId={`file-type-label-${index}`}
                                value={doc.fileType}
                                onChange={(e) => handleDocumentChange(index, 'fileType', e.target.value)}
                                label={t('file_type')}
                            disabled={mode === 'moderate' as any}
                              >
                                {Object.values(FileType).map((fileType) => (
                                  <MenuItem key={fileType} value={fileType}>
                                    {t(fileType.toLowerCase())}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                        </Grid>

                          {/* 2 ряд: Описание */}
                        <Grid item xs={12}>
                          <TextField
                              label={t('document_description')}
                                    value={doc.description}
                              onChange={(e) => handleDocumentChange(index, 'description', e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            sx={{ '& .MuiInputBase-root': { height: 'auto' } }}
                            required
                            disabled={mode === 'moderate' as any}
                            error={wasSubmitted && !doc.description.trim()}
                              helperText={documentsRequired.length > 0 && wasSubmitted && !doc.description.trim() ? t('required_field') : ''}
                          />
                        </Grid>

                          {/* 3 ряд: Чекбокс "Обязательно" и кнопка удаления */}
                          <Grid item xs={8} sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormControlLabel
                              control={
                                <Checkbox
                                  checked={doc.mandatory}
                                  onChange={(e) => handleDocumentChange(index, 'mandatory', e.target.checked)}
                                  disabled={mode === 'moderate' as any}
                                />
                              }
                            label={t('mandatory')}
                          />
                        </Grid>
                          {(mode !== 'moderate' as any && <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Tooltip title={t('delete')}>
                            <IconButton
                                onClick={() => handleRemoveDocument(index)}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  p: 0,
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.08)',
                                  },
                                }}
                            >
                                <Delete />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                            )}
                      </Grid>
                    </Paper>
                  ))}
                    {(mode !== 'moderate' as any && <Button
                      startIcon={<Add />}
                      onClick={handleAddDocument}
                      sx={{ mt: 1 }}
                      color="primary"
                      variant="outlined"
                      fullWidth
                    >
                      {t('add_document')}
                    </Button>)}
                  </Box>
                </Grid>
                {(
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>{t('materials')}</Typography>
                    {materials.map((mat, idx) => (
                      <Paper key={idx} elevation={2} sx={{ p: 2, mb: 2, background: (theme) => theme.palette.background.paper }}>
                        <Grid container spacing={2} alignItems="center">
                          {/* 1 ряд: Название и Категория */}
                          <Grid item xs={6}>
                            <TextField
                              label={t('name')}
                              value={mat.name}
                              onChange={(e) => handleMaterialChange(idx, 'name', e.target.value)}
                              fullWidth
                              disabled={mode === 'moderate' as any}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label={t('category')}
                              value={mat.category}
                              onChange={(e) => handleMaterialChange(idx, 'category', e.target.value)}
                              fullWidth
                              disabled={mode === 'moderate' as any}
                            />
                          </Grid>
                          {/* 2 ряд: Описание */}
                          <Grid item xs={12}>
                            <TextField
                              label={t('description')}
                              value={mat.description}
                              onChange={(e) => handleMaterialChange(idx, 'description', e.target.value)}
                              fullWidth
                              multiline
                              minRows={2}
                              maxRows={4}
                              sx={{ '& .MuiInputBase-root': { height: 'auto' } }}
                              disabled={mode === 'moderate' as any}
                            />
                          </Grid>
                          {/* 3 ряд: Кнопка прикрепить файл и удалить */}
                          {(mode !== 'moderate' as any && <Grid item xs={8}  sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button variant="contained"  component="label" sx={{ minWidth: '150px', flexShrink: 0 }}>
                              {t('attach_file')}
                                <input
                                type="file"
                                hidden
                                onChange={e => handleFileChange(idx, e.target.files)}
                              />
                            </Button>
                            {mat.file && (
                              <Typography
                                variant="body2"
                                sx={{
                                  ml: 2,
                                  maxWidth: 'calc(100% - 150px)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={mat.file.name} // Полное имя файла показывается при наведении
                              >
                                {truncateFilename(mat.file.name)}
                              </Typography>
                            )}
                            {wasSubmitted && !mat.file && (
                              <Typography variant="body2" color="error" sx={{ ml: 2 }}>
                                {t('required_field')}
                              </Typography>
                            )}
                          </Grid>
                          )}
                          {(mode !== 'moderate' as any && <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Tooltip title={t('delete')}>
                              <IconButton
                                  onClick={() => handleRemoveMaterial(idx)}
                                  disabled={mode === 'moderate' as any}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    p: 0,
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.08)',
                                    },
                                  }}
                              >
                                <Delete/>
                              </IconButton>
                            </Tooltip>
                          </Grid>
                          )}
                        </Grid>
                      </Paper>
                    ))}
                    {(mode !== 'moderate' as any && <Button startIcon={<Add />} onClick={handleAddMaterial} sx={{ mt: 1 }} color="primary" variant="outlined" fullWidth>{t('add_material')}</Button>)}
                  </Grid>
                )}
                {((mode === 'edit' || mode === 'edit_coowner') && <Grid item xs={12} sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{t('add_reviewer')}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <TextField
                      label={t('email')}
                      value={reviewerSearch}
                      onChange={e => setReviewerSearch(e.target.value)}
                      size="small"
                      sx={{ minWidth: 250 }}
                    />
                    <Button variant="contained" onClick={handleReviewerSearch} disabled={reviewerLoading || !reviewerSearch.trim()}>
                      {t('search')}
                    </Button>
                  </Box>
                  {reviewerLoading && <Typography>{t('loading')}</Typography>}
                  {reviewerError && <Typography color="error">{reviewerError}</Typography>}
                  {reviewerResults.length > 0 && (
                    <Paper elevation={2} sx={{ p: 1, mb: 1, maxWidth: 400, minWidth: 300 }}>
                      {reviewerResults.map(user => (
                        <Box key={user.profileId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{user.firstName} {user.lastName} ({user.email})</Typography>
                          <Button size="small" variant="outlined" onClick={() => handleAddReviewer(user)}>{t('add')}</Button>
                        </Box>
                      ))}
                    </Paper>
                  )}
                  {reviewers.length > 0 && (
                    <Paper elevation={2} sx={{ p: 2, mt: 1, background: (theme) => theme.palette.background.paper }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('reviewers_list')}</Typography>
                      {reviewers.map(user => (
                        <Box key={user.profileId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{user.firstName} {user.lastName} ({user.email})</Typography>
                          <Button size="small" color="error" variant="outlined" onClick={() => handleRemoveReviewer(user.profileId)}>{t('remove')}</Button>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Grid>
                )}
                {mode === 'edit' && (
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>{t('add_coowner')}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <TextField
                        label={t('email')}
                        value={coownerSearch}
                        onChange={e => setCoownerSearch(e.target.value)}
                        size="small"
                        sx={{ minWidth: 250 }}
                      />
                      <Button variant="contained" onClick={handleCoownerSearch} disabled={coownerLoading || !coownerSearch.trim()}>
                        {t('search')}
                      </Button>
                    </Box>
                    {coownerLoading && <Typography>{t('loading')}</Typography>}
                    {coownerError && <Typography color="error">{coownerError}</Typography>}
                    {coownerResults.length > 0 && (
                      <Paper elevation={2} sx={{ p: 1, mb: 1, maxWidth: 400, minWidth: 300 }}>
                        {coownerResults.map(user => (
                          <Box key={user.profileId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>{user.firstName} {user.lastName} ({user.email})</Typography>
                            <Button size="small" variant="outlined" onClick={() => handleAddCoowner(user)}>{t('add')}</Button>
                          </Box>
                        ))}
                      </Paper>
                    )}
                    {coowners.length > 0 && (
                      <Paper elevation={2} sx={{ p: 2, mt: 1, background: (theme) => theme.palette.background.paper }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('coowners_list')}</Typography>
                        {coowners.map(user => (
                          <Box key={user.profileId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>{user.firstName} {user.lastName} ({user.email})</Typography>
                            <Button size="small" color="error" variant="outlined" onClick={() => handleRemoveCoowner(user.profileId)}>{t('remove')}</Button>
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Grid>
                )}
                {(mode === 'edit' || mode === 'edit_coowner') &&
                    (<Grid item xs={12} sx={{ width: '100%' }}>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      {t('results_visibility_tooltip')}
                    </Typography>
                  <TextField
                    label={t('results')}
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={mode === 'moderate' as any}
                  />
                </Grid>
              )}
                <Grid item xs={12} sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {showFillAllFieldsError && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {t('fill_all_fields')}
                    </Typography>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    size="large"
                    sx={{ px: 6, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem', boxShadow: 3 }}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} color="inherit" /> : getSubmitButtonLabel()}
                  </Button>
                </Grid>
                {onCancel && (
                  <Grid item xs={12}  sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Button onClick={onCancel} variant="outlined" color="secondary" size="large" sx={{ px: 6, py: 1.5 }}>
                      {t('cancel')}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={status}
                label={t('status')}
                disabled={mode === 'moderate' as any}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                {Object.values(EventStatus).map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(s.toLowerCase())}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(mode !== 'create' && <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('moderation_status')}</InputLabel>
              <Select
                  value={moderationStatus}
                  disabled={mode !== 'moderate' as any}
                  label={t('moderation_status')}
                  onChange={(e) => setModerationStatus(e.target.value as ModerationStatus)}
              >
                {Object.values(ModerationStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {t(status.toLowerCase())}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>)}
            {mode === 'edit' && (initialData as any)?.eventId && (
              <>
                {isOrganizerOrCoowner && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<FileDownloadIcon />}
                    sx={{ mb: 2 }}
                    onClick={handleExportParticipants}
                    fullWidth
                  >
                    {t('export_participants')}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  sx={{ mt: 1, fontWeight: 'bold' }}
                  onClick={handleOpenDeleteDialog}
                >
                  {t('delete')}
                </Button>
                <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                  <DialogTitle>{t('confirm_delete_title')}</DialogTitle>
                  <DialogContent>
                    <Typography>{t('confirm_delete_text')}</Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>{t('cancel')}</Button>
                    <Button color="error" onClick={handleConfirmDelete}>{t('delete_confirm')}</Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
    );
};

export default EventForm;
