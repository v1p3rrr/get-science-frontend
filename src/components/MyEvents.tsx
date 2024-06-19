import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEvents, selectEvents } from '../events/eventsSlice';
import EventCard from './EventCard';
import { Event } from '../models/Models';
import { AppDispatch, RootState } from '../app/store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const MyEvents: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const events = useSelector(selectEvents);
    const status = useSelector((state: RootState) => state.events.status);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(fetchMyEvents());
    }, [dispatch]);

    useEffect(() => {
        setFilteredEvents(events);
    }, [events]);

    const handleCreateEvent = () => {
        navigate('/create-event');
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
                <button className="create-event-btn" onClick={handleCreateEvent}>{t('create_event')}</button>
                {status === 'loading' && <p>{t('loading')}...</p>}
                {status === 'failed' && <p>{t('failed_to_load_events')}</p>}
                <div className="event-list">
                    {filteredEvents.map(event => (
                        <EventCard key={event.eventId} event={event} isEditable={true} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyEvents;
