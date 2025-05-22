import { notificationApi } from '../api/notificationApi';
import { Notification } from '../models/Models';

export const notificationService = {
  getNotifications: async (page = 0, size = 10): Promise<{ content: Notification[], hasNext: boolean }> => {
    try {
      return await notificationApi.getNotifications(page, size);
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      return { content: [], hasNext: false };
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений как прочитанных:', error);
    }
  },

  deleteNotification: async (id: number): Promise<void> => {
    try {
      await notificationApi.deleteNotification(id);
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
    }
  },

  deleteAllNotifications: async (): Promise<void> => {
    try {
      await notificationApi.deleteAllNotifications();
    } catch (error) {
      console.error('Ошибка при удалении всех уведомлений:', error);
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      return await notificationApi.getUnreadCount();
    } catch (error) {
      console.error('Ошибка при получении количества непрочитанных уведомлений:', error);
      return 0;
    }
  },
};