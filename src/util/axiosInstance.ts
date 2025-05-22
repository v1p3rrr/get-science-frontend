import axios from 'axios';
import {getRefreshToken, getToken, saveToken} from '../services/auth';
import { notificationService } from '../services/notificationService';
import { webSocketService } from '../services/webSocketService';
import { chatStateService } from '../services/chatStateService';

const API_URL = '/api/v1';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    async (response) => {
        const url = response.config.url || '';
        const token = getToken();
        if (token && !url.includes('/notifications/unread/count') && !url.includes('/chats/unread-count')) {
            try {
                const count = await notificationService.getUnreadCount();
                window.dispatchEvent(new CustomEvent<number>('unreadCountUpdated', { detail: count }));
            } catch (e) {
                console.error('Ошибка при обновлении счётчика уведомлений:', e);
            }
        }
        if (token && !url.includes('/notifications/unread/count') && !url.includes('/chats/unread-count')) {
            try {
                chatStateService.getUnreadChatsCount();
            } catch (e) {
                console.error('Ошибка при обновлении счётчика непрочитанных чатов:', e);
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url || '';

        const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
        const isNotRetry = !originalRequest._retry;

        if (isAuthError && isNotRetry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh-token`, refreshToken, {
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    });

                    const { accessToken, refreshToken: newRefresh } = response.data;
                    saveToken(accessToken, newRefresh);

                    webSocketService.handleTokenRefreshed();

                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    console.warn('Не удалось обновить токен:', refreshError);
                    localStorage.clear();
                    const locale = navigator.language || 'en';
                    window.location.href = `/login?sessionExpired=true&lang=${locale}`;
                    return Promise.reject(refreshError);
                }
            } else {
                if (error.config?.url?.includes('/auth/login')) {
                    // просто пробрасываем ошибку, не перехватываем
                    return Promise.reject(error);
                }

                localStorage.clear();
                const locale = navigator.language || 'en';
                window.location.href = `/login?sessionExpired=true&lang=${locale}`;
                return Promise.reject(error);
            }
        }

        if (error.response) {
            // const { status, data, config } = error.response;
            // let errorMessage = 'An error occurred';

            // const isLogin = config.url?.includes('/login');
            //
            // if (status === 401 && isLogin) {
            //     return Promise.reject(error);
            // }

            // if (status >= 400 && status < 500) {
            //     errorMessage = data.message || 'Client error occurred';
            // } else if (status >= 500) {
            //     errorMessage = 'Server error occurred';
            // }
            // Не показываем alert для unread/count
            // if (!url.includes('/notifications/unread/count')) {
            //     alert(errorMessage);
            // }
        } else if (error.request) {
            if (!url.includes('/notifications/unread/count')) {
            alert('No response received from server');
            }
        } else {
            if (!url.includes('/notifications/unread/count')) {
            alert(`Error in request: ${error.message}`);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
