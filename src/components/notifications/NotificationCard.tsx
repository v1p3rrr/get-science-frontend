import React from 'react';
import {Card, CardContent, Typography, Box, IconButton, Chip, Tooltip} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Event as EventIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Notification } from '../../models/Models';
import { useNavigate } from 'react-router-dom';
import {useTranslation} from "react-i18next";

interface NotificationCardProps {
  notification: Notification;
  onDelete: (id: number) => Promise<void>;
  onMarkAsRead: (id: number) => Promise<void>;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onDelete, onMarkAsRead }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (notification.type) {
      case 'INFO':
        return <InfoIcon color="info" />;
      case 'SUCCESS':
        return <CheckCircleIcon color="success" />;
      case 'WARNING':
        return <WarningIcon color="warning" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  const getEntityIcon = () => {
    if (notification.entityType === 'EVENT') {
      return <EventIcon />;
    }
    return <DescriptionIcon />;
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
    if (notification.entityType && notification.entityId) {
      navigate(`/${notification.entityType.toLowerCase()}s/${notification.entityId}`);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: notification.entityType ? 'pointer' : 'default',
        opacity: notification.isRead ? 0.7 : 1
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            {getStatusIcon()}
            <Chip
              icon={getEntityIcon()}
              label={notification.entityType === 'EVENT' ? 'Мероприятие' : 'Заявка'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
          <Tooltip title={t('delete')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <CloseIcon />
          </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="h6" sx={{ mt: 1 }}>
          {notification.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {format(new Date(notification.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
        </Typography>
      </CardContent>
    </Card>
  );
}; 