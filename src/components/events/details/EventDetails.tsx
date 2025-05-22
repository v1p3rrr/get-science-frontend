import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, selectEvent } from '../../../api/eventsSlice';
import { AppDispatch, RootState } from '../../../app/store';
import { Event, FileEvent } from '../../../models/Models';
import { useTranslation } from 'react-i18next';
import { fetchRecommendationsAPI, deleteEventAPI, fetchEventWithPeopleByIdAPI, fetchEventByIdAPI, exportEventToCalendarAPI, exportEventParticipantsToExcel } from '../../../api/eventsAPI';
import EventCard from '../list/EventCard';
import {getToken, getUserProfileId, getUserRoles} from '../../../services/auth';
import { toSentenceCase } from '../../../util/utils';
import {
  Container,
  Paper,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  CircularProgress,
  styled,
  Tooltip,
  IconButton,
  Collapse,
  Grid,
  Link as MuiLink,
  Dialog,
  DialogContent,
  Backdrop,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn,
  Category,
  FormatListBulleted,
  AttachFile,
  CalendarToday,
  Person,
  Info,
  Description,
  Assessment,
  AccessTime,
  Visibility,
  VpnKey,
  CheckCircleOutline,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChatBubbleOutline as ChatIcon,
  People,
  RateReview,
  Topic as TopicIcon,
  Add as ApplyIcon,
  CalendarMonth as CalendarIcon,
  FileDownload as FileDownloadIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  Folder as FolderIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Computer as ComputerIcon,
  LocationCity as LocationCityIcon,
  DeviceHub as DeviceHubIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import LoginIcon from "@mui/icons-material/Login";
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import axiosInstance from '../../../util/axiosInstance';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const EventTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const DocumentLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  paddingLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ExpandButton = styled(IconButton)(({ theme }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: theme.spacing(1.5),
    color: theme.palette.text.secondary,
  },
  '& .MuiListItemText-secondary': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  '& .MuiIconButton-root': {
    padding: theme.spacing(0.5),
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
    <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>{icon}</ListItemIcon>
    <Box>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body1" component="div">{value}</Typography>
    </Box>
  </Box>
);

// Стили для заголовка секции (Документы/Файлы)
const CollapsibleSectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginBottom: theme.spacing(1),
    width: '100%',
    justifyContent: 'space-between'
}));

// Поддерживаемые форматы видео
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'm4v', 'mpg', 'mpeg'];

// Поддерживаемые форматы изображений
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif'];

// Функция для проверки, является ли файл видео
const isVideoFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? VIDEO_EXTENSIONS.includes(extension) : false;
};

// Функция для проверки, является ли файл изображением
const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? IMAGE_EXTENSIONS.includes(extension) : false;
};

// Компонент для группировки файлов по категории
interface FileGroup {
  category: string;
  files: FileEvent[];
}

// Функция для группировки файлов по категориям
const groupFilesByCategory = (files: FileEvent[]): FileGroup[] => {
  const groupsMap = new Map<string, FileEvent[]>();
  
  // Группируем файлы по категории
  files.forEach(file => {
    const category = file.category || 'Без категории';
    if (!groupsMap.has(category)) {
      groupsMap.set(category, []);
    }
    groupsMap.get(category)?.push(file);
  });
  
  // Преобразуем Map в массив групп и сортируем по категории
  const groups = Array.from(groupsMap.entries()).map(([category, files]) => ({
    category,
    files
  }));
  
  return groups.sort((a, b) => a.category.localeCompare(b.category));
};

