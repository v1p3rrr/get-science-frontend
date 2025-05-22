import axiosInstance from '../util/axiosInstance';
import { RegisterRequest, ProfileUpdateData, ProfileData } from '../models/Models';
import i18n from '../i18n';

const API_URL = '/auth';

export const registerUser = async (registerData: RegisterRequest) => {
    // Получаем текущую локаль
    const currentLocale = i18n.language;
    
    const response = await axiosInstance.post(`${API_URL}/register`, registerData, {
        headers: {
            'Accept-Language': currentLocale
        }
    });
    return response.data;
};

export const loginUser = async (loginData: { email: string; password: string }) => {
    const response = await axiosInstance.post(`${API_URL}/login`, loginData);
    return response.data;
};

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword,
    });
}

export const logoutAllSessions = async (): Promise<void> => {
    await axiosInstance.delete('/auth/logout/all');
};

// Подтверждение email
export const verifyEmail = async (token: string) => {
    const response = await axiosInstance.post(`${API_URL}/verify-email?token=${token}`);
    return response.data;
};

// Запрос на сброс пароля
export const requestPasswordReset = async (email: string) => {
    // Получаем текущую локаль
    const currentLocale = i18n.language;
    
    const response = await axiosInstance.post(`${API_URL}/request-password-reset?email=${email}`, null, {
        headers: {
            'Accept-Language': currentLocale
        }
    });
    return response.data;
};

// Сброс пароля
export const resetPassword = async (token: string, newPassword: string) => {
    const response = await axiosInstance.post(`${API_URL}/reset-password?token=${token}&newPassword=${newPassword}`);
    return response.data;
};