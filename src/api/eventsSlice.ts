import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../app/store';
import { fetchEventsAPI, fetchEventByIdAPI, fetchMyEventsAPI, fetchPendingModerationEventsAPI, fetchApprovedModerationEventsAPI } from './eventsAPI';
import { Event } from '../models/Models';

interface EventsState {
    events: Event[];
    status: 'idle' | 'loading' | 'failed';
}

const initialState: EventsState = {
    events: [],
    status: 'idle',
};

export const eventsSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        getEventsStart: (state) => {
            state.status = 'loading';
        },
        getEventsSuccess: (state, action: PayloadAction<Event[]>) => {
            state.status = 'idle';
            state.events = action.payload;
        },
        getEventsFailure: (state) => {
            state.status = 'failed';
        },
        getEventSuccess: (state, action: PayloadAction<Event>) => {
            state.status = 'idle';
            const index = state.events.findIndex(event => event.eventId === action.payload.eventId);
            if (index >= 0) {
                state.events[index] = action.payload;
            } else {
                state.events.push(action.payload);
            }
        }
    },
});

export const { getEventsStart, getEventsSuccess, getEventsFailure, getEventSuccess } = eventsSlice.actions;



export const fetchMyEvents = (): AppThunk => async (dispatch) => {
    try {
        dispatch(getEventsStart());
        const events = await fetchMyEventsAPI();
        dispatch(getEventsSuccess(events));
    } catch (error) {
        dispatch(getEventsFailure());
    }
};

export const fetchEventById = (eventId: number): AppThunk => async (dispatch) => {
    try {
        const event = await fetchEventByIdAPI(eventId);
        dispatch(getEventSuccess(event));
    } catch (error) {
        dispatch(getEventsFailure());
    }
};


export const selectEvent = (state: RootState, eventId: number) =>
    (state.events.events || []).find(event => event.eventId === eventId);

export default eventsSlice.reducer;