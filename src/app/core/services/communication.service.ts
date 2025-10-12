import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';

// ==================== INTERFACES ====================

export interface Conversation {
  id: string;
  admin_id: string;
  developer_id: string;
  last_message_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'Developer' | 'Admin';
  sender_id: string;
  recipient_type: 'Developer' | 'Admin';
  recipient_id: string;
  content: string;
  status: 'Sent' | 'Delivered' | 'Read';
  created_at: string;
  read_at?: string;
}

export interface Notification {
  id: string;
  enterprise_id?: string;
  recipient_type: 'Developer' | 'Admin' | 'User';
  recipient_id?: string;
  title: string;
  content: string;
  type?: string;
  priority: 'Info' | 'Warning' | 'Critical';
  status: 'Unread' | 'Read' | 'Archived';
  resource_type?: string;
  resource_id?: string;
  created_at: string;
  read_at?: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private api = inject(ApiService);
  private readonly baseUrl = '/communication';

  // WebSocket connection
  private ws: WebSocket | null = null;
  private wsMessages$ = new Subject<WebSocketMessage>();

  // Reactive state
  readonly isConnected = signal(false);
  readonly unreadCount = signal(0);

  // ==================== CONVERSATIONS ====================

  getConversations(): Observable<Conversation[]> {
    return this.api.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  getConversation(id: string): Observable<Conversation> {
    return this.api.get<Conversation>(`${this.baseUrl}/conversations/${id}`);
  }

  createConversation(adminId: string, developerId: string): Observable<Conversation> {
    return this.api.post<Conversation>(`${this.baseUrl}/conversations`, {
      admin_id: adminId,
      developer_id: developerId
    });
  }

  // ==================== MESSAGES ====================

  getConversationMessages(conversationId: string): Observable<Message[]> {
    return this.api.get<Message[]>(`${this.baseUrl}/messages/conversation/${conversationId}`);
  }

  getMessage(id: string): Observable<Message> {
    return this.api.get<Message>(`${this.baseUrl}/messages/${id}`);
  }

  sendMessage(message: Partial<Message>): Observable<Message> {
    return this.api.post<Message>(`${this.baseUrl}/messages`, message);
  }

  markMessageAsRead(id: string): Observable<Message> {
    return this.api.put<Message>(`${this.baseUrl}/messages/${id}`, {
      status: 'Read'
    });
  }

  // ==================== NOTIFICATIONS ====================

  getNotifications(status?: string, type?: string): Observable<Notification[]> {
    const params: any = {};
    if (status) params.status_filter = status;
    if (type) params.type_filter = type;
    return this.api.get<Notification[]>(`${this.baseUrl}/notifications`, params);
  }

  getNotification(id: string): Observable<Notification> {
    return this.api.get<Notification>(`${this.baseUrl}/notifications/${id}`);
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.api.post<Notification>(`${this.baseUrl}/notifications`, notification);
  }

  markNotificationAsRead(id: string): Observable<Notification> {
    return this.api.put<Notification>(`${this.baseUrl}/notifications/${id}`, {
      status: 'Read'
    });
  }

  markNotificationAsArchived(id: string): Observable<Notification> {
    return this.api.put<Notification>(`${this.baseUrl}/notifications/${id}`, {
      status: 'Archived'
    });
  }

  deleteNotification(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/notifications/${id}`);
  }

  markAllNotificationsAsRead(): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.baseUrl}/notifications/mark-all-read`, {});
  }

  // ==================== WEBSOCKET ====================

  /**
   * Connect to WebSocket for real-time communication
   * @param userType User type (Admin, Developer, User)
   * @param userId User ID
   */
  connectWebSocket(userType: 'Admin' | 'Developer' | 'User', userId: string): void {
    if (this.ws) {
      this.disconnectWebSocket();
    }

    // Get base WebSocket URL from current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '8000'; // Default to API port
    const wsUrl = `${protocol}//${host}:${port}${this.baseUrl}/ws/${userType}/${userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected.set(true);
    };

    this.ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.wsMessages$.next(message);

      // Update unread count for new messages/notifications
      if (message.type === 'new_message' || message.type === 'notification') {
        this.unreadCount.update(count => count + 1);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected.set(false);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected.set(false);
    }
  }

  /**
   * Send WebSocket message
   */
  sendWebSocketMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  /**
   * Subscribe to WebSocket messages
   */
  get websocketMessages$(): Observable<WebSocketMessage> {
    return this.wsMessages$.asObservable();
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(recipientType: 'Admin' | 'Developer', recipientId: string, isTyping: boolean): void {
    this.sendWebSocketMessage({
      type: 'typing',
      data: {
        recipient_type: recipientType,
        recipient_id: recipientId,
        is_typing: isTyping
      }
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: string, recipientType: 'Admin' | 'Developer', recipientId: string): void {
    this.sendWebSocketMessage({
      type: 'read_receipt',
      data: {
        message_id: messageId,
        recipient_type: recipientType,
        recipient_id: recipientId
      }
    });
  }

  /**
   * Update unread count (call after fetching notifications)
   */
  updateUnreadCount(count: number): void {
    this.unreadCount.set(count);
  }
}
