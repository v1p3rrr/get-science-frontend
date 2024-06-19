import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const FileUpload: React.FC<{ eventId: number }> = ({ eventId }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { t } = useTranslation();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post(`http://localhost:8080/api/v1/events/${eventId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(t('file_uploaded_successfully'));
        } catch (error) {
            alert(t('file_upload_failed'));
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>{t('upload_file')}</button>
        </div>
    );
};

export default FileUpload;
