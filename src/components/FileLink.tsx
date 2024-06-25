import React from 'react';
import { fetchFileAPI } from '../applications/applicationsAPI';

interface FileLinkProps {
    applicationId: number;
    fileId: number;
    fileName: string;
    isEncrypted: boolean;
}

const FileLink: React.FC<FileLinkProps> = ({ applicationId, fileId, fileName, isEncrypted }) => {
    const handleDownload = async () => {
        try {
            await fetchFileAPI(applicationId, fileId, fileName, isEncrypted);
        } catch (error) {
            alert('Failed to download file');
        }
    };

    return (
        <span className="file-link" onClick={handleDownload}>
            {fileName}
        </span>
    );
};

export default FileLink;