import React, { useState } from 'react';
import { EventRequest, DocRequiredRequest } from '../models/Models';
import { createEventAPI } from '../events/eventsAPI';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const EventForm: React.FC<{ onSave: (event: EventRequest) => void }> = ({ onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [organizerDescription, setOrganizerDescription] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('');
    const [theme, setTheme] = useState('');
    const [format, setFormat] = useState('');
    const [observersAllowed, setObserversAllowed] = useState(false);
    const [documentsRequired, setDocumentsRequired] = useState<DocRequiredRequest[]>([]);

    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleAddDocument = () => {
        setDocumentsRequired([...documentsRequired, { type: '', extension: '', description: '', mandatory: false }]);
    };

    const handleDocumentChange = (index: number, field: string, value: string | boolean) => {
        const updatedDocs = [...documentsRequired];
        if (typeof value === 'boolean') {
            (updatedDocs[index] as any)[field] = value;
        } else {
            (updatedDocs[index] as any)[field] = value;
        }
        setDocumentsRequired(updatedDocs);
    };

    const handleRemoveDocument = (index: number) => {
        const updatedDocs = [...documentsRequired];
        updatedDocs.splice(index, 1);
        setDocumentsRequired(updatedDocs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const eventRequest: EventRequest = {
            title,
            description,
            organizerDescription,
            dateStart,
            dateEnd,
            location,
            type,
            theme,
            format,
            observersAllowed,
            documentsRequired,
            fileEvents: []
        };
        try {
            await createEventAPI(eventRequest);
            onSave(eventRequest);
            navigate('/my-events');
        } catch (error) {
            alert(t('error_creating_event'));
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="event-form">
                <div>
                    <label>{t('title')}:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                    <label>{t('description')}:</label>
                    <textarea className="description-textarea" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>
                <div>
                    <label>{t('organizer_description')}:</label>
                    <textarea className="description-textarea" value={organizerDescription} onChange={(e) => setOrganizerDescription(e.target.value)}></textarea>
                </div>
                <div>
                    <label>{t('start_date')}:</label>
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                </div>
                <div>
                    <label>{t('end_date')}:</label>
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                </div>
                <div>
                    <label>{t('location')}:</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                    <label>{t('type')}:</label>
                    <input type="text" value={type} onChange={(e) => setType(e.target.value)} />
                </div>
                <div>
                    <label>{t('theme')}:</label>
                    <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} />
                </div>
                <div>
                    <label>{t('format')}:</label>
                    <input type="text" value={format} onChange={(e) => setFormat(e.target.value)} />
                </div>
                <div className="checkbox-container">
                    <input type="checkbox" checked={observersAllowed} onChange={(e) => setObserversAllowed(e.target.checked)} />
                    <label>{t('allow_observers')}</label>
                </div>
                <div>
                    <h3>{t('documents_required')}</h3>
                    {documentsRequired.map((doc, index) => (
                        <div className="document-input" key={index}>
                            <input
                                type="text"
                                placeholder={t('type')}
                                value={doc.type}
                                onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                                className="doc-input"
                            />
                            <input
                                type="text"
                                placeholder={t('extension')}
                                value={doc.extension}
                                onChange={(e) => handleDocumentChange(index, 'extension', e.target.value)}
                                className="doc-input"
                            />
                            <input
                                type="text"
                                placeholder={t('description')}
                                value={doc.description}
                                onChange={(e) => handleDocumentChange(index, 'description', e.target.value)}
                                className="doc-input"
                            />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={doc.mandatory}
                                    onChange={(e) => handleDocumentChange(index, 'mandatory', e.target.checked)}
                                />
                                {t('mandatory')}
                            </label>
                            <button type="button" onClick={() => handleRemoveDocument(index)}
                                    className="remove-button">{t('remove')}
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddDocument}>{t('add_document')}</button>
                </div>
                <button type="submit">{t('save')}</button>
            </form>
        </div>
    );
};

export default EventForm;
