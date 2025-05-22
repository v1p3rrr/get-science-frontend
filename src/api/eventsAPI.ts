import { Event, FileEvent, EventRequest, FileEventRequest, ModerationStatus, Reviewer } from '../models/Models';
import axiosInstance from '../util/axiosInstance';

export const fetchEventsAPI = async (): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>('/events');
    return response.data;
};

export const fetchMyEventsAPI = async (page = 0, size = 6) => {
    const response = await axiosInstance.get(`/events/my?page=${page}&size=${size}`);
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

export const createEventAPI = async (event: EventRequest, files: File[] = [], fileEventRequestList: FileEventRequest[] = []): Promise<string> => {
    // Проверяем, что количество файлов соответствует количеству метаданных
    if (files.length !== fileEventRequestList.length) {
        throw new Error('Files count must match metadata count');
    }

    if (files.length === 0) {
        // Если файлов нет, используем обычный JSON-запрос
        const response = await axiosInstance.post<string>('/events', event);
        return response.data;
    } else {
        // Если есть файлы, используем multipart/form-data
        const formData = new FormData();
        
        // Добавляем объект eventRequest как JSON
        formData.append('eventRequest', new Blob([JSON.stringify(event)], { type: 'application/json' }));
        
        // Добавляем список метаданных как JSON
        formData.append('fileEventRequest', new Blob([JSON.stringify(fileEventRequestList)], { type: 'application/json' }));
        
        // Добавляем файлы в том же порядке, что и метаданные
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await axiosInstance.post<string>('/events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const updateEventAPI = async (eventId: number, event: EventRequest, files: File[] = [], fileEventRequestList: FileEventRequest[] = []): Promise<boolean> => {
    try {
        // Проверяем, что количество файлов соответствует количеству метаданных
        if (files.length !== fileEventRequestList.length) {
            throw new Error('Files count must match metadata count');
        }
        const formData = new FormData();

        formData.append('eventRequest', new Blob([JSON.stringify(event)], {type: 'application/json'}));
        if (files.length !== 0) {
            formData.append('fileEventRequest', new Blob([JSON.stringify(fileEventRequestList)], {type: 'application/json'}));

            // Добавляем файлы в том же порядке, что и метаданные
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const response = await axiosInstance.put<string>(`/events/${eventId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.status === 200;

    } catch (error) {
        console.error('Error updating event:', error);
        return false;
    }
};

export const deleteEventAPI = async (eventId: number): Promise<boolean> => {
    try {
        const response = await axiosInstance.delete<string>(`/events/${eventId}`);
        return response.status === 200;
    } catch (error) {
        console.error('Error deleting event:', error);
        return false;
    }
};

export const addFileToEventAPI = async (eventId: number, fileEvent: FileEventRequest): Promise<string> => {
    const response = await axiosInstance.post<string>(`/events/${eventId}/files`, fileEvent);
    return response.data;
};

export const fetchFilesByEventAPI = async (eventId: number): Promise<FileEvent[]> => {
    const response = await axiosInstance.get<FileEvent[]>(`/events/${eventId}/files`);
    return response.data;
};

export const fetchEventsPageAPI = async (page = 0, size = 12) => {
    const response = await axiosInstance.get(`/events?page=${page}&size=${size}`);
    return response.data; // { content, totalPages, ... }
};

export const fetchMyEventsPageAPI = async (page = 0, size = 12) => {
    const response = await axiosInstance.get(`/events/my-events?page=${page}&size=${size}`);
    return response.data; // { content, totalPages, ... }
};

export const searchUsersAPI = async (email: string): Promise<Reviewer[]> => {
    const response = await axiosInstance.get(`/auth/users?email=${encodeURIComponent(email)}`);
    return response.data;
};

export const fetchEventWithPeopleByIdAPI = async (eventId: number): Promise<Event> => {
    const response = await axiosInstance.get<Event>(`/events/${eventId}/with-people`);
    return response.data;
};

export const fetchCoownerEventsAPI = async (page = 0, size = 6) => {
    const response = await axiosInstance.get(`/events/coowner?page=${page}&size=${size}`);
    return response.data;
};

export const fetchReviewerEventsAPI = async (page = 0, size = 6) => {
    const response = await axiosInstance.get(`/events/reviewer?page=${page}&size=${size}`);
    return response.data;
};

export const fetchPendingModerationEventsAPI = async (page = 0, size = 12) => {
    return axiosInstance.get(`/events/moderation/pending`, {
        params: { page, size },
    }).then(res => res.data);
};

export const fetchApprovedModerationEventsAPI = async (page = 0, size = 12) => {
    return axiosInstance.get(`/events/moderation/approved`, {
        params: { page, size },
    }).then(res => res.data);
};

export const updateEventModerationStatusAPI = async (eventId: number, moderationStatus: ModerationStatus): Promise<boolean> => {
  try {
    const response = await axiosInstance.patch(`/events/${eventId}/moderation`, moderationStatus);
    return response.status === 200;
  } catch (error) {
    console.error('Error updating event moderation status:', error);
    return false;
  }
};

export const uploadEventMaterialAPI = async (
  eventId: number, 
  file: File, 
  name: string, 
  category: string, 
  description: string
): Promise<FileEvent> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('category', category);
  formData.append('description', description);

  const response = await axiosInstance.post<FileEvent>(
    `/events/${eventId}/material`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Скачивает файл экспорта календаря для события
 * @param eventId ID события
 * @returns URL для загрузки файла календаря
 */
export const exportEventToCalendarAPI = async (eventId: number): Promise<string> => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/calendar`, {
      responseType: 'blob',
    });
    
    // Создаем временный URL для скачивания файла
    const url = window.URL.createObjectURL(new Blob([response.data]));
    return url;
  } catch (error) {
    console.error('Error exporting event to calendar:', error);
    throw error;
  }
};

/**
 * Экспорт списка участников события в Excel
 * @param eventId ID события
 * @returns URL для загрузки Excel-файла
 */
export const exportEventParticipantsToExcel = async (eventId: number): Promise<string> => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/participants/export`, {
      responseType: 'blob',
    });
    
    // Создаем временный URL для скачивания файла
    const url = window.URL.createObjectURL(new Blob([response.data]));
    return url;
  } catch (error) {
    console.error('Error exporting participants:', error);
    throw error;
  }
};

/**
 * Получение метаданных для построения фильтров
 * @returns Объект с данными для фильтров: темы, типы, форматы, местоположения
 */
export const fetchEventFilterMetadata = async () => {
  try {
    const response = await axiosInstance.get('/events/filter-metadata');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter metadata:', error);
    return {
      themes: [],
      types: [],
      formats: [],
      locations: []
    };
  }
};

/**
 * Расширенный поиск мероприятий с поддержкой множественных фильтров
 * @param filterRequest Объект с параметрами фильтрации
 * @returns Страница результатов поиска мероприятий
 */
export const searchEventsWithAdvancedFilters = async (filterRequest: {
  types?: string[];
  themes?: string[];
  formats?: string[];
  locations?: string[];
  title?: string;
  observersAllowed?: boolean;
  liveStatus?: string[];
  isApplicationAvailable?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  size?: number;
}) => {
  try {
    // Форматируем даты для отправки на сервер
    let dateFromStr: string | undefined;
    let dateToStr: string | undefined;
    
    if (filterRequest.dateFrom) {
      const dateFrom = new Date(filterRequest.dateFrom);
      dateFrom.setHours(0, 0, 0, 0); // 00:00:00
      dateFromStr = dateFrom.toISOString();
    }
    
    if (filterRequest.dateTo) {
      const dateTo = new Date(filterRequest.dateTo);
      dateTo.setHours(23, 59, 59, 999); // 23:59:59.999
      dateToStr = dateTo.toISOString();
    }
    
    const response = await axiosInstance.post('/events/search', {
      ...filterRequest,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      page: filterRequest.page || 0,
      size: filterRequest.size || 12
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching events with advanced filters:', error);
    throw error;
  }
};