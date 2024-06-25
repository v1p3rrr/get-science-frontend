import React, { useEffect, useState } from 'react';
import {fetchUserApplicationsAPI, deleteApplicationAPI, fetchFileAPI} from '../applications/applicationsAPI';
import { ApplicationResponse } from '../models/Models';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const MyApplications: React.FC = () => {
    const { t } = useTranslation();
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');

    useEffect(() => {
        const fetchApplications = async () => {
            setStatus('loading');
            try {
                const data = await fetchUserApplicationsAPI();
                setApplications(data);
                setStatus('succeeded');
            } catch (error) {
                setStatus('failed');
                console.error(error);
            }
        };

        fetchApplications();
    }, []);

    const handleDelete = async (applicationId: number) => {
        try {
            await deleteApplicationAPI(applicationId);
            setApplications(applications.filter(app => app.applicationId !== applicationId));
        } catch (error) {
            alert(t('failed_to_delete_application'));
        }
    };

    const handleFileDownload = async (applicationId: number, fileId: number, fileName: string, isEncrypted: boolean) => {
        try {
            const result = await fetchFileAPI(applicationId, fileId, fileName, isEncrypted);
            if (isEncrypted) {
                const { blob, downloadedFileName } = result;
                if (blob && downloadedFileName) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', downloadedFileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const { link } = result;
                window.open(link, '_blank');
            }
        } catch (error) {
            alert('Failed to download file');
        }
    };

    if (status === 'loading') {
        return <p>{t('loading')}...</p>;
    }

    if (status === 'failed') {
        return <p>{t('failed_to_load_applications')}</p>;
    }

    return (
        <div className="page-container">
            <div className="content-wrap">
                <h2>{t('my_applications')}</h2>
                <div className="application-list">
                    {applications.map(application => (
                        <div key={application.applicationId} className="application-card">
                            <div className="application-header">
                                <h3>{t('event')}: {application.eventName}</h3>
                                <span className="application-status">{application.status}</span>
                            </div>
                            <div className="application-info">
                                <p><strong>{t('submission_date')}:</strong> {new Date(application.submissionDate).toLocaleDateString()}</p>
                                <p><strong>{t('message')}:</strong> {application.message}</p>
                                {application.verdict && (
                                    <p><strong>{t('verdict')}:</strong> {application.verdict}</p>
                                )}
                                {application.fileApplications.length > 0 && (
                                    <div>
                                        <strong>{t('uploaded_files')}:</strong>
                                        <ul>
                                            {application.fileApplications.map(file => (
                                                <li key={file.fileId}>
                                                    <text
                                                        className="file-link"
                                                        onClick={() => handleFileDownload(application.applicationId, file.fileId, file.fileName, file.isEncryptionEnabled)}>
                                                        {file.fileName}
                                                    </text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="delete-button-container">
                                <button className="delete-button"
                                        onClick={() => handleDelete(application.applicationId)}>{t('delete')}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;
