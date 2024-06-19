import { Event, FileEvent, DocRequired, EventRequest, FileEventRequest } from '../models/Models';
import axiosInstance from '../axiosInstance';

// const API_URL = 'http://localhost:8080/api/v1/events';

export const fetchEventsAPI = async (): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>('/events');
    return response.data;
};

export const fetchMyEventsAPI = async (): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>('/events/my-events');
    return response.data;
};

export const fetchEventByIdAPI = async (eventId: number): Promise<Event> => {
    const response = await axiosInstance.get<Event>(`/events/${eventId}`);
    return response.data;
};

export const fetchRecommendationsAPI = async (eventId: number): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>(`/events/${eventId}/recommendations`);
    return response.data;
};


export const createEventAPI = async (event: EventRequest): Promise<string> => {
    const response = await axiosInstance.post<string>('/events', event);
    return response.data;
};

export const updateEventAPI = async (eventId: number, event: EventRequest): Promise<string> => {
    const response = await axiosInstance.post<string>(`/events/${eventId}/update`, event);
    return response.data;
};

export const deleteEventAPI = async (eventId: number): Promise<string> => {
    const response = await axiosInstance.delete<string>(`/events/${eventId}`);
    return response.data;
};

export const addFileToEventAPI = async (eventId: number, fileEvent: FileEventRequest): Promise<string> => {
    const response = await axiosInstance.post<string>(`/events/${eventId}/files`, fileEvent);
    return response.data;
};

export const fetchFilesByEventAPI = async (eventId: number): Promise<FileEvent[]> => {
    const response = await axiosInstance.get<FileEvent[]>(`/events/${eventId}/files`);
    return response.data;
};
