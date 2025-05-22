import { getUnreadChatsCountAPI } from '../api/chatAPI';
import {getToken} from "./auth";

class ChatStateService {
  private unreadChatsCount: number = 0;

  async getUnreadChatsCount(): Promise<number> {
    if (!getToken()) return 0;
    try {
      this.unreadChatsCount = await getUnreadChatsCountAPI();
      window.dispatchEvent(new CustomEvent<number>('unreadChatsCountUpdated', { detail: this.unreadChatsCount }));
      return this.unreadChatsCount;
    } catch (error) {
      console.error('Failed to fetch unread chats count:', error);
      // window.dispatchEvent(new CustomEvent<number>('unreadChatsCountUpdated', { detail: 0 })); // Optionally dispatch 0 on error
      return 0;
    }
  }

  getCurrentUnreadChatsCount(): number {
    return this.unreadChatsCount;
  }
}

export const chatStateService = new ChatStateService(); 