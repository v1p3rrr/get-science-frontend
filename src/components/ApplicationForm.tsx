import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, selectEvent } from '../events/eventsSlice';
import { AppDispatch, RootState } from '../app/store';
import { ApplicationRequest } from '../models/Models';
import { submitApplicationAPI } from '../applications/applicationsAPI';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

type Params = {
    eventId: string;
};

const ApplicationForm: React.FC = () => {
    const { eventId } = useParams<Params>();
    const parsedEventId = eventId ? parseInt(eventId, 10) : 0;
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const event = useSelector((state: RootState) => selectEvent(state, parsedEventId));
    const status = useSelector((state: RootState) => state.events.status);
    const [message, setMessage] = useState('');
    const [isObserver, setIsObserver] = useState(false);
    const [files, setFiles] = useState<{ [key: number]: File | null }>({});
    const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);

    useEffect(() => {
        if (parsedEventId) {
            dispatch(fetchEventById(parsedEventId));
        }
    }, [dispatch, parsedEventId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, docRequiredId: number) => {
        const file = event.target.files?.[0] || null;
        setFiles(prevFiles => ({
            ...prevFiles,
            [docRequiredId]: file,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const applicationRequest: ApplicationRequest = {
            eventId: parsedEventId,
            profileId: null, // This will be set on the server based on the authenticated user
            status: 'PENDING',
            submissionDate: new Date().toISOString(),
            message,
            verdict: null, // Empty when submitting
            isObserver,
            fileApplications: [] // This will be handled on the server
        };

        const selectedFiles = Object.values(files).filter(file => file !== null) as File[];

        try {
            await submitApplicationAPI(applicationRequest, selectedFiles, isEncryptionEnabled);
            alert(t('application_submitted'));
            navigate('/events');
        } catch (error) {
            alert(t('application_submission_failed'));
        }
    };

    if (status === 'loading') {
        return <p>{t('loading')}...</p>;
    }

    if (!event) {
        return <p>{t('event_not_found')}</p>;
    }

    return (
        <div className="form-container">
            <h1>{t('event_management_system')}</h1>
            <form onSubmit={handleSubmit} className="application-form">
                <div>
                    <label>{t('message')}:</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="message-textarea"
                    />
                </div>
                <div className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={isObserver}
                        onChange={(e) => setIsObserver(e.target.checked)}
                    />
                    <label>{t('apply_as_observer')}</label>
                </div>
                {event.documentsRequired.map(doc => (
                    <div key={doc.docRequiredId} className="file-input-container">
                        <label>{doc.type} ({doc.extension}): {doc.description}</label>
                        <input
                            type="file"
                            onChange={(e) => handleFileChange(e, doc.docRequiredId)}
                        />
                    </div>
                ))}
                <div className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={isEncryptionEnabled}
                        onChange={(e) => setIsEncryptionEnabled(e.target.checked)}
                        aria-label={t('enable_encryption')}
                    />
                    <label>{t('enable_encryption')}</label>
                </div>
                <button type="submit" className="submit-button">{t('submit_application')}</button>
            </form>
        </div>
    );
};

export default ApplicationForm;