// Компонент для просмотра изображений
const ImageViewer: React.FC<{ url: string; fileName: string; onClose: () => void }> = ({ url, fileName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setError(t('image_load_error'));
    setLoading(false);
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Закрытие при клике на фон, но не при клике на изображение
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        onClick: handleBackdropClick
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent 
        sx={{ 
          p: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '70vh',
          cursor: 'zoom-out'
        }}
        onClick={handleBackdropClick}
      >
        {loading && (
          <Box 
            position="absolute" 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            width="100%" 
            height="100%"
            zIndex={1}
          >
            <CircularProgress color="primary" size={60} />
          </Box>
        )}
        
        {error ? (
          <Box textAlign="center" p={3}>
            <Typography variant="h6" color="error">{error}</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>{t('try_download_instead')}</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              onClick={onClose}
            >
              {t('close')}
            </Button>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%',
              height: '100%',
              cursor: 'default',
              '& img': {
                maxWidth: '90%',
                maxHeight: 'calc(90vh - 100px)',
                objectFit: 'contain'
              }
            }}
          >
            <img 
              src={url} 
              alt={fileName} 
              onLoad={handleLoad} 
              onError={handleError}
              style={{ cursor: 'zoom-in' }}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        )}
        
        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2, 
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            fontWeight: 500,
            px: 2,
            py: 1
          }}
        >
          {fileName}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

// Компонент для воспроизведения видео
const VideoPlayer: React.FC<{ url: string; fileName: string; onClose: () => void }> = ({ url, fileName, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  const handleError = () => {
    setError(t('video_playback_error'));
    setLoading(false);
  };
  
  const handleLoaded = () => {
    setLoading(false);
  };
  
  const handlePlay = () => {
    setLoading(false);
  };
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          position: 'relative'
        }
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        {loading && (
          <Box 
            position="absolute" 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            width="100%" 
            height="100%"
            zIndex={1}
          >
            <CircularProgress color="primary" size={60} />
          </Box>
        )}
        
        {error ? (
          <Box textAlign="center" p={3}>
            <Typography variant="h6" color="error">{error}</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>{t('try_download_instead')}</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              onClick={onClose}
            >
              {t('close')}
            </Button>
          </Box>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            controlsList="nodownload"
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 100px)' }}
            onError={handleError}
            onLoadedData={handleLoaded}
            onPlay={handlePlay}
          >
            <source src={url} type={`video/${fileName.split('.').pop()?.toLowerCase()}`} />
            {t('browser_not_support_video')}
          </video>
        )}
        
        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2, 
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            fontWeight: 500,
            px: 2,
            py: 1
          }}
        >
          {fileName}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

type Params = {
  eventId: string;
};

