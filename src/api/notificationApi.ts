import axiosInstance from '../util/axiosInstance';
import { Notification } from '../models/Models';

export const notificationApi = {
  getNotifications: async (page = 0, size = 10): Promise<{ content: Notification[], hasNext: boolean }> => {
    const response = await axiosInstance.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  getNotificationsByEntity: async (entityType: string, entityId: number): Promise<Notification[]> => {
    const response = await axiosInstance.get<Notification[]>(`/notifications/entity/${entityType}/${entityId}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await axiosInstance.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.put('/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/notifications/${id}`);
  },

  deleteAllNotifications: async (): Promise<void> => {
    await axiosInstance.delete('/notifications');
  },

  // Получить количество непрочитанных уведомлений
  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get('/notifications/unread/count');
    return typeof response.data === 'number' ? response.data : 0;
  },
};