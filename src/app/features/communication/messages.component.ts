import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, Conversation, Message } from '../../core/services/communication.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-page h-screen flex">
      <!-- Sidebar conversations -->
      <div class="conversations-sidebar w-80 border-r bg-white">
        <div class="p-4 border-b">
          <h2 class="text-xl font-bold">Messages</h2>
        </div>
        <div class="conversations-list overflow-y-auto" style="height: calc(100vh - 80px)">
          @for (conv of conversations(); track conv.id) {
            <div
              (click)="selectConversation(conv)"
              [class.bg-blue-50]="selectedConversation()?.id === conv.id"
              class="conversation-item p-4 border-b hover:bg-gray-50 cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="avatar w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  D
                </div>
                <div class="flex-1">
                  <div class="font-semibold">Developer</div>
                  <div class="text-sm text-gray-500 truncate">
                    {{ conv.last_message_at ? (conv.last_message_at | date:'short') : 'Pas de messages' }}
                  </div>
                </div>
                @if (conv.id === selectedConversation()?.id && isOnline()) {
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Zone messages -->
      <div class="messages-area flex-1 flex flex-col bg-gray-50">
        @if (selectedConversation()) {
          <!-- Header conversation -->
          <div class="header p-4 border-b bg-white flex items-center gap-3">
            <div class="avatar w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              D
            </div>
            <div>
              <div class="font-semibold">Developer Support</div>
              <div class="text-sm text-gray-500">
                @if (isOnline()) {
                  <span class="text-green-600">● En ligne</span>
                } @else {
                  <span class="text-gray-400">○ Hors ligne</span>
                }
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-content flex-1 overflow-y-auto p-4">
            @for (msg of messages(); track msg.id) {
              <div class="message mb-4" [class.text-right]="msg.sender_type === 'Admin'">
                <div
                  class="inline-block max-w-md px-4 py-2 rounded-lg"
                  [class.bg-blue-600]="msg.sender_type === 'Admin'"
                  [class.text-white]="msg.sender_type === 'Admin'"
                  [class.bg-white]="msg.sender_type === 'Developer'"
                  [class.border]="msg.sender_type === 'Developer'">
                  <div>{{ msg.content }}</div>
                  <div class="text-xs mt-1 opacity-75">
                    {{ msg.created_at | date:'short' }}
                    @if (msg.sender_type === 'Admin') {
                      <span class="ml-2">
                        @if (msg.status === 'Read') {
                          ✓✓
                        } @else if (msg.status === 'Delivered') {
                          ✓
                        }
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
            @if (isTyping()) {
              <div class="typing-indicator text-gray-500 text-sm">
                Developer est en train d'écrire...
              </div>
            }
          </div>

          <!-- Input message -->
          <div class="input-area p-4 border-t bg-white">
            <form (ngSubmit)="sendMessage()" class="flex gap-2">
              <input
                [(ngModel)]="messageText"
                name="message"
                (input)="onTyping()"
                placeholder="Tapez votre message..."
                class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <button
                type="submit"
                [disabled]="!messageText.trim()"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Envoyer
              </button>
            </form>
          </div>
        } @else {
          <div class="flex items-center justify-center h-full text-gray-400">
            Sélectionnez une conversation
          </div>
        }
      </div>
    </div>
  `
})
export class MessagesComponent implements OnInit, OnDestroy {
  private commService = inject(CommunicationService);

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);
  messageText = '';
  isTyping = signal(false);
  isOnline = signal(false);

  private typingTimeout: any;

  ngOnInit() {
    // Load conversations
    this.commService.getConversations().subscribe(convs => {
      this.conversations.set(convs);
      if (convs.length > 0) {
        this.selectConversation(convs[0]);
      }
    });

    // Connect WebSocket (assuming admin with ID from auth)
    const adminId = 'current-admin-id'; // Get from auth service
    this.commService.connectWebSocket('Admin', adminId);
    this.isOnline.set(this.commService.isConnected());

    // Listen to WebSocket messages
    this.commService.websocketMessages$.subscribe(wsMsg => {
      if (wsMsg.type === 'new_message') {
        this.loadMessages();
      } else if (wsMsg.type === 'typing') {
        this.isTyping.set(wsMsg.data.is_typing);
      } else if (wsMsg.type === 'read_receipt') {
        // Update message status
        this.messages.update(msgs =>
          msgs.map(m => m.id === wsMsg.data.message_id ? { ...m, status: 'Read' } : m)
        );
      }
    });
  }

  ngOnDestroy() {
    this.commService.disconnectWebSocket();
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.loadMessages();
  }

  loadMessages() {
    const conv = this.selectedConversation();
    if (conv) {
      this.commService.getConversationMessages(conv.id).subscribe(msgs => {
        this.messages.set(msgs);
        // Mark unread messages as read
        msgs.filter(m => m.recipient_type === 'Admin' && m.status !== 'Read')
          .forEach(m => this.commService.markMessageAsRead(m.id).subscribe());
      });
    }
  }

  sendMessage() {
    const conv = this.selectedConversation();
    if (!this.messageText.trim() || !conv) return;

    const message: Partial<Message> = {
      conversation_id: conv.id,
      sender_type: 'Admin',
      sender_id: 'current-admin-id', // Get from auth
      recipient_type: 'Developer',
      recipient_id: conv.developer_id,
      content: this.messageText
    };

    this.commService.sendMessage(message).subscribe(() => {
      this.messageText = '';
      this.loadMessages();
    });
  }

  onTyping() {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.commService.sendTypingIndicator('Developer', conv.developer_id, true);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.commService.sendTypingIndicator('Developer', conv.developer_id, false);
    }, 1000);
  }
}
