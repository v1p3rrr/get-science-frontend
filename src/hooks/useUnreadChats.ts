import { useState, useEffect } from 'react';
import { chatStateService } from '../services/chatStateService';

export const useUnreadChats = () => {
  const [unreadChatsCount, setUnreadChatsCount] = useState<number>(chatStateService.getCurrentUnreadChatsCount());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      setUnreadChatsCount(customEvent.detail);
    };

    window.addEventListener('unreadChatsCountUpdated', handleUpdate);

    chatStateService.getUnreadChatsCount();

    return () => {
      window.removeEventListener('unreadChatsCountUpdated', handleUpdate);
    };
  }, []);

  return { unreadChatsCount };
}; 