import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, selectEvents } from '../events/eventsSlice';
import EventCard from './EventCard';
import FilterBar from './FilterBar';
import { Event } from '../models/Models';
import { AppDispatch, RootState } from '../app/store';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const EventList: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const events = useSelector(selectEvents);
    const status = useSelector((state: RootState) => state.events.status);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(fetchEvents());
    }, [dispatch]);

    useEffect(() => {
        setFilteredEvents(events);
    }, [events]);

    const handleFilter = (filtered: Event[]) => {
        setFilteredEvents(filtered);
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
                <FilterBar events={events} onFilter={handleFilter}/>
                {status === 'loading' && <p>{t('loading')}...</p>}
                {status === 'failed' && <p>{t('failed_to_load_events')}</p>}
                <div className="event-list">
                    {filteredEvents.map(event => (
                        <EventCard key={event.eventId} event={event} isEditable={false} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventList;
