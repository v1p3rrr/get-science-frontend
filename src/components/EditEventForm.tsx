import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, selectEvent } from '../events/eventsSlice';
import { AppDispatch, RootState } from '../app/store';
import { EventRequest, DocRequiredRequest } from '../models/Models';
import { updateEventAPI } from '../events/eventsAPI';
import '../styles/style.css';
import {useTranslation} from "react-i18next";

type Params = {
    eventId: string;
};

const EditEventForm: React.FC = () => {
    const { eventId } = useParams<Params>();
    const parsedEventId = eventId ? parseInt(eventId, 10) : 0;
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const event = useSelector((state: RootState) => selectEvent(state, parsedEventId));
    const {t} = useTranslation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [organizerDescription, setOrganizerDescription] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('');
    const [theme, setTheme] = useState('');
    const [format, setFormat] = useState('');
    const [results, setResults] = useState('');
    const [observersAllowed, setObserversAllowed] = useState(false);
    const [documentsRequired, setDocumentsRequired] = useState<DocRequiredRequest[]>([]);

    useEffect(() => {
        if (parsedEventId) {
            dispatch(fetchEventById(parsedEventId));
        }
    }, [dispatch, parsedEventId]);

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setDescription(event.description);
            setOrganizerDescription(event.organizerDescription || '');
            setDateStart(event.dateStart);
            setDateEnd(event.dateEnd);
            setLocation(event.location);
            setType(event.type);
            setTheme(event.theme || '');
            setFormat(event.format || '');
            setResults(event.results || '');
            setObserversAllowed(event.observersAllowed || false);
            setDocumentsRequired(event.documentsRequired.map(doc => ({
                type: doc.type,
                extension: doc.extension,
                description: doc.description,
                mandatory: doc.mandatory
            })));
        }
    }, [event]);

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
            results,
            observersAllowed,
            documentsRequired,
            fileEvents: []
        };
        await updateEventAPI(parsedEventId, eventRequest);
        navigate('/my-events');
    };

    if (!event) {
        return <p>Loading...</p>;
    }

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="event-form">
                <div>
                    <label>{t('title')}:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}/>
                </div>
                <div>
                    <label>{t('description')}:</label>
                    <textarea className="description-textarea" value={description}
                              onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>
                <div>
                    <label>{t('organizer_description')}:</label>
                    <textarea className="description-textarea" value={organizerDescription}
                              onChange={(e) => setOrganizerDescription(e.target.value)}></textarea>
                </div>
                <div>
                    <label>{t('start_date')}:</label>
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}/>
                </div>
                <div>
                    <label>{t('end_date')}:</label>
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}/>
                </div>
                <div>
                    <label>{t('location')}:</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}/>
                </div>
                <div>
                    <label>{t('type')}:</label>
                    <input type="text" value={type} onChange={(e) => setType(e.target.value)}/>
                </div>
                <div>
                    <label>{t('theme')}:</label>
                    <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)}/>
                </div>
                <div>
                    <label>{t('format')}:</label>
                    <input type="text" value={format} onChange={(e) => setFormat(e.target.value)}/>
                </div>
                <div>
                    <label>{t('results')}:</label>
                    <input type="text" value={results} onChange={(e) => setResults(e.target.value)}/>
                </div>
                <div className="checkbox-container">
                    <input type="checkbox" checked={observersAllowed}
                           onChange={(e) => setObserversAllowed(e.target.checked)}/>
                    <label>Allow Observers</label>
                </div>
                <div>
                    <h3>Documents Required</h3>
                    {documentsRequired.map((doc, index) => (
                        <div className="document-input" key={index}>
                            <input
                                type="text"
                                placeholder="Type"
                                value={doc.type}
                                onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                                className="doc-input"
                            />
                            <input
                                type="text"
                                placeholder="Extension"
                                value={doc.extension}
                                onChange={(e) => handleDocumentChange(index, 'extension', e.target.value)}
                                className="doc-input"
                            />
                            <input
                                type="text"
                                placeholder="Description"
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
                                Mandatory
                            </label>
                            <button type="button" onClick={() => handleRemoveDocument(index)}
                                    className="remove-button">Remove
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddDocument}>Add Document</button>
                </div>
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default EditEventForm;
