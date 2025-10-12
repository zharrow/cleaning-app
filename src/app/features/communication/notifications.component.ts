import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunicationService, Notification } from '../../core/services/communication.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page p-6">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Notifications</h1>
        <button
          (click)="markAllAsRead()"
          [disabled]="unreadCount() === 0"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          Tout marquer comme lu
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les statuts</option>
          <option value="Unread">Non lues</option>
          <option value="Read">Lues</option>
          <option value="Archived">Archivées</option>
        </select>
        <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les types</option>
          <option value="HACCP">HACCP</option>
          <option value="Task">Tâches</option>
          <option value="Message">Messages</option>
          <option value="System">Système</option>
        </select>
        <select [(ngModel)]="priorityFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Toutes priorités</option>
          <option value="Critical">Critique</option>
          <option value="Warning">Avertissement</option>
          <option value="Info">Info</option>
        </select>
      </div>

      <!-- Liste notifications -->
      <div class="notifications-list space-y-3">
        @for (notif of filteredNotifications(); track notif.id) {
          <div
            class="notification-card p-4 rounded-lg border-l-4 transition-all"
            [class.bg-white]="notif.status !== 'Unread'"
            [class.bg-blue-50]="notif.status === 'Unread'"
            [class.border-red-500]="notif.priority === 'Critical'"
            [class.border-orange-500]="notif.priority === 'Warning'"
            [class.border-blue-500]="notif.priority === 'Info'">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="icon text-2xl">
                @if (notif.type === 'HACCP') {
                  🍽️
                } @else if (notif.type === 'Task') {
                  ✅
                } @else if (notif.type === 'Message') {
                  💬
                } @else {
                  🔔
                }
              </div>

              <!-- Content -->
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <h3 class="font-semibold" [class.font-bold]="notif.status === 'Unread'">
                    {{ notif.title }}
                  </h3>
                  <span class="text-xs text-gray-500">{{ notif.created_at | date:'short' }}</span>
                </div>
                <p class="text-gray-700 mt-1">{{ notif.content }}</p>

                <!-- Priority badge -->
                <div class="mt-2">
                  <span
                    class="inline-block px-2 py-1 text-xs rounded"
                    [class.bg-red-100]="notif.priority === 'Critical'"
                    [class.text-red-700]="notif.priority === 'Critical'"
                    [class.bg-orange-100]="notif.priority === 'Warning'"
                    [class.text-orange-700]="notif.priority === 'Warning'"
                    [class.bg-blue-100]="notif.priority === 'Info'"
                    [class.text-blue-700]="notif.priority === 'Info'">
                    {{ getPriorityLabel(notif.priority) }}
                  </span>
                  @if (notif.type) {
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded ml-2">
                      {{ notif.type }}
                    </span>
                  }
                </div>

                <!-- Actions -->
                <div class="actions flex gap-3 mt-3">
                  @if (notif.status === 'Unread') {
                    <button (click)="markAsRead(notif)" class="text-sm text-blue-600 hover:underline">
                      Marquer comme lu
                    </button>
                  }
                  @if (notif.status !== 'Archived') {
                    <button (click)="archive(notif)" class="text-sm text-gray-600 hover:underline">
                      Archiver
                    </button>
                  }
                  <button (click)="deleteNotif(notif)" class="text-sm text-red-600 hover:underline">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl mb-2">🔔</div>
            <p>Aucune notification</p>
          </div>
        }
      </div>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  private commService = inject(CommunicationService);

  notifications = signal<Notification[]>([]);
  filteredNotifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  statusFilter = '';
  typeFilter = '';
  priorityFilter = '';

  ngOnInit() {
    this.loadNotifications();

    // Listen to WebSocket for real-time notifications
    this.commService.websocketMessages$.subscribe(wsMsg => {
      if (wsMsg.type === 'notification') {
        this.loadNotifications();
      }
    });
  }

  loadNotifications() {
    this.commService.getNotifications().subscribe(notifs => {
      this.notifications.set(notifs);
      this.unreadCount.set(notifs.filter(n => n.status === 'Unread').length);
      this.commService.updateUnreadCount(this.unreadCount());
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.notifications();

    if (this.statusFilter) {
      filtered = filtered.filter(n => n.status === this.statusFilter);
    }

    if (this.typeFilter) {
      filtered = filtered.filter(n => n.type === this.typeFilter);
    }

    if (this.priorityFilter) {
      filtered = filtered.filter(n => n.priority === this.priorityFilter);
    }

    this.filteredNotifications.set(filtered);
  }

  markAsRead(notif: Notification) {
    this.commService.markNotificationAsRead(notif.id).subscribe(() => {
      this.loadNotifications();
    });
  }

  archive(notif: Notification) {
    this.commService.markNotificationAsArchived(notif.id).subscribe(() => {
      this.loadNotifications();
    });
  }

  deleteNotif(notif: Notification) {
    if (confirm('Supprimer cette notification ?')) {
      this.commService.deleteNotification(notif.id).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  markAllAsRead() {
    this.commService.markAllNotificationsAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'Critical': 'Critique',
      'Warning': 'Avertissement',
      'Info': 'Information'
    };
    return labels[priority] || priority;
  }
}
