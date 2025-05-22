import React from 'react';
import { EventList } from './EventList';
import { fetchPendingModerationEventsAPI, fetchApprovedModerationEventsAPI } from '../../../api/eventsAPI';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Event } from '../../../models/Models';

interface ModerationEventListProps {
    status: 'pending' | 'approved';
}

const ModerationEventList: React.FC<ModerationEventListProps> = ({ status }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Создаем обертки для API функций, чтобы они принимали (page, filters), но использовали только page
    const fetchPendingWrapper = (page: number, filters?: Record<string, any>) => {
        console.log("Fetching pending moderation events, page:", page, "Filters (ignored):", filters); // Лог для отладки
        return fetchPendingModerationEventsAPI(page, 12); // Игнорируем filters, передаем page и size
    };
    
    const fetchApprovedWrapper = (page: number, filters?: Record<string, any>) => {
        console.log("Fetching approved moderation events, page:", page, "Filters (ignored):", filters); // Лог для отладки
        return fetchApprovedModerationEventsAPI(page, 12); // Игнорируем filters, передаем page и size
    };

    const fetchEventsFn = status === 'pending' 
        ? fetchPendingWrapper 
        : fetchApprovedWrapper;

    const handleEventClick = (event: Event) => {
        navigate(`/events/${event.eventId}/moderate`);
    };

    const title = status === 'pending' ? t('moderation_pending') : t('moderation_approved');
    
    return <EventList fetchEventsFn={fetchEventsFn} showFilters={false} title={title} onEventClick={handleEventClick} showStatus={true} />;
};

export default ModerationEventList; 