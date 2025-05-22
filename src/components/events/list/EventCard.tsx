import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Event } from '../../../models/Models';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { deleteEventAPI } from '../../../api/eventsAPI';
import { fetchMyEvents } from '../../../api/eventsSlice';
import { AppDispatch } from "../../../app/store";
import { toSentenceCase } from "../../../util/utils";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  styled,
  CardActions,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  LocalOffer as LocalOfferIcon,
  Computer as ComputerIcon,
  LocationCity as LocationCityIcon,
  DeviceHub as DeviceHubIcon,
  Event as EventIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import TopicIcon from '@mui/icons-material/Topic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import {getUserProfileId} from "../../../services/auth";

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
});

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
    fontSize: '1.2rem',
  },
}));

type EventCardProps = {
  event: Event;
  isEditable?: boolean;
  onEditClick?: (event: Event) => void;
  showStatus?: boolean;
  onClick?: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, isEditable = false, onEditClick, showStatus = true, onClick }) => {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { t } = useTranslation();
  const [isOwner, setIsOwner] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (event) {
      const userProfileId = getUserProfileId();
      setIsOwner(event.organizerId === userProfileId);
    }
  }, [event]);

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick(event);
    } else {
      navigate(`/events/${event.eventId}/edit`);
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);

  const handleConfirmDelete = async () => {
      const success = await deleteEventAPI(event.eventId);
      if (success) {
        dispatch(fetchMyEvents());
      }
    setDeleteDialogOpen(false);
  };

  // Выбор иконки в зависимости от типа мероприятия
  const getTypeIcon = () => {
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

  // Иконка для индикации возможности наблюдателей
  const observersAllowedIcon = event.observersAllowed ? (
    <InfoItem>
      <VisibilityIcon />
      <Typography variant="body2">{t('observers_allowed')}</Typography>
    </InfoItem>
  ) : null;

  return (
    <StyledCard onClick={onClick}>
      <StyledLink to={`/events/${event.eventId}`}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {event.title}
            </Typography>
            {showStatus && (
              <Box>
                <Chip 
                  label={t(event.status.toLowerCase())}
                  size="small"
                  color={event.status === 'ACTIVE' ? 'success' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={t(event.moderationStatus.toLowerCase())}
                  size="small"
                  color={event.moderationStatus === 'APPROVED' ? 'success' : 'warning'}
                />
              </Box>
            )}
          </Box>

          <InfoItem>
            <LocationOnIcon />
            <Typography variant="body2">{event.location}</Typography>
          </InfoItem>

          <InfoItem>
            <CalendarTodayIcon />
            <Typography variant="body2">
              {new Date(event.dateStart).toLocaleDateString()} - {new Date(event.dateEnd).toLocaleDateString()}
            </Typography>
          </InfoItem>

          <InfoItem>
            <PersonIcon />
            <Typography variant="body2">{event.organizer}</Typography>
          </InfoItem>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <InfoItem>
              {getTypeIcon()}
              <Typography variant="body2">{t(event.type.toLowerCase())}</Typography>
            </InfoItem>

            <InfoItem>
              <InfoIcon />
              <Typography variant="body2">{event.theme}</Typography>
            </InfoItem>

            <InfoItem>
              {getFormatIcon()}
              <Typography variant="body2">{t(event.format.toLowerCase())}</Typography>
            </InfoItem>
          </Box>
          
          {event.observersAllowed && (
            <Box sx={{ mt: 1 }}>
              {observersAllowedIcon}
            </Box>
          )}

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.5,
              maxHeight: '4.5em'
            }}
          >
            {event.description}
          </Typography>
        </CardContent>
      </StyledLink>

      {isEditable && (
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
          <Button
            size="small"
            onClick={handleEditClick}
            startIcon={<EditIcon />}
          >
            {t('edit')}
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
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
        </CardActions>
      )}
    </StyledCard>
  );
};

export default EventCard;
