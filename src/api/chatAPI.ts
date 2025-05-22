import axiosInstance from '../util/axiosInstance';
import { 
    ProfileData, 
    Page, 
    ChatMessageRequest, 
    ChatMessageResponse, 
    ChatResponse 
} from '../models/Models';


const API_CHAT_URL = '/chats';

export const findChatByEventAPI = async (eventId: number): Promise<ChatResponse | null> => {
  try {
    const response = await axiosInstance.get<ChatResponse>(`${API_CHAT_URL}/event/${eventId}/find`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Чат не найден
    }
    throw error; // Перебрасываем другие ошибки
  }
};

export const sendInitialMessageAPI = async (eventId: number, messageRequest: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ChatMessageResponse>(`${API_CHAT_URL}/event/${eventId}/message`, messageRequest);
  return response.data;
};

export const getChatMessagesAPI = async (chatId: number, page: number = 0, size: number = 20): Promise<Page<ChatMessageResponse>> => {
  const response = await axiosInstance.get<Page<ChatMessageResponse>>(`${API_CHAT_URL}/${chatId}/messages`, {
    params: { page, size },
  });
  return response.data;
};

export const getMyChatsAPI = async (page: number = 0, size: number = 10): Promise<Page<ChatResponse>> => {
  const response = await axiosInstance.get<Page<ChatResponse>>(`${API_CHAT_URL}/my`, {
    params: { page, size },
  });
  return response.data;
};

export const markChatAsReadAPI = async (chatId: number): Promise<void> => {
  await axiosInstance.post(`${API_CHAT_URL}/${chatId}/read`);
};

export const getChatParticipantsAPI = async (chatId: number): Promise<ProfileData[]> => {
  const response = await axiosInstance.get<ProfileData[]>(`${API_CHAT_URL}/${chatId}/participants`);
  return response.data;
};

export const getUnreadChatsCountAPI = async (): Promise<number> => {
  const response = await axiosInstance.get<number>(`${API_CHAT_URL}/unread-count`);
  return typeof response.data === 'number' ? response.data : 0;
};

export const getChatDetailsAPI = async (chatId: number): Promise<ChatResponse> => {
  const response = await axiosInstance.get<ChatResponse>(`${API_CHAT_URL}/${chatId}/details`);
  return response.data;
}; 