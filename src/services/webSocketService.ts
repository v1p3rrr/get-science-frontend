import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken, getUsername } from './auth'; // Используем getUsername
import { ChatMessageResponse, ChatMessageRequest } from '../models/Models'; // Обновленный импорт

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080/ws/chat';
// const WEBSOCKET_URL = 'ws://localhost:8080/ws/chat'; // Hardcoded for simplicity if .env is not set up

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private onConnectedCallbackInternal: (() => void) | null = null; // Для хранения колбэка из ChatPage
  private isConnecting: boolean = false; // Флаг, что идет процесс подключения
  private isConnectionEstablished: boolean = false; // Флаг реального соединения
  private connectionPromise: Promise<void> | null = null; // Промис текущего соединения
  private resolveConnectionPromise: (() => void) | null = null; // Резолвер промиса соединения
  private rejectConnectionPromise: ((reason?: any) => void) | null = null; // Реджектор промиса соединения
  private connectionTimeoutId: NodeJS.Timeout | null = null; // Таймаут соединения
  private intentionalDisconnect: boolean = false; // Флаг намеренного отключения
  private reconnectAttempts: number = 0; // Счетчик попыток переподключения
  private maxReconnectAttempts: number = 5; // Максимальное количество попыток переподключения
  private reconnectTimeoutId: NodeJS.Timeout | null = null; // Таймаут переподключения

  private createClient(): Client {
    console.log('[WS createClient] Creating new STOMP client instance.');
    return new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL.replace('ws:', 'http:').replace('wss:', 'https:')),
      // Используем http/https для SockJS, он сам проапгрейдит до ws/wss
      // brokerURL: WEBSOCKET_URL, // If native WebSocket
      connectHeaders: {
        // Authorization: `Bearer ${getToken()}` (if needed)
      },
      debug: (str) => {
        console.log('[WS_DEBUG]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => { 
        console.log('[WS onConnect] Successfully connected (STOMP client confirmed).');
        this.isConnecting = false;
        
        // Очищаем таймер таймаута, так как соединение установлено
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        
        // Сбрасываем счетчик попыток при успешном подключении
        this.reconnectAttempts = 0;
        
        // Важно: Добавляем небольшую задержку после onConnect,
        // чтобы убедиться, что всё действительно инициализировано
        setTimeout(() => {
          this.isConnectionEstablished = true; // Устанавливаем флаг реального соединения
          if (this.resolveConnectionPromise) {
            console.log('[WS onConnect] Resolving connection promise.');
            this.resolveConnectionPromise();
          }
        }, 200); // Небольшая задержка для уверенности
      },
      onDisconnect: () => {
        console.log('[WS onDisconnect] STOMP client disconnected.');
        this.isConnecting = false; 
        this.isConnectionEstablished = false;
        
        // Автоматическое переподключение при неожиданном разрыве
        if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
          console.log(`[WS onDisconnect] Автоматическое переподключение через ${delay}ms (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
          }
          
          this.reconnectTimeoutId = setTimeout(() => {
            console.log('[WS onDisconnect] Попытка автоматического переподключения...');
            this.connect(() => {
              console.log('[WS onDisconnect] Переподключение успешно');
            }).catch(err => {
              console.error('[WS onDisconnect] Ошибка при попытке автоматического переподключения:', err);
            });
          }, delay);
        }
        
        this.intentionalDisconnect = false;
      },
      onStompError: (frame) => {
        console.error('[WS onStompError] Broker reported error: ' + frame.headers['message']);
        console.error('[WS onStompError] Additional details: ' + frame.body);
        this.isConnecting = false;
        if (this.rejectConnectionPromise) {
          console.log('[WS onStompError] Rejecting connection promise due to STOMP error.');
          this.rejectConnectionPromise(frame.headers['message'] || 'STOMP error');
        }
      },
    });
  }

  connect(onConnectedCallback?: (() => void)): Promise<void> {
    // Проверяем не только active, но и наш собственный флаг
    if (this.client && this.client.active && this.isConnectionEstablished) {
      console.log('[WS connect] Already connected and active.');
      if (onConnectedCallback) {
        onConnectedCallback();
      }
      return Promise.resolve();
    }
    
    // Если клиент существует, но флаг соединения не установлен,
    // возможно, соединение в "подвешенном" состоянии. Пересоздаем клиент.
    if (this.client && this.client.active && !this.isConnectionEstablished) {
      console.log('[WS connect] Client active but connection not fully established. Resetting client.');
      try {
        // Устанавливаем флаг намеренного отключения перед деактивацией
        this.intentionalDisconnect = true;
        this.client.deactivate();
      } catch (e) {
        console.warn('[WS connect] Error deactivating "zombie" client:', e);
        // Сбрасываем флаг в случае ошибки
        this.intentionalDisconnect = false;
      }
      this.client = null; // Создадим новый клиент
      this.subscriptions.clear(); // Очищаем старые подписки
    }
    
    // Если попытка соединения уже в процессе, возвращаем существующий промис
    if (this.isConnecting && this.connectionPromise) {
        console.log('[WS connect] Connection attempt already in progress. Returning existing promise.');
        return this.connectionPromise;
    }

    const token = getToken();
    if (!token) {
      console.error('[WS connect] No token found, cannot connect.');
      return Promise.reject(new Error('No token for WebSocket connection.'));
    }

    if (!this.client) {
        console.log('[WS connect] Client is null, creating new instance.');
        this.client = this.createClient();
    } 
    
    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
        this.resolveConnectionPromise = resolve;
        this.rejectConnectionPromise = reject;

        if (!this.client) { 
             this.isConnecting = false;
             this.isConnectionEstablished = false;
             this.rejectConnectionPromise = null; 
             this.resolveConnectionPromise = null; 
             return reject(new Error("WebSocket client not initialized unexpectedly."));
        }
      
        // Настраиваем обработчики для текущего соединения
        const client = this.client; // Для замыкания
        
        // Переопределяем onConnect для текущего соединения
        client.onConnect = (frame) => {
          console.log('[WS connect] Connected via Promise', frame);
          this.isConnecting = false;
          
          // Очищаем таймер таймаута
          if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
          }
          
          // Сбрасываем счетчик попыток
          this.reconnectAttempts = 0;
          
          // Важно: Добавляем небольшую задержку после onConnect,
          // чтобы убедиться, что всё действительно инициализировано
          setTimeout(() => {
            this.isConnectionEstablished = true; // Устанавливаем флаг реального соединения
            
            if (onConnectedCallback) {
              console.log('[WS connect] Executing callback');
              onConnectedCallback();
            }
            
            if (this.resolveConnectionPromise) {
              this.resolveConnectionPromise();
            }
            
            // Очищаем обработчики промиса после использования
            this.connectionPromise = null; 
            this.resolveConnectionPromise = null;
            this.rejectConnectionPromise = null;
          }, 200); // Небольшая задержка для уверенности
        };
        
        client.configure({
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });
      
        console.log('[WS connect] Activating client...');
        client.activate();
        
        // Добавляем таймаут для подключения - увеличиваем до 30 секунд
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }
        
        this.connectionTimeoutId = setTimeout(() => {
          if (this.isConnecting && this.rejectConnectionPromise) {
            console.error('[WS connect] Connection attempt timed out after 30 seconds.');
            this.rejectConnectionPromise(new Error('WebSocket connection timeout'));
            this.isConnecting = false;
            this.connectionPromise = null;
            this.resolveConnectionPromise = null;
            this.rejectConnectionPromise = null;
            
            // Попытка сбросить клиент
            if (this.client) {
              try {
                this.intentionalDisconnect = true; // Устанавливаем флаг намеренного отключения
                this.client.deactivate();
              } catch (e) { 
                console.warn('[WS connect] Error deactivating client after timeout:', e);
                this.intentionalDisconnect = false;
              }
              this.client = null;
            }
            
            // Запускаем автоматическое переподключение, если не превысили лимит попыток
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
                console.log(`[WS connect] Автоматическое переподключение через ${delay}ms (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                if (this.reconnectTimeoutId) {
                    clearTimeout(this.reconnectTimeoutId);
                }
                
                this.reconnectTimeoutId = setTimeout(() => {
                    console.log('[WS connect] Попытка автоматического переподключения после таймаута...');
                    this.connect(onConnectedCallback).catch(err => {
                        console.error('[WS connect] Ошибка при попытке автоматического переподключения:', err);
                    });
                }, delay);
            } else {
                console.warn('[WS connect] Достигнут лимит попыток переподключения.');
                // Сбрасываем счетчик для будущих попыток, инициированных пользователем
                this.reconnectAttempts = 0;
            }
          }
        }, 30000); // 30 секунд таймаут вместо 10
    });
    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.client && this.client.active) {
      this.client.deactivate().catch(err => console.warn("[WS] Error during deactivate:", err));
      console.log('[WS] Deactivated');
    } else {
      console.log('[WS] Client not active or already null, no need to deactivate.');
    }
    this.subscriptions.clear(); // Очищаем подписки при явном дисконнекте
    // Не очищаем onConnectedCallbackInternal здесь, он нужен для реконнекта
    // this.client = null; // Не обнуляем клиент полностью, если планируем реконнект через activate
  }

  // Новый метод для обработки обновления токена
  handleTokenRefreshed(): void {
    console.log('[WS handleTokenRefreshed] Token refreshed, attempting to reconnect WebSocket.');
    
    // Если уже идет подключение, не вмешиваемся
    if (this.isConnecting) {
        console.warn('[WS handleTokenRefreshed] Token refresh requested while connection attempt is in progress. Current attempt will proceed or fail.');
        return;
    }
    
    // Очищаем таймеры перед обновлением соединения
    if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
    }
    
    if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
    }
    
    // Сбрасываем счетчик попыток - началось новое подключение с новым токеном
    this.reconnectAttempts = 0;
    
    if (this.client) {
      // Устанавливаем флаг намеренного отключения
      this.intentionalDisconnect = true;
      
      if (this.client.active) {
        console.log('[WS handleTokenRefreshed] Deactivating existing active client before applying new token configuration.');
        this.client.deactivate()
          .then(() => {
            console.log('[WS handleTokenRefreshed] Client deactivated successfully.');
            this.intentionalDisconnect = false; // Сбрасываем флаг после успешной деактивации
            // После деактивации пробуем создать новое соединение
            this.client = null;
            this.isConnectionEstablished = false;
            this.connect(() => console.log('[WS handleTokenRefreshed] Reconnected with new token.'));
          })
          .catch(err => {
            console.error('[WS handleTokenRefreshed] Error deactivating client, proceeding with token configuration change:', err);
            this.intentionalDisconnect = false; // Сбрасываем флаг в случае ошибки
            // Даже при ошибке пробуем создать новое соединение
            this.client = null;
            this.isConnectionEstablished = false;
            this.connect(() => console.log('[WS handleTokenRefreshed] Reconnected with new token after deactivation error.'));
          });
      } else {
        console.log('[WS handleTokenRefreshed] Client was not active. Creating new connection with new token.');
        this.intentionalDisconnect = false;
        this.client = null;
        this.isConnectionEstablished = false;
        this.connect(() => console.log('[WS handleTokenRefreshed] Connected with new token.'));
      }
    } else {
      console.warn('[WS handleTokenRefreshed] Client not initialized. Next connect() will create it with new token if available.');
      // Просто пытаемся подключиться, если клиент не инициализирован
      this.connect(() => console.log('[WS handleTokenRefreshed] Connected with new token.'));
    }
  }

  subscribeToChatMessages(
    chatId: number,
    onMessageReceived: (message: ChatMessageResponse) => void
  ): { userSubId: string; topicSubId: string } | null { // Возвращаем объект с ID подписок
    if (!this.client || !this.client.active) {
      console.error('[WS subscribe] Cannot subscribe, client not connected or not active. Client state:', this.client);
      return null;
    }
    const username = getUsername();
    if (!username) {
      console.error('[WS] Username (email) not found in token, cannot subscribe to user-specific queue.');
      return null; 
    }

    const userSpecificDestination = `/user/${username}/queue/chat/${chatId}/messages`;
    const generalTopicDestination = `/topic/chat/${chatId}/messages`;
    let userSubId = userSpecificDestination; // Используем сам destination как ID, если подписка уже есть
    let topicSubId = generalTopicDestination;

    // Подписка на user-specific очередь
    if (this.subscriptions.has(userSpecificDestination)) {
        console.warn(`[WS] Already subscribed to ${userSpecificDestination}`);
    } else {
        console.log(`[WS subscribe] Subscribing to USER-SPECIFIC destination: ${userSpecificDestination}`);
        const userSub = this.client.subscribe(userSpecificDestination, (message: IMessage) => {
          try {
            console.log(`[WS] Message received on USER-SPECIFIC destination ${userSpecificDestination}:`, message.body);
            const parsedMessage: ChatMessageResponse = JSON.parse(message.body); 
            onMessageReceived(parsedMessage);
          } catch (e) {
            console.error('[WS] Error parsing message body on user-specific sub', e, message.body);
          }
        });
        this.subscriptions.set(userSpecificDestination, userSub);
        // userSubId = userSub.id; // STOMPJS v5+ .id может быть не всегда тем, что нам нужно для unsubscribe по destination.
                                 // Будем использовать сам destination как ключ в нашей карте subscriptions.
    }

    // Подписка на общий топик (для отладки)
    if (this.subscriptions.has(generalTopicDestination)) {
        console.warn(`[WS] Already subscribed to ${generalTopicDestination}`);
    } else {
        console.log(`[WS subscribe] Subscribing to GENERAL TOPIC destination: ${generalTopicDestination}`);
        const topicSub = this.client.subscribe(generalTopicDestination, (message: IMessage) => {
          try {
            console.log(`[WS] Message received on GENERAL TOPIC ${generalTopicDestination}:`, message.body);
            const parsedMessage: ChatMessageResponse = JSON.parse(message.body); 
            onMessageReceived(parsedMessage); 
          } catch (e) {
            console.error('[WS] Error parsing message body on general topic sub', e, message.body);
          }
        });
        this.subscriptions.set(generalTopicDestination, topicSub);
        // topicSubId = topicSub.id;
    }
    
    return { userSubId: userSpecificDestination, topicSubId: generalTopicDestination };
  }

  unsubscribe(destination: string): void {
    if (!this.client) { // Добавим проверку на null
        console.warn(`[WS unsubscribe] Client is null, cannot unsubscribe from ${destination}`);
        return;
    }
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe(); // Вызываем метод unsubscribe у объекта подписки STOMP
      this.subscriptions.delete(destination); // Удаляем из нашей карты
      console.log(`[WS] Unsubscribed from ${destination}`);
    } else {
      console.warn(`[WS] No subscription found for ${destination} to unsubscribe.`);
    }
  }

  // Новый метод для отписки от нескольких адресов
  unsubscribeAll(destinations: string[]): void {
    destinations.forEach(dest => this.unsubscribe(dest));
  }

  sendMessage(chatId: number, messageRequest: ChatMessageRequest): void { // Обновленный тип
    if (!this.client || !this.client.active) {
      console.error('[WS] Cannot send message, client not connected.');
      return;
    }
    const destination = `/app/chat/${chatId}/sendMessage`;
    try {
        this.client.publish({
            destination,
            body: JSON.stringify(messageRequest),
        });
        console.log(`[WS] Message sent to ${destination}`, messageRequest);
    } catch (error) {
        console.error("[WS] Error publishing message:", error);
    }
  }
}

export const webSocketService = new WebSocketService(); 