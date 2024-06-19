import React, {useCallback, useEffect, useState} from 'react';
import {fetchApplicationsByOrganizerAPI, fetchFileAPI, updateApplicationAPI} from '../applications/applicationsAPI';
import { ApplicationResponse } from '../models/Models';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';
import { debounce } from '../util/debounce';

const OrganizerApplications: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchApplicationsByOrganizerAPI();
                setApplications(data);
            } catch (error) {
                alert(t('failed_to_fetch_applications'));
            }
        };

        fetchData();
    }, [t]);

    const debouncedUpdateApplication = useCallback(debounce(async (applicationId: number, application: ApplicationResponse) => {
        try {
            await updateApplicationAPI(applicationId, application);
        } catch (error) {
            alert(t('failed_to_update_application'));
        }
    }, 400), []);

    const handleApplicationUpdate = (applicationId: number, field: string, value: string) => {
        const updatedApplications = applications.map(application =>
            application.applicationId === applicationId ? { ...application, [field]: value } : application
        );
        setApplications(updatedApplications);

        const application = updatedApplications.find(app => app.applicationId === applicationId);
        if (application) {
            debouncedUpdateApplication(applicationId, application);
        }
    };

    const handleFileDownload = async (applicationId: number, fileId: number, isEncrypted: boolean) => {
        try {
            await fetchFileAPI(applicationId, fileId, isEncrypted);
        } catch (error) {
            alert(t('failed_to_download_file'));
        }
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
                <h2>{t('my_applications')}</h2>
                <div className="application-list">
                    {applications.map(application => (
                        <div key={application.applicationId} className="application-card">
                            <div className="application-header">
                                <strong>{t('event')}: {application.eventId}</strong>
                                <span>{application.status}</span>
                            </div>
                            <p><strong>{t('submission_date')}: </strong>{new Date(application.submissionDate).toLocaleDateString()}</p>
                            <p><strong>{t('message')}: </strong>{application.message}</p>
                            <p><strong>{t('verdict')}: </strong>
                                <input
                                    type="text"
                                    value={application.verdict || ''}
                                    onChange={(e) => handleApplicationUpdate(application.applicationId, 'verdict', e.target.value)}
                                />
                            </p>
                            <p><strong>{t('status')}: </strong>
                                <select
                                    value={application.status}
                                    onChange={(e) => handleApplicationUpdate(application.applicationId, 'status', e.target.value)}
                                >
                                    <option value="PENDING">{t('pending')}</option>
                                    <option value="APPROVED">{t('approved')}</option>
                                    <option value="REJECTED">{t('rejected')}</option>
                                </select>
                            </p>
                            <div>
                                <strong>{t('files')}:</strong>
                                <ul>
                                    {application.fileApplications.map(file => (
                                        <li key={file.fileId}>
                                            <text
                                                className="file-link"
                                                onClick={() => handleFileDownload(application.applicationId, file.fileId, file.isEncryptionEnabled)}>
                                                {file.fileName}
                                            </text>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrganizerApplications;