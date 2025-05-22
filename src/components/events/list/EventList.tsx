import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Alert, Pagination, Backdrop } from '@mui/material';
import { Event, LiveStatus } from '../../../models/Models';
import EventCard from './EventCard';
import FilterBar from './FilterBar';
import { searchEventsWithAdvancedFilters } from '../../../api/eventsAPI';

interface EventListProps {
    fetchEventsFn?: (page: number, filters?: any) => Promise<{ content: Event[], totalPages: number, totalElements: number, hasNext: boolean } | void>;
    showFilters?: boolean;
    title?: string;
    onEventClick?: (event: Event) => void;
    showStatus?: boolean;
}

const EventList: React.FC<EventListProps> = ({ fetchEventsFn, showFilters = true, title, onEventClick, showStatus = false }) => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState<any>({
        types: [],
        themes: [],
        formats: [],
        locations: [],
        title: '',
        observersAllowed: false,
        liveStatus: [],
        isApplicationAvailable: false,
        dateFrom: null,
        dateTo: null
    });
    const [draftFilters, setDraftFilters] = useState<any>({
        types: [],
        themes: [],
        formats: [],
        locations: [],
        title: '',
        observersAllowed: false,
        liveStatus: [],
        isApplicationAvailable: false,
        dateFrom: null,
        dateTo: null
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [eventsPage, setEventsPage] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pageSize = 12;

    const fetchEventsPage = async (pageToLoad = 1, filtersToUse = filters) => {
        setLoading(true);
        setError(null);
        try {
            // Если передан кастомный fetch функция, используем её
            if (fetchEventsFn) {
                const data = await fetchEventsFn(pageToLoad - 1, filtersToUse);
                if (data) {
                    setEventsPage(data.content || []);
                    setTotalPages(data.totalPages || 1);
                    setTotalElements(data.totalElements || 0);
                }
            } else {
                // Создаем копию фильтров, чтобы не модифицировать оригинальный объект
                const requestFilters = { ...filtersToUse };
                
                // Отправляем параметры только если они установлены
                if (!requestFilters.observersAllowed) {
                    delete requestFilters.observersAllowed;
                }
                if (!requestFilters.isApplicationAvailable) {
                    delete requestFilters.isApplicationAvailable;
                }
                if (requestFilters.liveStatus && requestFilters.liveStatus.length === 0) {
                    delete requestFilters.liveStatus;
                }
                if (!requestFilters.dateFrom) {
                    delete requestFilters.dateFrom;
                }
                if (!requestFilters.dateTo) {
                    delete requestFilters.dateTo;
                }
                
                const data = await searchEventsWithAdvancedFilters({
                    ...requestFilters,
                    page: pageToLoad - 1,
                    size: pageSize
                });
                setEventsPage(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || 0);
            }
        } catch (e) {
            setEventsPage([]);
            setTotalPages(1);
            setTotalElements(0);
            setError(t('failed_to_load_events'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventsPage(page, filters);
        // eslint-disable-next-line
    }, [page, JSON.stringify(filters), fetchEventsFn]);

    const handleFilterDraftChange = (newDraft: any) => {
        setDraftFilters(newDraft);
    };

    const handleApplyFilters = () => {
        setFilters(draftFilters);
        setPage(1);
    };

    // Новая функция для сброса фильтров и показа всех мероприятий
    const handleResetFilters = () => {
        const emptyFilters = {
            types: [],
            themes: [],
            formats: [],
            locations: [],
            title: '',
            observersAllowed: false,
            liveStatus: [],
            isApplicationAvailable: false,
            dateFrom: null,
            dateTo: null
        };
        setDraftFilters(emptyFilters);
        setFilters(emptyFilters);
        setPage(1);
        // Принудительно запрашиваем первую страницу со всеми мероприятиями
        fetchEventsPage(1, emptyFilters);
    };

    if (loading && eventsPage.length === 0) {
        return (
            <Box position="relative" width="100%" height="100%" minHeight="400px">
                <Backdrop
                    sx={{ 
                        position: 'absolute',
                        color: '#fff', 
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        backgroundColor: 'transparent'
                    }}
                    open={true}
                >
                    <CircularProgress color="primary" size={60} />
                    <Typography variant="h6" color="white">{t('loading_events')}</Typography>
                </Backdrop>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100%', pl: 0, position: 'relative' }}>
            {title && <Typography variant="h5" sx={{ mb: 2 }}>{title}</Typography>}
            <Box sx={{ p: 0 }}>
                {showFilters && (
                    <FilterBar
                        filters={draftFilters}
                        onFilterChange={handleFilterDraftChange}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                    />
                )}
                
                {loading && eventsPage.length > 0 && (
                    <Backdrop
                        sx={{ 
                            position: 'absolute',
                            color: '#fff', 
                            zIndex: (theme) => theme.zIndex.drawer + 1,
                            backgroundColor: 'transparent'
                        }}
                        open={true}
                    >
                        <CircularProgress color="primary" size={60} />
                    </Backdrop>
                )}
                
                <Box sx={{ 
                    display: 'grid',
                    gap: 3,
                    mt: 2,
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)'
                    }
                }}>
                    {eventsPage.map((event) => (
                        <EventCard 
                            key={event.eventId} 
                            event={event} 
                            isEditable={false} 
                            showStatus={showStatus}
                            onClick={() => onEventClick?.(event)}
                        />
                    ))}
                </Box>
                
                {eventsPage.length === 0 && !loading && (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <Typography variant="h6" color="text.secondary">
                            {t('no_events_found')}
                        </Typography>
                    </Box>
                )}
                
                <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        shape="rounded"
                        siblingCount={1}
                        boundaryCount={1}
                        disabled={totalPages <= 1}
                    />
                </Box>
            </Box>
        </Box>
    );
};

const DefaultEventList: React.FC = () => {
    return <EventList showFilters={true} />;
};

export default DefaultEventList;
export { EventList };
