import axiosInstance from '../util/axiosInstance';
import {ApplicationRequest, ApplicationResponse} from '../models/Models';

const FILE_API_URL = 'http://localhost:8080/api/v1/files';

// Интерфейс для метаданных файла
interface ApplicationFileMetadataDTO {
    type: string;
    isEncrypted: boolean;
}

export const submitApplicationAPI = async (applicationRequest: ApplicationRequest, files: File[], fileMetadataList: ApplicationFileMetadataDTO[]) => {
    // Проверяем, что количество файлов соответствует количеству метаданных
    if (files.length !== fileMetadataList.length) {
        throw new Error('Files count must match metadata count');
    }

    const formData = new FormData();
    
    // Добавляем объект applicationRequest как JSON
    formData.append('applicationRequest', new Blob([JSON.stringify(applicationRequest)], { type: 'application/json' }));
    
    // Добавляем список метаданных как JSON
    formData.append('fileApplicationFileMetadataDTO', new Blob([JSON.stringify(fileMetadataList)], { type: 'application/json' }));
    
    // Добавляем файлы в том же порядке, что и метаданные
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await axiosInstance.post('/applications/submit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to submit application');
    }
};

export const updateUserApplicationAPI = async (applicationId: number, applicationRequest: ApplicationRequest, files: File[], fileMetadataList: ApplicationFileMetadataDTO[]) => {
    // Проверяем, что количество файлов соответствует количеству метаданных
    if (files.length !== fileMetadataList.length) {
        throw new Error('Files count must match metadata count');
    }

    const formData = new FormData();
    
    // Добавляем объект applicationRequest как JSON
    formData.append('applicationRequest', new Blob([JSON.stringify(applicationRequest)], { type: 'application/json' }));
    
    // Добавляем список метаданных как JSON
    formData.append('fileApplicationFileMetadataDTO', new Blob([JSON.stringify(fileMetadataList)], { type: 'application/json' }));
    
    // Добавляем файлы в том же порядке, что и метаданные
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await axiosInstance.put(`/applications/${applicationId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to update application');
    }
};

export const fetchUserApplicationsAPI = async () => {
    try {
        const response = await axiosInstance.get('/applications/applicant');
        // Гарантируем, что всегда возвращается массив
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch applications:', error);
        throw new Error('Failed to fetch applications');
    }
};

export const fetchApplicationByIdAPI = async (applicationId: number) => {
    try {
        const response = await axiosInstance.get(`/applications/${applicationId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch application');
    }
};

export const deleteApplicationAPI = async (applicationId: number) => {
    try {
        const response = await axiosInstance.delete(`/applications/${applicationId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete application');
    }
};

export const fetchApplicationsByOrganizerAPI = async () => {
    try {
        const response = await axiosInstance.get('/applications/organizer');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch applications');
    }
};

export const updateApplicationAPI = async (applicationId: number, applicationRequest: ApplicationResponse) => {
    try {
        const response = await axiosInstance.put(`/applications/${applicationId}/update-organizer`, applicationRequest);
        return response.data;
    } catch (error) {
        throw new Error('Failed to update application');
    }
};

export const fetchFileAPI = async (applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
    const endpoint = isEncrypted
        ? `${FILE_API_URL}/applications/download/${fileId}`
        : `${FILE_API_URL}/applications/download/${fileId}/direct-link`;

    try {
        const response = await axiosInstance.get(endpoint, {
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
            return { link: response.data };
        }
    } catch (error) {
        throw new Error('Failed to download file');
    }
};

export const fetchApplicationWithApplicantAPI = async (applicationId: number) => {
    try {
        const response = await axiosInstance.get(`/applications/${applicationId}/with-applicant`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch application with applicant details');
    }
};

export const fetchApplicationWithOrganizerAPI = async (applicationId: number) => {
    try {
        const response = await axiosInstance.get(`/applications/${applicationId}/with-organizer`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch application with organizer details');
    }
};

export const deleteFileAPI = async (fileId: number) => {
    try {
        const response = await axiosInstance.delete(`${FILE_API_URL}/applications/${fileId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete file');
    }
};

export const deleteFilesByDocRequiredAPI = async (applicationId: number, docRequiredId: number) => {
    try {
        const response = await axiosInstance.delete(`${FILE_API_URL}/applications/${applicationId}/doc-required/${docRequiredId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete files');
    }
};