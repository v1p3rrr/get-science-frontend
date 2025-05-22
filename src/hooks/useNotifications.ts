import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { getUserRoles } from '../services/auth';
import { EntityType } from '../models/Models';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const roles = getUserRoles();

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Ошибка при получении количества непрочитанных уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании и при изменении состояния аутентификации
  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  // Периодическое обновление (каждые 30 секунд)
  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<number>;
      setUnreadCount(custom.detail);
    };
    window.addEventListener('unreadCountUpdated', handler);
    return () => window.removeEventListener('unreadCountUpdated', handler);
  }, [isAuthenticated]);

  const handleNotificationClick = async (notificationId: number, entityType?: EntityType, entityId?: number) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      
      fetchUnreadCount();
      
      if (entityType && entityId) {
        navigateToEntity(entityType, entityId);
      }
    } catch (error) {
      console.error('Ошибка при обработке уведомления:', error);
    }
  };

  const navigateToEntity = (entityType: EntityType, entityId: number) => {
    if (entityType === 'APPLICATION') {
      if (roles.includes('ORGANIZER')) {
        navigate(`/organizer-applications?applicationId=${entityId}`);
      } else {
        navigate(`/my-applications?applicationId=${entityId}`);
      }
    } else if (entityType === 'EVENT') {
      navigate(`/events/${entityId}`);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!isAuthenticated) return;
    try {
      await notificationService.deleteNotification(id);
      fetchUnreadCount();
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      await notificationService.deleteAllNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Ошибка при удалении всех уведомлений:', error);
    }
  };

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
    handleNotificationClick,
    deleteNotification,
    deleteAllNotifications
  };
}; 