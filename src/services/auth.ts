import jwtDecode from 'jwt-decode';
import { ProfileData } from '../models/Models';
import axiosInstance from '../util/axiosInstance';

interface JwtPayload {
    roles: string[];
    sub: string;
}

export const saveToken = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

export const getToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
};

export const getUserRoles = (): string[] => {
    const token = getToken();
    if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.roles;
    }
    return [];
};

export const getUsername = (): string | null => {
    const token = getToken();
    if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.sub;
    }
    return null;
};

export const saveUserProfileId = (profileId: number) => {
    localStorage.setItem('userProfileId', String(profileId));
};

export const getUserProfileId = (): number | null => {
    const profileId = localStorage.getItem('userProfileId');
    return profileId ? parseInt(profileId, 10) : null;
};

export const fetchAndStoreUserProfileId = async (): Promise<number | null> => {
    const token = getToken();
    if (!token) return null;

    let profileId = getUserProfileId();
    if (profileId) return profileId;

    try {
        const response = await axiosInstance.get<ProfileData>('/auth/profile/me');
        if (response.data && response.data.profileId) {
            saveUserProfileId(response.data.profileId);
            console.log("intercepted:", response.data.profileId);
            return response.data.profileId;
        }
    } catch (error) {
        console.error("Failed to fetch user profile ID:", error);
    }
    return null;
};