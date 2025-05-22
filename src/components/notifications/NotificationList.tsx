import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../models/Models';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Badge,
  CircularProgress,
  Paper, 
  Tooltip,
  Backdrop
} from '@mui/material';
import {
  Notifications as BellIcon,
  Check as CheckIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { handleNotificationClick } = useNotifications();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageToLoad = 0) => {
    try {
      setLoading(true);
      const { content, hasNext } = await notificationService.getNotifications(pageToLoad, 10);
      if (pageToLoad === 0) {
        setNotifications(content || []);
      } else {
        setNotifications(prev => [...prev, ...(content || [])]);
      }
      setHasMore(hasNext);
    } catch (error) {
      console.error(t('notification_error'), error);
      setNotifications([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);
    setPage(0);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      console.error(t('notification_mark_read_error'), error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error(t('notification_delete_error'), error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications(0);
      setPage(0);
    } catch (error) {
      console.error(t('notification_mark_all_read_error'), error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      fetchNotifications(0);
      setPage(0);
    } catch (error) {
      console.error(t('notification_delete_all_error'), error);
    }
  };

  const handleNotificationItemClick = (notification: Notification) => {
    handleNotificationClick(notification.id, notification.entityType, notification.entityId);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchNotifications(nextPage);
    setPage(nextPage);
  };

  if (!notifications) {
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
          <Typography variant="h6" color="white">{t('loading_notifications')}</Typography>
        </Backdrop>
      </Box>
    );
  }

  if (loading && notifications.length === 0) {
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
          <Typography variant="h6" color="white">{t('loading_notifications')}</Typography>
        </Backdrop>
      </Box>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        p={3}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('no_notifications')}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {t('no_notifications_description')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box position="relative">
      <Box mb={3} display="flex" gap={2} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
        <Button
          startIcon={<CheckIcon />}
          onClick={handleMarkAllAsRead}
          disabled={!notifications || notifications.every(n => n.isRead)}
          variant="contained"
          color="primary"
          size="small"
          sx={{ minWidth: 160, ml: '20%', height: 44 }}
        >
          {t('mark_all_as_read')}
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDeleteAll}
          disabled={!notifications || notifications.length === 0}
          variant="outlined"
          color="secondary"
          size="small"
          sx={{ minWidth: 160, mr: '20%', height: 44 }}
        >
          {t('delete_all_notifications')}
        </Button>
      </Box>
      
      {loading && notifications.length > 0 && (
        <Backdrop
          sx={{ 
            position: 'absolute',
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          open={true}
        >
          <CircularProgress color="primary" size={60} />
        </Backdrop>
      )}
      
      <List sx={{ width: '100%', maxWidth: 700, mx: 'auto' }}>
        {notifications.map(notification => (
          <Paper 
            key={notification.id} 
            elevation={1} 
            sx={{ 
              mb: 2,
              cursor: 'pointer',
              opacity: notification.isRead ? 0.7 : 1,
              '&:hover': {
                opacity: 1
              },
              maxWidth: 700,
              mx: 'auto',
              px: 3,
              py: 2
            }}
            onClick={() => handleNotificationItemClick(notification)}
          >
            <ListItem
              secondaryAction={
                <Box>
                  {!notification.isRead && (
                      <Tooltip title={t('mark_as_read')}>
                        <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                        >
                          <CheckIcon/>
                        </IconButton>
                      </Tooltip>
                  )}
                  <Tooltip title={t('delete')}>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemAvatar>
                <Badge
                  color="primary"
                  variant="dot"
                  invisible={notification.isRead}
                >
                  <Avatar>
                    <BellIcon />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" component="span">
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                }
                secondary={notification.message}
              />
            </ListItem>
          </Paper>
        ))}
      </List>
      {hasMore && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="text"
            onClick={handleLoadMore}
            sx={{
              color: 'text.secondary',
              backgroundColor: 'transparent',
              border: 'none',
              transition: 'background 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.08)',
              },
            }}
          >
            {t('load_more')}
          </Button>
        </Box>
      )}
    </Box>
  );
}; 