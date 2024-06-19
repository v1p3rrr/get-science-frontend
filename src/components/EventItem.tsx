import React from 'react';
import { useTranslation } from 'react-i18next';

interface EventProps {
    event: {
        eventId: number;
        title: string;
        description: string;
        dateStart: string;
        dateEnd: string;
        location: string;
    };
}

const EventItem: React.FC<EventProps> = ({ event }) => {
    const { t } = useTranslation();

    return (
        <div>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p>{event.location}</p>
            <p>{new Date(event.dateStart).toLocaleDateString()} - {new Date(event.dateEnd).toLocaleDateString()}</p>
        </div>
    );
};

export default EventItem;
