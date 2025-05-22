import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Alert,
  Container,
  styled,
  Fab,
  Tooltip,
  Grid,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { 
    ChatResponse, 
    ChatMessageResponse, 
    ProfileData, 
    ChatMessageRequest 
} from '../../models/Models';
import {
  findChatByEventAPI,
  sendInitialMessageAPI,
  getChatMessagesAPI,
  getChatParticipantsAPI,
  markChatAsReadAPI,
  getChatDetailsAPI,
} from '../../api/chatAPI';
import { webSocketService } from '../../services/webSocketService';
import { getToken, getUsername, getUserProfileId } from '../../services/auth';
import { format, isValid, isDate } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const ChatContainer = styled(Container)(({ theme }) => ({
  height: 'calc(100vh - 64px - 40px)', // Full height minus header and some padding
  display: 'flex',
  flexDirection: 'column',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MessagesPaper = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const MessageInputPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
}));

const ChatPage: React.FC = () => {
  const { eventId: eventIdParam, chatId: chatIdParam } = useParams<{ eventId?: string; chatId?: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserEmail = getUsername();
  const theme = useTheme();
  const currentUserProfileIdForMarkAsRead = getUserProfileId();
  const currentUserProfileId = getUserProfileId();

  console.log('[ChatPage RENDER] currentUserEmail from auth.ts on mount/render:', currentUserEmail);

  const [chatDetails, setChatDetails] = useState<ChatResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [participants, setParticipants] = useState<Record<number, ProfileData>>({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chatIdToUse, setChatIdToUse] = useState<number | null>(chatIdParam ? parseInt(chatIdParam) : null);
  const [eventIdForNewChat, setEventIdForNewChat] = useState<number | null>(null);
  const [isSendingInitialMessage, setIsSendingInitialMessage] = useState<boolean>(false);
  const [chatDisplayName, setChatDisplayName] = useState<string>('');


  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const subscriptionRef = useRef<{ userSubId: string; topicSubId: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessageReceived = useCallback((message: ChatMessageResponse) => {
    console.log('[ChatPage] handleNewMessageReceived CALLED. Message:', message);
    
    const senderProfile = participants[message.senderId];
    const senderEmail = senderProfile?.email;
    console.log('[ChatPage] handleNewMessageReceived - Current UserEmail:', currentUserEmail, 'Message SenderId:', message.senderId, 'Found Sender Profile Email:', senderEmail);

    setMessages((prevMessages) => {
      console.log('[ChatPage] setMessages updater. Prev messages count:', prevMessages.length);
      if (prevMessages.find(m => m.id === message.id)) {
        console.log('[ChatPage] Message already exists, not adding:', message.id);
        return prevMessages;
      }
      const newMessagesArray = [...prevMessages, message].sort((a,b) => {
        const timeA = isDate(new Date(a.timestamp)) ? new Date(a.timestamp).getTime() : 0;
        const timeB = isDate(new Date(b.timestamp)) ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });
      console.log('[ChatPage] New messages array count:', newMessagesArray.length);
      return newMessagesArray;
    });

    if (message.chatId === chatIdToUse && message.senderId !== currentUserProfileIdForMarkAsRead) { 
        if(chatIdToUse) {
            console.log('[ChatPage] Marking chat as read for incoming message from other user (based on senderId).', chatIdToUse);
            markChatAsReadAPI(chatIdToUse).catch(err => console.warn('[ChatPage] Failed to mark chat as read on new message:', err));
        }
    }
  }, [chatIdToUse, currentUserEmail, participants, currentUserProfileIdForMarkAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect for initializing chat and fetching data
  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      setError(null);
      let currentChatIdFromParams: number | null = chatIdParam ? parseInt(chatIdParam) : null;
      let eventIdFromParams: number | null = eventIdParam ? parseInt(eventIdParam) : null;
      let associatedEventId: number | null = null; // Переменная для хранения ID события

      try {
        if (currentChatIdFromParams) { // Если перешли по /chats/:chatId
          setChatIdToUse(currentChatIdFromParams);
          setEventIdForNewChat(null);
          console.log(`[ChatPage initializeChat] Fetching chat details for chatId: ${currentChatIdFromParams}`);
          try {
              const details = await getChatDetailsAPI(currentChatIdFromParams);
              setChatDetails(details);
              associatedEventId = details.eventId; // Сохраняем eventId из деталей чата
          } catch (detailsError: any) {
              console.error("Failed to fetch chat details by ID:", detailsError);
              setError(detailsError.message || t('failed_to_load_chat_details') || 'Failed to load chat details.');
          }
        } else if (eventIdFromParams) { // Если перешли по /events/:eventId/chat
          setEventIdForNewChat(eventIdFromParams);
          associatedEventId = eventIdFromParams; // Сохраняем eventId из параметров
          const chat = await findChatByEventAPI(eventIdFromParams);
          if (chat) {
            setChatDetails(chat);
            setChatIdToUse(chat.id);
            setParticipants({}); // Сброс участников, так как chatId изменился
          } else {
            setChatDetails(null);
            setChatIdToUse(null);
            setMessages([]);
            setParticipants({});
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize chat:', err);
        setError(err.message || t('failed_to_load_chat_data') || 'Failed to load chat data.');
      } finally {
        // Устанавливаем eventIdForNewChat, если он был найден (для кнопки "К мероприятию")
        if (associatedEventId && !eventIdForNewChat) {
             setEventIdForNewChat(associatedEventId);
        }
        setLoading(false);
      }
    };

    if (getToken()) {
        initializeChat();
    } else {
        navigate('/login');
    }
  }, [chatIdParam, eventIdParam, t, navigate]);

  // Effect for fetching messages, participants, and marking chat as read ONCE chatIdToUse is set
  useEffect(() => {
    const fetchDataForChat = async () => {
        if (!chatIdToUse) return;

        try {
            // Загружаем детали, если их еще нет (важно для определения названия чата)
            if (!chatDetails) {
                try {
                    const details = await getChatDetailsAPI(chatIdToUse);
                    setChatDetails(details);
                    if (!eventIdForNewChat) setEventIdForNewChat(details.eventId); // Устанавливаем eventId для кнопки, если его нет
                } catch (detailsError) {
                    console.error("[ChatPage fetchDataForChat] Ошибка при повторной загрузке деталей чата:", detailsError);
                }
            }

            const [msgsData, participantsData] = await Promise.all([
                getChatMessagesAPI(chatIdToUse, 0, 50), // TODO: Implement pagination
                getChatParticipantsAPI(chatIdToUse),
            ]);
            
            // Убедимся, что сообщения являются массивом перед сортировкой
            const validMessages = Array.isArray(msgsData?.content) ? msgsData.content : [];
            setMessages(validMessages.sort((a,b) => {
              const timeA = isDate(new Date(a.timestamp)) ? new Date(a.timestamp).getTime() : 0;
              const timeB = isDate(new Date(b.timestamp)) ? new Date(b.timestamp).getTime() : 0;
              return timeA - timeB;
            }));
            
            const newParticipantsMap: Record<number, ProfileData> = {}; 
            if(Array.isArray(participantsData)) {
              participantsData.forEach(p => { 
                  if(p?.profileId) newParticipantsMap[p.profileId] = p; 
              });
            }
            setParticipants(newParticipantsMap);

            await markChatAsReadAPI(chatIdToUse);
        } catch (err: any) {
            console.error('Failed to load messages/participants:', err);
            setError(err.message || t('failed_to_load_chat_data') || 'Failed to load chat data.');
        }
    };

    if (chatIdToUse) {
        fetchDataForChat();
    } else {
        setMessages([]);
        setParticipants({});
    }
  }, [chatIdToUse, t, eventIdForNewChat]); 

   // Effect for WebSocket connection and subscription
   useEffect(() => {
    console.log('[ChatPage WS Effect] Running. chatIdToUse:', chatIdToUse, 'Token exists:', !!getToken());
    let isMounted = true; // Для предотвращения обновления состояния на размонтированном компоненте
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout | null = null;

    // Отключаем текущую подписку, если она есть, перед созданием новой
    if (subscriptionRef.current) {
        const { userSubId, topicSubId } = subscriptionRef.current;
        webSocketService.unsubscribe(userSubId);
        webSocketService.unsubscribe(topicSubId); 
        subscriptionRef.current = null;
        console.log('[ChatPage WS Effect] Unsubscribed from previous chat messages due to chatId change.');
    }

    if (chatIdToUse && getToken()) {
        console.log('[ChatPage WS Effect] Conditions met, attempting to connect WebSocket.');
        
        const connectAndSubscribe = async () => {
            try {
                await webSocketService.connect(); // Ждем установления соединения
                if (!isMounted) return; // Проверка после await

                console.log("[ChatPage WS Effect] WebSocket successfully connected (Promise resolved).");
                console.log("[ChatPage WS Effect] Subscribing to chat messages for chatId:", chatIdToUse);
                
                // Повторная проверка chatIdToUse и isMounted, так как состояние могло измениться
                if (chatIdToUse && isMounted) { 
                    const subIds = webSocketService.subscribeToChatMessages(chatIdToUse, handleNewMessageReceived);
                    if (isMounted) { // Еще одна проверка перед установкой ref
                       subscriptionRef.current = subIds;
                    }
                    if (subIds) {
                        console.log("[ChatPage WS Effect] Subscribed. UserSubId:", subIds.userSubId, "TopicSubId:", subIds.topicSubId);
                        retryCount = 0; // Сброс счетчика при успехе
                    } else {
                        console.warn("[ChatPage WS Effect] subscribeToChatMessages returned null.");
                        throw new Error('Failed to subscribe to chat messages');
                    }
                } else if (isMounted) {
                    console.warn("[ChatPage WS Effect] chatIdToUse became null or component unmounted before subscribing.");
                }
            } catch (err: any) {
                console.error("[ChatPage WS Effect] Error during WebSocket connect or subscribe:", err);
                if (isMounted) {
                    // Устанавливаем ошибку для UI, но не блокируем повторные попытки
                    // setError(err.message || t('websocket_connection_error') || 'Could not connect to chat server.');
                    
                    if (retryCount < maxRetries) {
                        retryCount++;
                        const delay = Math.min(1000 * (2 ** retryCount), 8000);
                        console.log(`[ChatPage WS Effect] Will retry connection in ${delay}ms (attempt ${retryCount} of ${maxRetries})`);
                        
                        if (retryTimeout) clearTimeout(retryTimeout);
                        retryTimeout = setTimeout(() => {
                            if (isMounted) {
                                console.log(`[ChatPage WS Effect] Retrying connection (attempt ${retryCount} of ${maxRetries})...`);
                                connectAndSubscribe();
                            }
                        }, delay);
                    } else {
                        console.error(`[ChatPage WS Effect] Gave up after ${maxRetries} connection attempts.`);
                        if (isMounted) {
                            setError(t('websocket_connection_failed_after_retries') || 'Failed to connect after multiple attempts. Try refreshing the page.');
                        }
                    }
                }
            }
        };

        connectAndSubscribe();
    }

    return () => {
        isMounted = false; // Устанавливаем в false при размонтировании
        
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        
        console.log('[ChatPage WS Effect] Cleanup function. subscriptionRef.current:', subscriptionRef.current);
        if (subscriptionRef.current) {
            const { userSubId, topicSubId } = subscriptionRef.current;
            webSocketService.unsubscribe(userSubId);
            webSocketService.unsubscribe(topicSubId); 
            subscriptionRef.current = null;
            console.log('[ChatPage WS Effect Cleanup] Unsubscribed from chat messages (user and topic).');
        }
    };
}, [chatIdToUse, handleNewMessageReceived, t]);

  // Эффект для определения названия чата
  useEffect(() => {
    if (chatDetails && currentUserProfileId !== null) {
      if (chatDetails.initiatorId === currentUserProfileId) {
        // Если текущий пользователь - инициатор, показываем название события
        setChatDisplayName(chatDetails.eventTitle || `${t('chat') || 'Chat'} #${chatDetails.id}`);
      } else {
        // Если текущий пользователь - не инициатор, показываем "Имя Фамилия (Название события)"
        setChatDisplayName(`${chatDetails.initiatorFirstName} ${chatDetails.initiatorLastName} (${chatDetails.eventTitle || `${t('chat') || 'Chat'} #${chatDetails.id}`})`);
      }
    } else if (chatDetails) { // Если нет currentUserProfileId, но есть детали чата
        setChatDisplayName(chatDetails.eventTitle || `${t('chat') || 'Chat'} #${chatDetails.id}`);
    } else if (chatIdToUse) { // Запасной вариант, если детали еще не загрузились
      setChatDisplayName(`${t('chat') || 'Chat'} #${chatIdToUse}`);
    } else if (eventIdForNewChat) { // Если это новый чат (еще не создан)
      // Можно попытаться получить название события асинхронно, но пока просто так
      setChatDisplayName(t('new_chat_for_event') || 'New Chat'); 
    } else { // Общий запасной вариант
      setChatDisplayName(t('chat_title_loading') || 'Loading chat...');
    }
    // Добавляем зависимости, от которых зависит имя чата
  }, [chatDetails, chatIdToUse, eventIdForNewChat, currentUserProfileId, t]); 


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserEmail) return;
    if (isSendingInitialMessage) return;

    const messageRequest: ChatMessageRequest = { content: newMessage };

    if (!chatIdToUse && eventIdForNewChat) { 
      setIsSendingInitialMessage(true);
      try {
        const initialMessageResponse = await sendInitialMessageAPI(eventIdForNewChat, messageRequest);
        setNewMessage('');
        setChatIdToUse(initialMessageResponse.chatId);
      } catch (err) {
        console.error('Failed to send initial message:', err);
        setError(t('failed_to_send_message') || 'Failed to send message.');
      } finally {
        setIsSendingInitialMessage(false);
      }
    } else if (chatIdToUse) { 
      try {
        webSocketService.sendMessage(chatIdToUse, messageRequest);
        setNewMessage('');
      } catch (err) {
        console.error('Failed to send message via WebSocket:', err);
        setError(t('failed_to_send_message') || 'Failed to send message.');
      }
    }
  };

  if (loading && !chatIdToUse && !eventIdForNewChat) { // Показываем загрузку, только если НЕТ chatId И НЕТ eventId для нового чата
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !chatIdToUse) { // Показываем ошибку только если чат НЕ загружен
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <IconButton 
          onClick={() => navigate(-1)} // Всегда назад
          sx={{ mt: 2 }}
        >
          <ArrowBackIcon />
          <Typography variant="button" sx={{ ml: 1 }}>{t('back')}</Typography>
        </IconButton>
      </Container>
    );
  }
  
  return (
    <ChatContainer>
        <Box sx={{ mb: 1, width: '100%' }}>
            {/* Используем Grid для размещения кнопок и заголовка */}
            <Grid container alignItems="center" justifyContent="flex-start" sx={{ minHeight: '40px' }} wrap="nowrap"> 
                {/* Левая часть: Кнопки Назад и К мероприятию */}
                <Grid item xs="auto" sx={{ display: 'flex', justifyContent: 'flex-start' }}> 
                    <IconButton
                        onClick={() => navigate(-1)} // Всегда возвращаемся назад по истории
                        aria-label={t('back') || 'Back'}
                    >
                        <ArrowBackIcon fontSize="medium" />
                    </IconButton>

                    {/* Кнопка "К мероприятию" (отображается условно) */}
                    {location.state?.from !== 'event' && (eventIdForNewChat) && (
                        <Tooltip title={t('go_to_event_button') || 'Go to Event'}>
                            <IconButton
                                onClick={() => navigate(`/events/${eventIdForNewChat}`)}
                                aria-label={t('go_to_event_button') || 'Go to Event'}
                                sx={{ ml: 1 }} // Небольшой отступ от кнопки "назад"
                            >
                                <EventIcon fontSize="medium" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Grid>

                {/* Центральная часть: Заголовок */}
                <Grid item xs sx={{ textAlign: 'center', overflow: 'hidden', minWidth: 0 }}> {/* xs занимает остальное место, overflow для textOverflow */}
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.2rem' }, 
                            letterSpacing: '0.5px',
                            width: '100%', 
                            textAlign: 'center',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {chatDisplayName}
                    </Typography>
                </Grid>
            </Grid>
        </Box>

      <MessagesPaper elevation={2}>
        {/* Отображение загрузки сообщений, если chatId есть, но сообщения еще не пришли */}
        {loading && chatIdToUse && messages.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2}}>
                <CircularProgress size={24} />
            </Box>
        )}
        {/* Отображение "Нет сообщений", если загрузка завершена, chatId есть, а сообщений нет */}
        {!loading && chatIdToUse && messages.length === 0 && (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', p: 2 }}>
            {t('no_messages_yet_in_chat')}
          </Typography>
        )}
        {/* Отображение "Введите сообщение", если это новый чат */}
        {!chatIdToUse && eventIdForNewChat && (
             <Typography sx={{ textAlign: 'center', color: 'text.secondary', p: 2 }}>
                 {t('enter_first_message') || 'Enter the first message to start the chat.'}
             </Typography>
        )}
        <List>
          {messages.map((msg) => {
            const senderProfile = participants[msg.senderId];
            const senderEmail = senderProfile?.email;
            const isSenderActive = senderProfile?.isActive ?? true;
            // Используем senderId для определения текущего пользователя
            const isCurrentUser = msg.senderId === currentUserProfileId;

            console.log(`[ChatPage MSG RENDER] MsgId: ${msg.id}, SenderId: ${msg.senderId}, CurrentUserId: ${currentUserProfileId}, IsCurrent: ${isCurrentUser}, IsSenderActive: ${isSenderActive}`);

            return (
              <ListItem 
                key={msg.id} 
                sx={{ 
                    display: 'flex', 
                    // Меняем направление в зависимости от isCurrentUser
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    mb: 1,
                    // Убираем выравнивание влево/вправо, пусть будет естественно
                    // justifyContent: isCurrentUser ? 'flex-end' : 'flex-start'
                }}
              >
                <ListItemAvatar sx={{ 
                    // Порядок не меняем, он всегда 1
                    minWidth: 'auto', 
                    // Отступ зависит от того, чье сообщение
                    [isCurrentUser ? 'marginLeft' : 'marginRight']: 1
                }}>
                  {/* Wrap Avatar in IconButton */}
                  <IconButton
                    onClick={() => {
                      if (msg.senderId === currentUserProfileId) {
                        navigate('/my-profile');
                      } else {
                        navigate(`/profile/${msg.senderId}`);
                      }
                    }}
                    size="small"
                    sx={{ p: 0 }} // Remove padding from IconButton
                  >
                    <Avatar 
                      alt={senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : 'User'} 
                      src={senderProfile?.avatarPresignedUrl ?? undefined}
                      sx={{ width: 32, height: 32, opacity: isSenderActive ? 1 : 0.7 }}
                    />
                  </IconButton>
                </ListItemAvatar>
                <Box sx={{ 
                    // Порядок не меняем, он всегда 2
                    maxWidth: '70%' // Ограничиваем максимальную ширину
                }}>
                    <Paper 
                        elevation={1} 
                        sx={{
                            p: 1, // Уменьшим паддинг
                            borderRadius: '10px',
                            // Цвет фона зависит от isCurrentUser
                            backgroundColor: isCurrentUser ? theme.palette.primary.light : (theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200]),
                            // Цвет текста зависит от isCurrentUser
                            color: isCurrentUser ? theme.palette.getContrastText(theme.palette.primary.light) : theme.palette.text.primary,
                        }}
                    >
                        {/* Не показываем имя отправителя для текущего пользователя */}
                        {!isCurrentUser && (
                            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold', mb: 0.5, display: 'flex', alignItems: 'center' }}>
                                {senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : (t('unknown_user') || 'Unknown User')}
                                {/* Иконка неактивности зависит от isSenderActive */} 
                                {!isSenderActive && (
                                    <Tooltip title={t('inactive_user') || 'Inactive User'}>
                                        <PersonOffIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7 }} />
                                    </Tooltip>
                                )}
                            </Typography>
                        )}
                        <Typography variant="body1" sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{msg.content}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, textAlign: 'right', fontSize: '0.65rem', 
                            // Цвет времени зависит от isCurrentUser
                            color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                            {isValid(new Date(msg.timestamp)) ? format(new Date(msg.timestamp), 'HH:mm') : t('invalid_time') || 'Invalid time'}
                        </Typography>
                    </Paper>
                </Box>
              </ListItem>
            );
          })}
          <div ref={messagesEndRef} />
        </List>
      </MessagesPaper>
      <MessageInputPaper elevation={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('type_message_placeholder') || 'Type a message...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (handleSendMessage(), e.preventDefault())}
          multiline
          maxRows={4}
          sx={{mr:1}}
          size="small" // Уменьшим поле ввода
        />
        <Fab color="primary" size="small" onClick={handleSendMessage} disabled={!newMessage.trim() || (!chatIdToUse && !eventIdForNewChat) || isSendingInitialMessage}>
          <SendIcon fontSize="small" />
        </Fab>
      </MessageInputPaper>
    </ChatContainer>
  );
};

export default ChatPage; 