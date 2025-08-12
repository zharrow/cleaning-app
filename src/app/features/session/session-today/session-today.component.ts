
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SessionService, CleaningLog } from '../session.service';
import { TaskService } from '../../tasks/task.service';
import { LucideAngularModule, CheckCircle, Clock, X, Camera, Plus } from 'lucide-angular';

@Component({
  selector: 'app-session-today',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar></app-navbar>
      
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Session de nettoyage</h1>
              <p class="text-gray-600 mt-1">{{ todayDate }}</p>
            </div>
            <div class="flex items-center gap-4">
              <span [class]="getStatusBadgeClass()" class="px-3 py-1 rounded-full text-sm font-medium">
                {{ getStatusText() }}
              </span>
              <button
                (click)="completeSession()"
                [disabled]="!canCompleteSession()"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Terminer la session
              </button>
            </div>
          </div>
        </div>

        <!-- Progression -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Progression</span>
            <span class="text-sm text-gray-600">
              {{ completedCount() }} / {{ totalTasks() }} tâches
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              [style.width.%]="progressPercentage()"
              class="bg-primary-600 h-2 rounded-full transition-all duration-500"
            ></div>
          </div>
        </div>

        <!-- Liste des tâches par pièce -->
        <div class="space-y-6">
          @for (room of taskService.rooms(); track room.id) {
            @if (getTasksForRoom(room.id).length > 0) {
              <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="bg-gray-50 px-6 py-3 border-b">
                  <h2 class="font-semibold text-gray-900">{{ room.name }}</h2>
                  @if (room.description) {
                    <p class="text-sm text-gray-600">{{ room.description }}</p>
                  }
                </div>
                
                <div class="divide-y">
                  @for (task of getTasksForRoom(room.id); track task.id) {
                    <div class="p-6 hover:bg-gray-50 transition-colors">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h3 class="font-medium text-gray-900">
                            {{ task.task_template.name }}
                          </h3>
                          @if (task.task_template.description) {
                            <p class="text-sm text-gray-600 mt-1">
                              {{ task.task_template.description }}
                            </p>
                          }
                          <div class="flex items-center gap-4 mt-2">
                            <span class="text-sm text-gray-500">
                              Assigné à: {{ task.default_performer.name }}
                            </span>
                            @if (task.suggested_time) {
                              <span class="text-sm text-gray-500">
                                Heure suggérée: {{ task.suggested_time }}
                              </span>
                            }
                          </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex items-center gap-2 ml-4">
                          @if (getLogForTask(task.id)) {
                            <span [class]="getLogStatusClass(getLogForTask(task.id)!.status)" 
                                  class="px-2 py-1 rounded text-xs font-medium">
                              {{ getLogStatusText(getLogForTask(task.id)!.status) }}
                            </span>
                          } @else {
                            <button
                              (click)="markTaskComplete(task)"
                              class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marquer comme fait"
                            >
                              <lucide-icon name="check-circle" [size]="20"></lucide-icon>
                            </button>
                            <button
                              (click)="markTaskPartial(task)"
                              class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Marquer comme partiel"
                            >
                              <lucide-icon name="clock" [size]="20"></lucide-icon>
                            </button>
                            <button
                              (click)="markTaskPostponed(task)"
                              class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reporter"
                            >
                              <lucide-icon name="x" [size]="20"></lucide-icon>
                            </button>
                          }
                        </div>
                      </div>
                      
                      <!-- Log existant -->
                      @if (getLogForTask(task.id); as log) {
                        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-sm text-gray-600">
                                Réalisé par: {{ task.default_performer.name }}
                              </p>
                              @if (log.notes) {
                                <p class="text-sm text-gray-700 mt-1">{{ log.notes }}</p>
                              }
                            </div>
                            <span class="text-xs text-gray-500">
                              {{ formatTime(log.timestamp) }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class SessionTodayComponent implements OnInit {
  sessionService = inject(SessionService);
  taskService = inject(TaskService);
  
  // Computed signals
  completedCount = computed(() => {
    const logs = this.sessionService.sessionLogs();
    return logs.filter(l => l.status === 'fait').length;
  });
  
  totalTasks = computed(() => this.taskService.assignedTasks().length);
  
  progressPercentage = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });
  
  canCompleteSession = computed(() => {
    const session = this.sessionService.currentSession();
    return session && session.status === 'en_cours' && this.completedCount() > 0;
  });
  
  todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  async ngOnInit() {
    await this.loadSessionData();
  }
  
  private async loadSessionData() {
    const session = await this.sessionService.getTodaySession();
    if (session) {
      await this.sessionService.getSessionLogs(session.id);
    }
    await this.taskService.loadAllData();
  }
  
  getTasksForRoom(roomId: string) {
    return this.taskService.assignedTasks().filter(t => t.room.id === roomId);
  }
  
  getLogForTask(taskId: string): CleaningLog | undefined {
    return this.sessionService.sessionLogs().find(l => l.assigned_task_id === taskId);
  }
  
  async markTaskComplete(task: any) {
    await this.createLog(task, 'fait');
  }
  
  async markTaskPartial(task: any) {
    await this.createLog(task, 'partiel');
  }
  
  async markTaskPostponed(task: any) {
    await this.createLog(task, 'reporte');
  }
  
  private async createLog(task: any, status: CleaningLog['status']) {
    const session = this.sessionService.currentSession();
    if (!session) return;
    
    await this.sessionService.createLog({
      session_id: session.id,
      assigned_task_id: task.id,
      performer_id: task.default_performer.id,
      status,
      timestamp: new Date().toISOString()
    });
  }
  
  async completeSession() {
    const session = this.sessionService.currentSession();
    if (session) {
      await this.sessionService.updateSessionStatus(session.id, 'completee');
    }
  }
  
  getStatusText(): string {
    const session = this.sessionService.currentSession();
    if (!session) return 'Non démarrée';
    
    const statusMap = {
      'en_cours': 'En cours',
      'completee': 'Complétée',
      'incomplete': 'Incomplète'
    };
    return statusMap[session.status];
  }
  
  getStatusBadgeClass(): string {
    const session = this.sessionService.currentSession();
    if (!session) return 'bg-gray-100 text-gray-700';
    
    const classes = {
      'en_cours': 'bg-yellow-100 text-yellow-700',
      'completee': 'bg-green-100 text-green-700',
      'incomplete': 'bg-red-100 text-red-700'
    };
    return classes[session.status];
  }
  
  getLogStatusClass(status: string): string {
    const classes = {
      'fait': 'bg-green-100 text-green-700',
      'partiel': 'bg-yellow-100 text-yellow-700',
      'reporte': 'bg-orange-100 text-orange-700',
      'impossible': 'bg-red-100 text-red-700'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-700';
  }
  
  getLogStatusText(status: string): string {
    const texts = {
      'fait': 'Fait',
      'partiel': 'Partiel',
      'reporte': 'Reporté',
      'impossible': 'Impossible'
    };
    return texts[status as keyof typeof texts] || status;
  }
  
  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}