import React from 'react';
import { Box, Container } from '@mui/material';
import EventCard from './EventCard';
import { Event } from '../../../models/Models';

interface EventGridProps {
  events: Event[];
}

const EventGrid: React.FC<EventGridProps> = ({ events }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 2,
      display: 'flex',
      justifyContent: 'flex-start',
      padding: 0,
      margin: 0
     }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(300px, 1fr)',
            sm: 'repeat(auto-fit, minmax(300px, 1fr))',
            md: 'repeat(auto-fit, minmax(300px, 1fr))',
            lg: 'repeat(auto-fit, minmax(300px, 1fr))',
          },
          gap: 3,
          justifyItems: '',
          alignItems: 'stretch',
          '& > *': {
            width: '100%',
            maxWidth: 345,
            height: '100%',
          },
        }}
      >
        {events.map((event) => (
          <Box key={event.eventId}>
            <EventCard event={event} isEditable={false} />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default EventGrid; 