import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, selectEvent } from '../events/eventsSlice';
import { AppDispatch, RootState } from '../app/store';
import { Event } from '../models/Models';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';
import { fetchRecommendationsAPI } from '../events/eventsAPI';
import EventCard from './EventCard';
import { getUserRoles } from '../auth/auth';
import { toSentenceCase } from '../util/utils';

type Params = {
    eventId: string;
};

const EventDetails: React.FC = () => {
    const { eventId } = useParams<Params>();
    const navigate = useNavigate();
    const parsedEventId = eventId ? parseInt(eventId, 10) : 0;
    const dispatch: AppDispatch = useDispatch();
    const event = useSelector((state: RootState) => selectEvent(state, parsedEventId));
    const status = useSelector((state: RootState) => state.events.status);
    const { t } = useTranslation();
    const [recommendations, setRecommendations] = useState<Event[]>([]);
    const roles = getUserRoles();

    useEffect(() => {
        if (parsedEventId) {
            dispatch(fetchEventById(parsedEventId));
            fetchRecommendationsAPI(parsedEventId).then(setRecommendations);
        }
    }, [dispatch, parsedEventId]);

    const handleApply = () => {
        navigate(`/events/${parsedEventId}/apply`);
    };

    if (status === 'loading') {
        return <p>{t('loading')}...</p>;
    }

    if (!event) {
        return <p>{t('event_not_found')}</p>;
    }

    return (
        <div className="page-container">
            <div className="content-wrap">
                <div className="event-details">
                    <h2>{event.title}</h2>
                    <p><strong>{t('organizer')}:</strong> {event.organizerDescription}</p>
                    <p><strong>{t('type')}:</strong> {event.type}</p>
                    <p><strong>{t('location')}:</strong> {event.location}</p>
                    <p>
                        <strong>{t('dates')}:</strong> {new Date(event.dateStart).toLocaleDateString()} - {new Date(event.dateEnd).toLocaleDateString()}
                    </p>
                    <p><strong>{t('theme')}:</strong> {event.theme}</p>
                    <p><strong>{t('format')}:</strong> {toSentenceCase(event.format)}</p>
                    {event.results && (
                        <p><strong>{t('results')}:</strong> {event.results}</p>
                    )}
                    <h3>{t('documents')}</h3>
                    <ul>
                        {event.documentsRequired.map(doc => (
                            <li key={doc.docRequiredId}>{doc.type} ({doc.extension}): {doc.description}</li>
                        ))}
                    </ul>
                    <h3>{t('event_files')}</h3>
                    <ul>
                        {event.fileEvents.map(file => (
                            <li key={file.fileId}>
                                <a href={file.filePath} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
                            </li>
                        ))}
                    </ul>
                    <p>{event.description}</p>
                    {roles.includes('USER') && (
                        <button onClick={handleApply} className="apply-button">{t('do_apply')}</button>
                    )}
                </div>

                {recommendations.length > 0 && (
                    <div className="recommendations">
                        <h3>{t('recommended_events')}</h3>
                        <div className="recommendations-list">
                            {recommendations.map((recEvent) => (
                                <EventCard key={recEvent.eventId} event={recEvent} isEditable={false} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetails;