const EventDetails: React.FC = () => {
  const { eventId } = useParams<Params>();
  const navigate = useNavigate();
  const parsedEventId = eventId ? parseInt(eventId, 10) : 0;
  const dispatch: AppDispatch = useDispatch();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const roles = getUserRoles();
  const token = getToken();
  const [documentsExpanded, setDocumentsExpanded] = useState(true);
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isOrganizerOrCoowner, setIsOrganizerOrCoowner] = useState(false);
  const [isApplicationPeriod, setIsApplicationPeriod] = useState(true);
  const [applicationPeriodMessage, setApplicationPeriodMessage] = useState<string | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; fileName: string } | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; fileName: string } | null>(null);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  const currentLocale = i18n.language === 'ru' ? ru : enUS;

  useEffect(() => {
    if (parsedEventId) {
      setLoading(true);
      setError(null);
      fetchEventByIdAPI(parsedEventId)
        .then(data => {
          setEvent(data);
      fetchRecommendationsAPI(parsedEventId).then(setRecommendations);
          setLoading(false);
        })
        .catch(err => {
          console.error("Ошибка при загрузке деталей события:", err);
          setError(t('failed_to_load'));
          setLoading(false);
        });
    }
  }, [parsedEventId, dispatch, t]);

  useEffect(() => {
    if (event) {
      const userProfileId = getUserProfileId();
      setIsOwner(event.organizerId === userProfileId);
      const isOrganizer = event.organizerId === userProfileId;
      const isCoowner = event.coowners?.some(coowner => coowner.profileId === userProfileId) || false;
      setIsOrganizerOrCoowner(isOrganizer || isCoowner);
      
      // Проверка периода подачи заявок
      const now = new Date();
      const applicationStartDate = new Date(event.applicationStart);
      const applicationEndDate = new Date(event.applicationEnd);
      
      if (now < applicationStartDate) {
        setIsApplicationPeriod(false);
        setApplicationPeriodMessage(t('application_period_not_started'));
      } else if (now > applicationEndDate) {
        setIsApplicationPeriod(false);
        setApplicationPeriodMessage(t('application_period_ended'));
      } else {
        setIsApplicationPeriod(true);
        setApplicationPeriodMessage(null);
      }
    }
  }, [event, t]);

  const handleApply = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/events/${parsedEventId}/apply`);
  };

  const handleDocumentsToggle = () => {
    setDocumentsExpanded(!documentsExpanded);
  };

  const handleFilesToggle = () => {
    setFilesExpanded(!filesExpanded);
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      setLoading(true);
      // Получаем актуальную ссылку через API
      const response = await axiosInstance.get(`/files/events/download/${fileId}/direct-link`);
      const url = response.data;
      
    if (!url) {
      console.error('Download URL is not available for:', filename);
      return;
    }
    
    // Убедимся, что имя файла содержит расширение
    let downloadFilename = filename;
    
    // Если в URL есть параметр response-content-disposition, извлечем filename из него
    if (url.includes('response-content-disposition=')) {
      try {
        const contentDispositionParam = url.split('response-content-disposition=')[1].split('&')[0];
        const decodedParam = decodeURIComponent(contentDispositionParam);
        const filenameMatch = decodedParam.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1];
        }
      } catch (error) {
        console.warn('Failed to extract filename from content-disposition', error);
      }
    }
    
    // Проверим наличие расширения файла
    if (!downloadFilename.includes('.')) {
      // Попытаемся определить расширение из имени файла или из типа файла
      const fileExtension = getFileExtensionFromName(filename);
      if (fileExtension) {
        downloadFilename = `${downloadFilename}.${fileExtension}`;
      }
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    link.setAttribute('download', downloadFilename); // Явно устанавливаем атрибут download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция для извлечения расширения файла из его имени
  const getFileExtensionFromName = (filename: string): string | null => {
    // Ищем расширение в имени файла
    const match = filename.match(/\.([^.]+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
    
    // Если расширение не найдено, пытаемся определить по имени файла
    if (filename.toLowerCase().includes('mp4')) return 'mp4';
    if (filename.toLowerCase().includes('pdf')) return 'pdf';
    if (filename.toLowerCase().includes('doc')) return 'doc';
    if (filename.toLowerCase().includes('docx')) return 'docx';
    if (filename.toLowerCase().includes('xls')) return 'xls';
    if (filename.toLowerCase().includes('xlsx')) return 'xlsx';
    if (filename.toLowerCase().includes('jpg') || filename.toLowerCase().includes('jpeg')) return 'jpg';
    if (filename.toLowerCase().includes('png')) return 'png';
    
    return null;
  };

  const handleEdit = () => {
    navigate(`/events/${parsedEventId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm(t('confirm_delete_event'))) {
      try {
      const success = await deleteEventAPI(parsedEventId);
      if (success) {
          navigate('/my-events');
        } else {
          console.error(t('failed_to_delete_event'));
        }
      } catch (delError) {
        console.error("Ошибка при удалении события:", delError);
      }
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'PPPp', { locale: currentLocale })} - ${format(endDate, 'PPPp', { locale: currentLocale })}`;
  };

  const formatSingleDate = (date: string) => {
    const d = new Date(date);
    return format(d, 'PPPp', { locale: currentLocale });
  };

  const handleExportToCalendar = async () => {
    if (!parsedEventId) return;
    try {
      setLoading(true);
      const url = await exportEventToCalendarAPI(parsedEventId);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.title || 'event'}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка при экспорте календаря:", error);
      setLoading(false);
    }
  };

  const handleExportParticipants = async () => {
    if (!parsedEventId) return;
    try {
      setLoading(true);
      const url = await exportEventParticipantsToExcel(parsedEventId);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.title || 'event'}_participants.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка при экспорте участников:", error);
      setLoading(false);
    }
  };

  // Форматирование дат для отображения в сообщении о периоде подачи заявок
  const getFormattedApplicationPeriod = () => {
    if (!event) return '';
    
    const startDate = formatDateShort(event.applicationStart);
    const endDate = formatDateShort(event.applicationEnd);
    
    return t('apply_during_period', { startDate, endDate });
  };
  
  // Форматирование короткой даты (без времени)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy', { locale: currentLocale });
  };

  const handlePlayVideo = async (fileId: number, fileName: string) => {
    try {
      // Получаем актуальную ссылку через API
      const response = await axiosInstance.get(`/files/events/download/${fileId}/direct-link`);
      const url = response.data;
      
    if (!url) {
      console.error('Video URL is not available for:', fileName);
      return;
    }
    setSelectedVideo({ url, fileName });
    setVideoPlayerOpen(true);
    } catch (error) {
      console.error('Error getting video URL:', error);
    }
  };
  
  const handleCloseVideoPlayer = () => {
    setVideoPlayerOpen(false);
    setSelectedVideo(null);
    // Убедимся, что скроллинг восстановлен
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 100);
  };

  const handleViewImage = async (fileId: number, fileName: string) => {
    try {
      // Получаем актуальную ссылку через API
      const response = await axiosInstance.get(`/files/events/download/${fileId}/direct-link`);
      const url = response.data;
      
    if (!url) {
      console.error('Image URL is not available for:', fileName);
      return;
    }
    setSelectedImage({ url, fileName });
    setImageViewerOpen(true);
    } catch (error) {
      console.error('Error getting image URL:', error);
    }
  };
  
  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
    setSelectedImage(null);
    // Убедимся, что скроллинг восстановлен
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 100);
  };
  
  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Группировка файлов по категориям после загрузки мероприятия
  useEffect(() => {
    if (event?.fileEvents) {
      const groups = groupFilesByCategory(event.fileEvents);
      setFileGroups(groups);
      
      // По умолчанию все категории развернуты
      const expanded: { [key: string]: boolean } = {};
      groups.forEach(group => {
        expanded[group.category] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [event?.fileEvents]);

  // Функция для обрезки текста с многоточием в середине
  const truncateMiddle = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    
    const startChars = Math.floor((maxLength - 3) / 2);
    const endChars = Math.ceil((maxLength - 3) / 2);
    
    return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`;
  };

  // Выбор иконки в зависимости от типа мероприятия
  const getTypeIcon = () => {
    if (!event) return <EventIcon />;
    
    switch(event.type) {
      case 'CONFERENCE':
        return <SchoolIcon />;
      case 'SEMINAR':
        return <MenuBookIcon />;
      default:
        return <EventIcon />;
    }
  };

  // Выбор иконки в зависимости от формата мероприятия
  const getFormatIcon = () => {
    if (!event) return <DeviceHubIcon />;
    
    switch(event.format) {
      case 'ONLINE':
        return <ComputerIcon />;
      case 'OFFLINE':
        return <LocationCityIcon />;
      case 'HYBRID':
        return <DeviceHubIcon />;
      default:
        return <DeviceHubIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)" position="relative">
        <Backdrop
          open={true}
          sx={{ 
            position: 'absolute',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'transparent'
          }}
        >
        <CircularProgress />
        </Backdrop>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <Typography variant="h6" color="text.secondary" align="center">
          {t('event_not_found')}
        </Typography>
      </Box>
    );
  }

  const hasDocuments = event.documentsRequired && event.documentsRequired.length > 0;
  const hasFiles = event.fileEvents && event.fileEvents.length > 0;

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      <StyledPaper elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <EventTitle variant="h4" sx={{ flexGrow: 1 }}>
            {event.title}
          </EventTitle>
          <Grid container item xs={12} sm="auto" spacing={0.5} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          {isOwner && (
              <>
                <Grid item>
              <Tooltip title={t('edit')}>
                    <IconButton onClick={handleEdit} size="small" color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
                </Grid>
                <Grid item>
              <Tooltip title={t('delete')}>
                <IconButton onClick={handleDelete} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
                </Grid>
              </>
          )}
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <DetailItem
              icon={<Person />}
              label={t('organizer')}
              value={event.organizer}
            />
            {event.organizerDescription && (
              <DetailItem
                icon={<Info />}
                label={t('organizer_description')}
                value={<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{event.organizerDescription}</Typography>}
              />
            )}
            <StyledDivider />
            <DetailItem
              icon={<CalendarToday />}
              label={t('event_dates')}
              value={formatDateRange(event.dateStart, event.dateEnd)}
            />
            <DetailItem
              icon={<AccessTime />}
              label={t('application_dates')}
              value={formatDateRange(event.applicationStart, event.applicationEnd)}
            />
            <StyledDivider />
            <DetailItem
              icon={<LocationOn />}
              label={t('location')}
              value={event.location}
            />
            <StyledDivider />
            
            {/* Группа из типа, формата и наблюдателей в одной строке */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>{getTypeIcon()}</Box>
                    <Typography variant="body2" color="text.secondary">{t('type')}</Typography>
                  </Box>
                  <StyledChip label={t(event.type?.toLowerCase() ?? 'n/a')} color="primary" size="small" />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>{getFormatIcon()}</Box>
                    <Typography variant="body2" color="text.secondary">{t('format')}</Typography>
                  </Box>
                  <StyledChip label={t(event.format.toLowerCase())} variant="outlined" size="small" />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ mr: 1, color: 'text.secondary' }}><Visibility /></Box>
                  <Typography variant="body2">
                    {event.observersAllowed ? t('observer_allowed_yes') : t('observer_allowed_no')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Тема мероприятия в отдельной строке */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 1, color: 'text.secondary' }}><Info /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>{t('theme')}:</Typography>
              <Typography variant="body1">
                {event.theme || '-'}
              </Typography>
            </Box>
            
            <StyledDivider />
            
            <Box sx={{ mt: 2 }}>
              <SectionTitle variant="h6">
                <Description /> {t('description')}
              </SectionTitle>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {event.description}
              </Typography>

              <StyledDivider />

              {event.results && (
                <>
                  <SectionTitle variant="h6">
                    <Assessment /> {t('results')}
                  </SectionTitle>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                    {event.results}
                  </Typography>
                </>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Секция с документами */}
            <Paper variant={hasDocuments ? "elevation" : "outlined"} elevation={hasDocuments ? 2 : 0} sx={{ p: 2, mb: 3 }}>
              <CollapsibleSectionHeader onClick={hasDocuments ? handleDocumentsToggle : undefined} sx={{ cursor: hasDocuments ? 'pointer' : 'default' }}>
                  <SectionTitle variant="h6" sx={{ flexGrow: 1, margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                  <AttachFile sx={{ fontSize: '1.2rem', mr: 1 }} /> {t('required_documents')}
                </SectionTitle>
                {hasDocuments && (
                  documentsExpanded ? 
                    <ExpandLessIcon color="action" /> : 
                    <ExpandMoreIcon color="action" />
                )}
                </CollapsibleSectionHeader>
              
              {hasDocuments ? (
                <Collapse in={documentsExpanded}>
                  <List disablePadding>
                    {event.documentsRequired.map((doc, index) => (
                      <ListItem
                        key={index}
                        disablePadding
                        sx={{ py: 0.5, borderTop: index !== 0 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none' }}
                      >
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography component="span" variant="body1" fontWeight={500}>
                                {doc.type}
                                {doc.mandatory && <Typography component="span" color="error" sx={{ ml: 0.5 }}>*</Typography>}
                              </Typography>
                              <Chip
                                label={t(doc.fileType.toLowerCase())}
                                color="primary"
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                          secondary={doc.description}
                        />
                      </ListItem>
                  ))}
                </List>
              </Collapse>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                  <FormatListBulleted sx={{ mr: 1 }} />
                  <Typography variant="body2">{t('no_required_documents')}</Typography>
                </Box>
              )}
            </Paper>

            {hasFiles && (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, maxWidth: '100%' }}>
                <CollapsibleSectionHeader onClick={handleFilesToggle}>
                  <SectionTitle variant="h6" sx={{ flexGrow: 1, margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                    <AttachFile sx={{ fontSize: '1.2rem', mr: 1 }} /> {t('event_files')}
                </SectionTitle>
                  {filesExpanded ? 
                    <ExpandLessIcon color="action" /> : 
                    <ExpandMoreIcon color="action" />
                  }
                </CollapsibleSectionHeader>
                <Collapse in={filesExpanded}>
                  <List dense disablePadding>
                    {fileGroups.map((group) => (
                      <React.Fragment key={group.category}>
                        <ListItem 
                          button 
                          onClick={() => toggleCategoryExpand(group.category)}
                  sx={{
                            bgcolor: (theme) => theme.palette.background.default,
                            my: 1,
                            borderRadius: 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <ListItemIcon>
                            <FolderIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography variant="subtitle1" fontWeight="500">
                                {group.category} ({group.files.length})
                              </Typography>
                            } 
                          />
                          {expandedCategories[group.category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItem>
                        <Collapse in={expandedCategories[group.category]}>
                          {group.files.map(file => (
                    <StyledListItem 
                      key={file.fileId} 
                      disablePadding
                              sx={{
                                backgroundColor: (theme) => theme.palette.background.paper,
                                mb: 1,
                                borderRadius: 1,
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                '&:hover': {
                                  backgroundColor: (theme) => theme.palette.action.hover
                                }
                              }}
                            >
                              <Grid container sx={{ width: '100%', alignItems: 'center' }}>
                                <Grid item xs={1} sx={{ textAlign: 'center' }}>
                                  <ListItemIcon sx={{ minWidth: 'auto', display: 'flex', justifyContent: 'center' }}>
                                    {isVideoFile(file.fileName) ? (
                                      <PlayCircleOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    ) : isImageFile(file.fileName) ? (
                                      <ImageIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    ) : (
                                      <AttachFile fontSize="small" />
                                    )}
                                  </ListItemIcon>
                                </Grid>
                                <Grid item xs={8} sx={{ pr: 1 }}>
                                  <Tooltip title={file.fileName} placement="top">
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'block',
                                        width: '100%',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {truncateMiddle(file.fileName, 28)}
                                    </Typography>
                                  </Tooltip>
                                  {file.description && (
                                    <Tooltip title={file.description} placement="top">
                                      <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {file.description}
                                      </Typography>
                                    </Tooltip>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {formatSingleDate(file.uploadDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={3} sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'flex-end', 
                                  borderLeft: '1px solid',
                                  borderColor: 'divider', 
                                  pl: 1,
                                  pr: 1
                                }}>
                                  <Grid container spacing={1} alignItems="center" justifyContent="center" sx={{ m: 0 }}>
                                    <Grid item>
                                      {isVideoFile(file.fileName) && (
                                        <Tooltip title={t('play_video')}>
                            <IconButton
                              size="small"
                                            color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayVideo(file.fileId, file.fileName);
                                            }}
                                          >
                                            <PlayCircleOutlineIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {isImageFile(file.fileName) && (
                                        <Tooltip title={t('view_image')}>
                                          <IconButton
                                            size="small"
                                            color="secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewImage(file.fileId, file.fileName);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                                      )}
                                    </Grid>
                                    <Grid item>
                          <Tooltip title={t('download')}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file.fileId, file.fileName);
                              }}
                              disabled={!file.fileId}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                    </StyledListItem>
                  ))}
                        </Collapse>
                        {group !== fileGroups[fileGroups.length - 1] && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </React.Fragment>
                    ))}
                    {fileGroups.length === 0 && (
                      <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        {t('no_files')}
                      </Typography>
                    )}
                </List>
              </Collapse>
            </Paper>
            )}

            <Box mt={2} mb={1}>
              {!token && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleApply}
                  startIcon={<LoginIcon />}
                  disabled={!isApplicationPeriod}
                >
                  {t('login_to_apply')}
                </Button>
              )}

              {token && roles.includes('USER') && (
                <>
                  <Button
                      variant="contained"
                      color="primary"
                    size="large"
                      fullWidth
                      onClick={handleApply}
                    startIcon={<ApplyIcon />}
                    disabled={!isApplicationPeriod}
                  >
                    {t('do_apply')}
                  </Button>
                  {!isApplicationPeriod && applicationPeriodMessage && (
                    <Typography 
                      variant="body2" 
                      color="error" 
                      align="center" 
                      sx={{ mt: 1 }}
                    >
                      {applicationPeriodMessage}
                    </Typography>
                  )}
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    align="center" 
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {getFormattedApplicationPeriod()}
                  </Typography>
                </>
              )}
            </Box>
            <Box>
                {token && !isOwner && roles.includes('USER') && (
                    <Box mt={1}>
                  <Button
                      variant="outlined"
                            color="info"
                            size="large"
                      fullWidth
                            onClick={() => navigate(`/events/${parsedEventId}/chat`, { state: { from: 'event' } })}
                            startIcon={<ChatIcon/>}
                  >
                            {t('chat_with_organizer_button')}
                  </Button>
            </Box>
                )}
            </Box>
            <Box mt={1}>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                fullWidth
                onClick={handleExportToCalendar}
                startIcon={<CalendarIcon />}
              >
                {t('export_to_calendar')}
              </Button>
            </Box>
            {isOrganizerOrCoowner && (
              <Box mt={1}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  fullWidth
                  onClick={handleExportParticipants}
                  startIcon={<FileDownloadIcon />}
                >
                  {t('export_participants')}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </StyledPaper>

      {recommendations.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <SectionTitle variant="h5">
            {t('recommended_events')}
          </SectionTitle>
          <Grid container spacing={2}>
            {recommendations.slice(0, 3).map((recEvent) => (
              <Grid item xs={12} sm={6} md={4} key={recEvent.eventId}>
                <EventCard event={recEvent} isEditable={false} showStatus={false} />
              </Grid>
            ))}
          </Grid>
          </Box>
      )}

      {imageViewerOpen && selectedImage && (
        <ImageViewer
          url={selectedImage.url}
          fileName={selectedImage.fileName}
          onClose={handleCloseImageViewer}
        />
      )}

      {videoPlayerOpen && selectedVideo && (
        <VideoPlayer
          url={selectedVideo.url}
          fileName={selectedVideo.fileName}
          onClose={handleCloseVideoPlayer}
        />
      )}
      
      {/* Компонент для восстановления скроллинга при проблемах со стилем overflow */}
      <Box
        sx={{ display: 'none' }}
        component="div"
        onMouseEnter={() => {
          // Проверяем, залип ли overflow: hidden на body
          if (document.body.style.overflow === 'hidden' && !imageViewerOpen && !videoPlayerOpen) {
            // Восстанавливаем скроллинг, если нет открытых модальных окон
            document.body.style.overflow = '';
          }
        }}
      />
    </Box>
  );
};

export default EventDetails;
