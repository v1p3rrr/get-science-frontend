import axiosInstance from '../util/axiosInstance';
import { ProfileData } from '../models/Models';

export interface ProfileUpdateData {
    firstName: string;
    lastName: string;
    aboutMe: string | null;
}

export const getProfile = async (): Promise<ProfileData> => {
    try {
        const response = await axiosInstance.get('/auth/profile/me');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch profile');
    }
};

export const getProfileById = async (profileId: number): Promise<ProfileData> => {
    try {
        const response = await axiosInstance.get(`/auth/profile/${profileId}`);
        
        // Проверяем и трансформируем данные профиля, если необходимо
        const profileData = response.data;
        
        // Если в ответе нет avatarPresignedUrl, но есть avatarUrl, используем avatarUrl как presignedUrl
        if (!profileData.avatarPresignedUrl && profileData.avatarUrl) {
            profileData.avatarPresignedUrl = profileData.avatarUrl;
        }
        
        return profileData;
    } catch (error) {
        throw new Error('Failed to fetch profile');
    }
};

export const updateProfile = async (profileData: ProfileUpdateData): Promise<ProfileData> => {
    try {
        const response = await axiosInstance.put('/auth/profile', profileData);
        return response.data;
    } catch (error) {
        throw new Error('Failed to update profile');
    }
};

export const uploadAvatar = async (file: File): Promise<ProfileData> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axiosInstance.post('auth/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to upload avatar');
    }
}; 