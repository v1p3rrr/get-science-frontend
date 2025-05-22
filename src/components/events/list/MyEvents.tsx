import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Pagination, Divider, Typography, Backdrop, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventCard from './EventCard';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyEventsAPI, fetchCoownerEventsAPI, fetchReviewerEventsAPI } from '../../../api/eventsAPI';
import { Event } from '../../../models/Models';
import { getUsername } from '../../../services/auth';

const PAGE_SIZE = 6;

const MyEvents: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Мои ивенты
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [myTotalPages, setMyTotalPages] = useState(1);
    const [myPage, setMyPage] = useState(1);
    const [myEventsLoading, setMyEventsLoading] = useState(true);

    // Совладелец
    const [coownerEvents, setCoownerEvents] = useState<Event[]>([]);
    const [coownerTotalPages, setCoownerTotalPages] = useState(1);
    const [coownerPage, setCoownerPage] = useState(1);
    const [coownerEventsLoading, setCoownerEventsLoading] = useState(true);

    // Ревьюер
    const [reviewerEvents, setReviewerEvents] = useState<Event[]>([]);
    const [reviewerTotalPages, setReviewerTotalPages] = useState(1);
    const [reviewerPage, setReviewerPage] = useState(1);
    const [reviewerEventsLoading, setReviewerEventsLoading] = useState(true);

    // Загрузка данных
    useEffect(() => {
        setMyEventsLoading(true);
        fetchMyEventsAPI(myPage - 1, PAGE_SIZE).then(data => {
            setMyEvents(data.content || []);
            setMyTotalPages(data.totalPages || 1);
            setMyEventsLoading(false);
        }).catch(() => {
            setMyEventsLoading(false);
        });
    }, [myPage]);

    useEffect(() => {
        setCoownerEventsLoading(true);
        fetchCoownerEventsAPI(coownerPage - 1, PAGE_SIZE).then(data => {
            setCoownerEvents(data.content || []);
            setCoownerTotalPages(data.totalPages || 1);
            setCoownerEventsLoading(false);
        }).catch(() => {
            setCoownerEventsLoading(false);
        });
    }, [coownerPage]);

    useEffect(() => {
        setReviewerEventsLoading(true);
        fetchReviewerEventsAPI(reviewerPage - 1, PAGE_SIZE).then(data => {
            setReviewerEvents(data.content || []);
            setReviewerTotalPages(data.totalPages || 1);
            setReviewerEventsLoading(false);
        }).catch(() => {
            setReviewerEventsLoading(false);
        });
    }, [reviewerPage]);

    return (
        <Box>
            <Paper 
                elevation={0} 
                sx={{ 
                    py: 2, 
                    px: 3, 
                    mb: 3, 
                    backgroundColor: 'background.default',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{
                        width: 300,
                        justifyContent: 'center'
                     }}
                    onClick={() => navigate('/create-event')}
                >
                    {t('create_event')}
                </Button>
            </Paper>

            {/* Мои мероприятия */}
            <Box position="relative" width="100%" minHeight={myEvents.length > 0 || myEventsLoading ? "200px" : "auto"}>
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
                    {myEvents.map((event) => (
                        <EventCard 
                            key={event.eventId} 
                            event={event} 
                            isEditable={true} 
                            showStatus={true}
                            onEditClick={() => navigate(`/events/${event.eventId}/edit`, { 
                                state: { mode: 'edit' } 
                            })} 
                        />
                    ))}
                </Box>
                {myEventsLoading && (
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
                )}
                {!myEventsLoading && myEvents.length === 0 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <span style={{ color: '#888', fontSize: 18 }}>{t('no_events_found')}</span>
                    </Box>
                )}
                <Box display="flex" justifyContent="center" mt={2} mb={2}>
                    <Pagination
                        count={myTotalPages}
                        page={myPage}
                        onChange={(_, value) => setMyPage(value)}
                        color="primary"
                        shape="rounded"
                        siblingCount={1}
                        boundaryCount={1}
                        disabled={myTotalPages <= 1}
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Совладелец */}
            <Typography variant="h6" sx={{ mb: 2 }}>{t('coowner_events')}</Typography>
            <Box position="relative" width="100%" minHeight={coownerEvents.length > 0 || coownerEventsLoading ? "200px" : "auto"}>
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
                    {coownerEvents.map((event) => (
                        <EventCard 
                            key={event.eventId} 
                            event={event} 
                            isEditable={true} 
                            onEditClick={() => navigate(`/events/${event.eventId}/edit`, { 
                                state: { mode: 'edit_coowner' } 
                            })} 
                        />
                    ))}
                </Box>
                {coownerEventsLoading && (
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
                        <Typography variant="h6" color="white">{t('loading_coowner_events')}</Typography>
                    </Backdrop>
                )}
                {!coownerEventsLoading && coownerEvents.length === 0 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <span style={{ color: '#888', fontSize: 18 }}>{t('no_events_found')}</span>
                    </Box>
                )}
                <Box display="flex" justifyContent="center" mt={2} mb={2}>
                    <Pagination
                        count={coownerTotalPages}
                        page={coownerPage}
                        onChange={(_, value) => setCoownerPage(value)}
                        color="primary"
                        shape="rounded"
                        siblingCount={1}
                        boundaryCount={1}
                        disabled={coownerTotalPages <= 1}
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Ревьюер */}
            <Typography variant="h6" sx={{ mb: 2 }}>{t('reviewer_events')}</Typography>
            <Box position="relative" width="100%" minHeight={reviewerEvents.length > 0 || reviewerEventsLoading ? "200px" : "auto"}>
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
                    {reviewerEvents.map((event) => (
                        <EventCard key={event.eventId} event={event} isEditable={false} />
                    ))}
                </Box>
                {reviewerEventsLoading && (
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
                        <Typography variant="h6" color="white">{t('loading_reviewer_events')}</Typography>
                    </Backdrop>
                )}
                {!reviewerEventsLoading && reviewerEvents.length === 0 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <span style={{ color: '#888', fontSize: 18 }}>{t('no_events_found')}</span>
                    </Box>
                )}
                <Box display="flex" justifyContent="center" mt={2} mb={2}>
                    <Pagination
                        count={reviewerTotalPages}
                        page={reviewerPage}
                        onChange={(_, value) => setReviewerPage(value)}
                        color="primary"
                        shape="rounded"
                        siblingCount={1}
                        boundaryCount={1}
                        disabled={reviewerTotalPages <= 1}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default MyEvents;
