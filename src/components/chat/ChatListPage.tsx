import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton,
  ListItemText, 
  ListItemIcon, 
  CircularProgress, 
  Paper, 
  Divider, 
  Badge, 
  Pagination,
  Backdrop
} from '@mui/material';
import { ChatResponse, Page } from '../../models/Models';
import { getMyChatsAPI } from '../../api/chatAPI';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { getUserProfileId } from '../../services/auth'; // Импортируем getUserProfileId

const ChatListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [chatsPage, setChatsPage] = useState<Page<ChatResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const currentUserProfileId = getUserProfileId(); // Получаем ID профиля текущего пользователя

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const data = await getMyChatsAPI(currentPage, 20); // Загружаем текущую страницу (до 20 чатов)
        setChatsPage(data);
      } catch (err) {
        setError(t('failed_to_load_chats') || 'Failed to load chats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [t, currentPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page - 1); // API использует 0-индексацию, а Pagination компонент - 1-индексацию
  };

  if (loading) {
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
          <Typography variant="h6" color="white">{t('loading_chats')}</Typography>
        </Backdrop>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!chatsPage || chatsPage.content.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">{t('no_chats_found') || 'You have no chats yet.'}</Typography>
        <Typography>{t('start_chat_from_event') || 'You can start a chat from an event page.'}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ margin: 'auto', mt: 4, maxWidth: 800, p: 2 }}>
      <List>
        {chatsPage.content.map((chat, index) => {
          let chatTitle = chat.eventTitle;
          console.log(chat.initiatorId)
          // Если текущий пользователь не инициатор, показываем "Имя Фамилия инициатора (Название ивента)"
          if (currentUserProfileId !== null && chat.initiatorId !== currentUserProfileId) {
             chatTitle = `${chat.initiatorFirstName} ${chat.initiatorLastName} (${chat.eventTitle})`;
          } else {
            // Если текущий пользователь - инициатор, chatTitle уже содержит chat.eventTitle
            // Ничего дополнительно делать не нужно.
          }

          return (
            <React.Fragment key={chat.id}>
              <ListItemButton onClick={() => navigate(`/chats/${chat.id}`, { state: { from: 'chatList' } })}>
                <ListItemIcon>
                  <Badge badgeContent={chat.unreadCount > 0 ? chat.unreadCount : null} color="error">
                    <QuestionAnswerIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary={chatTitle} 
                  secondary={chat.lastMessage ? `${chat.lastMessage.senderFirstName}: ${chat.lastMessage.content.substring(0,50)}${chat.lastMessage.content.length > 50 ? '...' : ''}` : (t('no_messages_yet') || 'No messages yet')}
                  secondaryTypographyProps={{ noWrap: true }} 
                />
              </ListItemButton>
              {index < chatsPage.content.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
      
      {/* Пагинация, если totalPages > 1 */}
      {chatsPage.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={chatsPage.totalPages} 
            page={currentPage + 1} // +1 потому что MUI Pagination начинается с 1, а наш API с 0
            onChange={handlePageChange}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
};

export default ChatListPage; 