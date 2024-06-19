import axios from 'axios';
import { getToken } from './auth/auth';
import {useNavigate} from "react-router-dom";

const API_URL = 'http://localhost:8080/api/v1';

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
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 403) {
            const navigate = useNavigate();
            navigate('/login');
        }
        if (error.response) {
            const { status, data } = error.response;
            let errorMessage = 'An error occurred';
            if (status >= 400 && status < 500) {
                errorMessage = data.message || 'Client error occurred';
            } else if (status >= 500) {
                errorMessage = 'Server error occurred';
            }
            alert(errorMessage);
        } else if (error.request) {
            alert('No response received from server');
        } else {
            alert(`Error in request: ${error.message}`);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
