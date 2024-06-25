import axios from 'axios';
import {ApplicationRequest, ApplicationResponse} from '../models/Models';
import { getToken } from '../auth/auth';
import { saveAs } from 'file-saver';

const API_URL = 'http://localhost:8080/api/v1/applications';
const FILE_API_URL = 'http://localhost:8080/api/v1/file-applications';

export const submitApplicationAPI = async (applicationRequest: ApplicationRequest, files: File[], isEncryptionEnabled: boolean) => {
    const formData = new FormData();
    formData.append('applicationRequest', new Blob([JSON.stringify(applicationRequest)], { type: 'application/json' }));
    formData.append('isEncryptionEnabled', String(isEncryptionEnabled));

    files.forEach(file => {
        formData.append('files', file);
    });

    const token = getToken();

    try {
        const response = await axios.post(`${API_URL}/submit`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to submit application');
    }
};

export const fetchUserApplicationsAPI = async () => {
    const token = getToken();

    try {
        const response = await axios.get(`${API_URL}/applicant`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch applications');
    }
};

export const deleteApplicationAPI = async (applicationId: number) => {
    const token = getToken();

    try {
        const response = await axios.delete(`${API_URL}/${applicationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete application');
    }
};

export const fetchApplicationsByOrganizerAPI = async () => {
    const token = getToken();

    try {
        const response = await axios.get(`${API_URL}/organizer`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch applications');
    }
};

export const updateApplicationAPI = async (applicationId: number, applicationRequest: ApplicationResponse) => {
    const token = getToken();

    try {
        const response = await axios.post(`${API_URL}/${applicationId}/update-organizer`, applicationRequest, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to update application');
    }
};

export const fetchFileAPI = async (applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
    const token = getToken();
    const endpoint = isEncrypted
        ? `${FILE_API_URL}/${applicationId}/files/${fileId}`
        : `${FILE_API_URL}/${applicationId}/files/${fileId}/direct-link`;

    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            responseType: isEncrypted ? 'blob' : 'text'
        });

        if (isEncrypted) {
            const contentDisposition = response.headers['content-disposition'];
            let downloadedFileName = fileName;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) {
                    downloadedFileName = match[1];
                }
            }

            return {
                blob: response.data,
                downloadedFileName
            };
        } else {
            return { link: response.data }; // return the direct link
        }
        // saveAs(response.data, fileName);
    } catch (error) {
        throw new Error('Failed to download file');
    }
};