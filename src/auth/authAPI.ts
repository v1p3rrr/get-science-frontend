import axiosInstance from '../axiosInstance';
import { RegisterRequest } from '../models/Models';

const API_URL = 'http://localhost:8080/api/v1/auth';

export const registerUser = async (registerData: RegisterRequest) => {
    await axiosInstance.post(`${API_URL}/register`, registerData);
};

export const loginUser = async (loginData: { email: string; password: string }) => {
    const response = await axiosInstance.post(`${API_URL}/login`, loginData);
    return response.data;
};