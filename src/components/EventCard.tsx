import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Event} from '../models/Models';
import {useTranslation} from 'react-i18next';
import '../styles/style.css';
import {useDispatch} from 'react-redux';
import {deleteEventAPI} from '../events/eventsAPI';
import {fetchMyEvents} from '../events/eventsSlice';
import {AppDispatch} from "../app/store";
import {toSentenceCase} from "../util/utils";

interface EventCardProps {
    event: Event;
    isEditable: boolean;
}

const EventCard: React.FC<EventCardProps> = ({event, isEditable}) => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const {t} = useTranslation();

    const handleDelete = async () => {
        try {
            await deleteEventAPI(event.eventId);
            dispatch(fetchMyEvents());
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const handleEdit = () => {
        navigate(`/edit-event/${event.eventId}`);
    };

    return (
        <div className="event-card">
            <Link to={`/events/${event.eventId}`} className="event-card-link">
                <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className="event-status">{event.status}</span>
                </div>
                <div className="event-info">
                    <div>
                        <p className="event-location"><i className="fas fa-map-marker-alt"></i> {event.location}</p>
                        <p className="event-dates"><i
                            className="fas fa-calendar-alt"></i> {new Date(event.dateStart).toLocaleDateString()} - {new Date(event.dateEnd).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p><strong>{t('organizer')}:</strong> {event.organizer}</p>
                        <p><strong>{t('type')}:</strong> {event.type}</p>
                        <p><strong>{t('theme')}:</strong> {event.theme}</p>
                        <p><strong>{t('format')}:</strong> {toSentenceCase(event.format)}</p>
                    </div>
                </div>
                <div className="event-description">
                    <p>{event.description}</p>
                </div>
            </Link>{isEditable && (
            <div className="event-actions">
                <button onClick={handleEdit}>Edit</button>
                <button onClick={handleDelete}>Delete</button>
            </div>
        )}
        </div>
    );
};

export default EventCard;
