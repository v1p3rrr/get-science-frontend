import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Backdrop, CircularProgress } from '@mui/material';
import EventForm from './EventForm';
import { fetchEventWithPeopleByIdAPI, exportEventParticipantsToExcel } from '../../../api/eventsAPI';
import { Event } from '../../../models/Models';
import {getUsername, getUserProfileId} from '../../../services/auth';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

type EditEventPageProps = {
  mode?: 'edit' | 'moderate';
};

const EditEventPage: React.FC<EditEventPageProps> = ({ mode = 'edit' }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isOrganizerOrCoowner, setIsOrganizerOrCoowner] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserEmail = getUsername();
  const { t } = useTranslation();

  useEffect(() => {
    if (eventId) {
      fetchEventWithPeopleByIdAPI(Number(eventId)).then((data) => {
        setEventData(data);
        
        // Проверяем, является ли текущий пользователь организатором
        const isUserOrganizer = getUserProfileId() === data.organizerId;
        setIsOrganizer(isUserOrganizer);
        
        // Проверяем, является ли текущий пользователь организатором или совладельцем
        const isUserCoowner = data.coowners?.some(coowner => coowner.email === currentUserEmail) || false;
        setIsOrganizerOrCoowner(isUserOrganizer || isUserCoowner);
        
        setLoading(false);
      });
    }
  }, [eventId, currentUserEmail]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)" position="relative">
      <Backdrop
        open={true}
        sx={{ 
          position: 'absolute',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'transparent'
        }}
      >
        <CircularProgress />
      </Backdrop>
    </Box>
  );
  
  if (!eventData) return <div>Мероприятие не найдено</div>;

  return (
    <EventForm
      mode={mode}
      initialData={eventData}
      onSave={() => navigate('/my-events')}
      onCancel={() => navigate('/my-events')}
      isOrganizer={isOrganizer}
    />
  );
};

export default EditEventPage; 