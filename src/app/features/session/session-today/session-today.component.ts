import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, type CleaningLog, type CleaningSession, type AssignedTask } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour une tâche de session (AssignedTask avec statut temporaire)
 */
interface SessionTask {
  readonly id: string;
  readonly assignedTask: AssignedTask;
  status: 'todo' | 'in_progress' | 'done' | 'partial' | 'skipped' | 'blocked';
  performed_by?: string;
  notes?: string;
  photos?: string[];
  started_at?: string;
  completed_at?: string;
}

/**
 * Interface pour les groupes de tâches par pièce
 */
interface RoomTaskGroup {
  readonly roomId: string;
  readonly roomName: string;
  readonly tasks: SessionTask[];
  readonly progress: {
    readonly completed: number;
    readonly total: number;
    readonly percentage: number;
  };
}


/**
 * Interface pour le modal de validation de tâche
 */
interface TaskValidationModal {
  isOpen: boolean;
  task: SessionTask | null;
  status: SessionTask['status'];
  performer: string;
  notes: string;
  photos: File[];
}

/**
 * Composant Session du jour
 * Gère l'affichage et la validation des tâches quotidiennes
 */
@Component({
  selector: 'app-session-today',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      
      <!-- Bannière d'alerte session active -->
      @if (currentSession()?.status === 'in_progress') {
        <div class="session-active-banner animate-fade-in">
          <div class="flex items-center justify-center gap-3">
            <div class="session-pulse"></div>
            <div class="text-center">
              <p class="font-semibold text-green-800">🟢 Session de nettoyage en cours</p>
              <p class="text-sm text-green-700">{{ getTotalRoomsCount() }} pièces à nettoyer • {{ getTotalActiveTasksCount() }} tâches en cours</p>
            </div>
          </div>
        </div>
      }

      <!-- En-tête de session -->
      @if (currentSession(); as session) {
        <div class="page-header">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="page-title">
                  Session du {{ formatDate(session.date) }}
                </h1>
                @if (session.status === 'in_progress') {
                  <div class="status-indicator status-active" title="Session active">
                    <div class="status-dot"></div>
                    <span class="status-text">ACTIVE</span>
                  </div>
                }
              </div>
              <p class="page-subtitle">
                {{ getSessionDescription(session) }}
              </p>
            </div>
            
            <!-- Actions de session -->
            <div class="flex items-center gap-3">
              <div 
                class="badge"
                [class]="getSessionStatusClass(session.status)"
              >
                {{ getSessionStatusLabel(session.status) }}
              </div>
              
              @if (canCompleteSession()) {
                <button 
                  class="btn btn-success"
                  (click)="completeSession()"
                  [disabled]="completingSession()"
                >
                  @if (completingSession()) {
                    <div class="spinner spinner-sm"></div>
                  } @else {
                    <span class="text-lg">✅</span>
                  }
                  Terminer la session
                </button>
              }
              
              @if (canExportSession()) {
                <button 
                  class="btn btn-primary"
                  (click)="exportSession()"
                  [disabled]="exportingSession()"
                >
                  @if (exportingSession()) {
                    <div class="spinner spinner-sm"></div>
                  } @else {
                    <span class="text-lg">📄</span>
                  }
                  Exporter PDF
                </button>
              }
            </div>
          </div>
        </div>
      } @else if (!isLoading()) {
        <!-- Aucune session trouvée -->
        <div class="page-header">
          <div class="text-center">
            <h1 class="page-title">Session en cours d'initialisation</h1>
            <p class="page-subtitle mb-6">
              La session du jour se crée automatiquement à votre connexion
            </p>
            <div class="text-6xl mb-4">⏳</div>
            <p class="text-gray-600 mb-6">
              Si la session ne se crée pas automatiquement, cliquez ci-dessous.
            </p>
            <button 
              class="btn btn-primary"
              (click)="createTodaySession()"
              [disabled]="creatingSession()"
            >
              @if (creatingSession()) {
                <div class="spinner spinner-sm"></div>
              } @else {
                <span class="text-lg">🚀</span>
              }
              Créer la session du jour
            </button>
          </div>
        </div>
      }

      <!-- Vue d'ensemble des pièces -->
      @if (currentSession(); as session) {
        <div class="card mb-6">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🏠 Pièces à nettoyer aujourd'hui
              </h2>
              <span class="text-sm text-gray-600">
                {{ taskGroups().length }} pièce(s) concernée(s)
              </span>
            </div>
            
            <!-- Grille des pièces avec statut -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              @for (group of taskGroups(); track group.roomId) {
                <div class="room-card" [class]="getRoomStatusClass(group.progress.percentage)">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900 truncate">{{ group.roomName }}</h3>
                    <div class="room-status-icon">
                      {{ getRoomStatusIcon(group.progress.percentage) }}
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">{{ group.progress.completed }}/{{ group.progress.total }} tâches</span>
                    <span class="font-semibold" [class]="getProgressColorClass(group.progress.percentage)">
                      {{ group.progress.percentage | number:'1.0-0' }}%
                    </span>
                  </div>
                  
                  <!-- Mini barre de progression -->
                  <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      class="h-1.5 rounded-full transition-all duration-300"
                      [class]="getProgressBarClass(group.progress.percentage)"
                      [style.width.%]="group.progress.percentage"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }


      <!-- Liste des tâches groupées par pièce -->
      @if (isLoading()) {
        <div class="space-y-6">
          @for (i of [1,2,3]; track i) {
            <div class="card">
              <div class="card-header">
                <div class="skeleton skeleton-text w-1/3 mb-2"></div>
                <div class="skeleton skeleton-text w-1/2"></div>
              </div>
              <div class="card-body">
                <div class="space-y-3">
                  @for (j of [1,2,3]; track j) {
                    <div class="skeleton skeleton-text"></div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (currentSession() && taskGroups().length === 0) {
        <!-- Session vide - aucune tâche assignée -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">📋</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Session créée mais aucune tâche assignée
            </h3>
            <p class="text-gray-600 mb-6">
              La session du jour est active mais aucune tâche n'a encore été assignée aux pièces.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                class="btn btn-primary"
                routerLink="/manage/rooms"
              >
                <span class="text-lg">🏠</span>
                Gérer les pièces
              </button>
              <button 
                class="btn btn-secondary"
                routerLink="/manage/tasks"
              >
                <span class="text-lg">⚙️</span>
                Assigner des tâches
              </button>
            </div>
          </div>
        </div>
      } @else if (taskGroups().length > 0) {
        <div class="space-y-6">
          @for (group of taskGroups(); track group.roomId) {
            <div class="card animate-fade-in">
              <div class="card-header">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="card-title">{{ group.roomName }}</h3>
                    <p class="card-subtitle">
                      {{ group.progress.completed }} / {{ group.progress.total }} tâches complétées
                    </p>
                  </div>
                  
                  <!-- Mini progression par pièce -->
                  <div class="flex items-center gap-3">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-primary-600 h-2 rounded-full transition-all"
                        [style.width.%]="group.progress.percentage"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-600">
                      {{ group.progress.percentage | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="space-y-4">
                  @for (task of group.tasks; track task.id) {
                    <div 
                      class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      [class]="getTaskRowClass(task.status)"
                    >
                      
                      <!-- Statut visuel -->
                      <div class="flex-shrink-0">
                        <div 
                          class="w-4 h-4 rounded-full"
                          [style.background-color]="getStatusColor(task.status)"
                        ></div>
                      </div>
                      
                      <!-- Informations de la tâche -->
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 mb-1">
                          {{ task.assignedTask.task_template.name }}
                        </h4>
                        @if (task.assignedTask.task_template.description) {
                          <p class="text-sm text-gray-600 mb-2">
                            {{ task.assignedTask.task_template.description }}
                          </p>
                        }
                        
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                          <span>⏱️ {{ task.assignedTask.task_template.estimated_duration }}min</span>
                          @if (task.performed_by) {
                            <span>👤 {{ task.performed_by }}</span>
                          }
                          @if (task.completed_at) {
                            <span>✅ {{ formatTime(task.completed_at) }}</span>
                          }
                        </div>
                      </div>
                      
                      <!-- Statut badge -->
                      <div class="flex-shrink-0">
                        <span 
                          class="badge"
                          [class]="getStatusBadgeClass(task.status)"
                        >
                          {{ getStatusLabel(task.status) }}
                        </span>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center gap-2">
                        @if (task.notes) {
                          <button 
                            class="btn btn-ghost btn-icon btn-sm"
                            [title]="'Notes: ' + task.notes"
                          >
                            📝
                          </button>
                        }
                        
                        @if (task.photos && task.photos.length > 0) {
                          <button 
                            class="btn btn-ghost btn-icon btn-sm"
                            [title]="task.photos.length + ' photo(s)'"
                          >
                            📸
                          </button>
                        }
                        
                        <button 
                          class="btn btn-primary btn-sm"
                          (click)="openTaskModal(task)"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (!isLoading()) {
        <!-- Aucune tâche trouvée -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">📋</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune tâche assignée
            </h3>
            <p class="text-gray-600 mb-4">
              Il n'y a actuellement aucune tâche assignée aux pièces.
            </p>
            <button 
              class="btn btn-primary"
              routerLink="/manage/tasks"
            >
              Assigner des tâches
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Modal de validation de tâche -->
    @if (taskModal().isOpen && taskModal().task) {
      <div class="modal-overlay" (click)="closeTaskModal()">
        <div class="modal-content max-w-2xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              Valider la tâche : {{ taskModal().task!.assignedTask.task_template.name }}
            </h3>
            <button 
              class="modal-close"
              (click)="closeTaskModal()"
            >
              ✕
            </button>
          </div>
          
          <div class="modal-body">
            <div class="space-y-4">
              
              <!-- Statut de la tâche -->
              <div class="form-group">
                <label class="form-label required">Statut</label>
                <select 
                  class="form-input form-select"
                  [value]="taskModal().status"
                  (change)="updateTaskModalField('status', $event)"
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                  <option value="partial">Partiel</option>
                  <option value="blocked">Bloqué</option>
                  <option value="skipped">Reporté</option>
                </select>
              </div>
              
              <!-- Exécutant -->
              <div class="form-group">
                <label class="form-label">Exécutant</label>
                <input 
                  type="text"
                  class="form-input"
                  [value]="taskModal().performer"
                  (input)="updateTaskModalField('performer', $event)"
                  placeholder="Nom de l'exécutant"
                  list="performers-list"
                />
                <datalist id="performers-list">
                  <option value="Marie Dupont">Marie Dupont</option>
                  <option value="Pierre Martin">Pierre Martin</option>
                  <option value="Sophie Bernard">Sophie Bernard</option>
                </datalist>
              </div>
              
              <!-- Notes -->
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea 
                  class="form-input form-textarea"
                  [value]="taskModal().notes"
                  (input)="updateTaskModalField('notes', $event)"
                  placeholder="Commentaires, observations..."
                  rows="3"
                ></textarea>
              </div>
              
              <!-- Photos -->
              <div class="form-group">
                <label class="form-label">Photos</label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    #fileInput
                    (change)="onPhotosSelected($event)"
                  />
                  
                  @if (taskModal().photos.length === 0) {
                    <div>
                      <span class="text-4xl mb-2 block">📸</span>
                      <p class="text-gray-600 mb-3">
                        Ajoutez des photos pour documenter la tâche
                      </p>
                      <button 
                        type="button"
                        class="btn btn-secondary"
                        (click)="fileInput.click()"
                      >
                        Choisir des photos
                      </button>
                    </div>
                  } @else {
                    <div>
                      <p class="text-sm text-gray-600 mb-3">
                        {{ taskModal().photos.length }} photo(s) sélectionnée(s)
                      </p>
                      <button 
                        type="button"
                        class="btn btn-secondary"
                        (click)="fileInput.click()"
                      >
                        Ajouter d'autres photos
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button 
              class="btn btn-secondary"
              (click)="closeTaskModal()"
              [disabled]="savingTask()"
            >
              Annuler
            </button>
            <button 
              class="btn btn-primary"
              (click)="saveTask()"
              [disabled]="savingTask()"
            >
              @if (savingTask()) {
                <div class="spinner spinner-sm"></div>
              }
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Bannière session active */
    .session-active-banner {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      border: 1px solid #34d399;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .session-pulse {
      width: 12px;
      height: 12px;
      background-color: #10b981;
      border-radius: 50%;
      animation: session-pulse 2s infinite;
    }

    @keyframes session-pulse {
      0%, 100% { 
        opacity: 1; 
        transform: scale(1);
      }
      50% { 
        opacity: 0.7; 
        transform: scale(1.2);
      }
    }

    /* Indicateur de statut */
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-active {
      background-color: rgba(16, 185, 129, 0.1);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background-color: currentColor;
      border-radius: 50%;
      animation: status-blink 2s infinite;
    }

    @keyframes status-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Cards des pièces */
    .room-card {
      padding: 1rem;
      border-radius: 0.5rem;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
      background-color: white;
    }

    .room-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .room-card.room-pending {
      border-color: #d1d5db;
      background-color: #f9fafb;
    }

    .room-card.room-in-progress {
      border-color: #93c5fd;
      background-color: #eff6ff;
    }

    .room-card.room-completed {
      border-color: #86efac;
      background-color: #f0fdf4;
    }

    .room-status-icon {
      font-size: 1.25rem;
    }

    .progress-bar {
      position: relative;
      overflow: hidden;
    }

    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: progress-shine 2s infinite;
    }

    @keyframes progress-shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .task-row-completed {
      background-color: rgba(16, 185, 129, 0.05);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .task-row-in-progress {
      background-color: rgba(59, 130, 246, 0.05);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .task-row-blocked {
      background-color: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.2);
    }

    @keyframes fade-in {
      from { 
        opacity: 0; 
        transform: translateY(-10px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }

    .animate-fade-in {
      animation: fade-in 0.5s ease-out;
    }
  `]
})
export class SessionTodayComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  // Signals d'état
  readonly completingSession = signal(false);
  readonly exportingSession = signal(false);
  readonly savingTask = signal(false);
  readonly creatingSession = signal(false);


  // Modal de validation de tâche
  readonly taskModal = signal<TaskValidationModal>({
    isOpen: false,
    task: null,
    status: 'todo',
    performer: '',
    notes: '',
    photos: []
  });

  // Computed signals depuis l'API
  readonly currentSession = computed(() => this.apiService.todaySession.value());
  readonly assignedTasks = computed(() => this.apiService.assignedTasks.value() || []);
  readonly isLoading = computed(() => 
    this.apiService.todaySession.isLoading() || this.apiService.assignedTasks.isLoading()
  );

  // Signal pour stocker les statuts temporaires des tâches de la session
  private readonly taskStatuses = signal<Map<string, Partial<SessionTask>>>(new Map());

  // Transformer les AssignedTask en SessionTask avec statuts temporaires
  readonly allTasks = computed((): SessionTask[] => {
    const assigned = this.assignedTasks();
    const statuses = this.taskStatuses();
    
    return assigned.map(assignedTask => {
      const taskId = assignedTask.id;
      const temporaryStatus = statuses.get(taskId) || {};
      
      return {
        id: taskId,
        assignedTask,
        status: temporaryStatus.status || 'todo',
        performed_by: temporaryStatus.performed_by || assignedTask.default_performer?.name,
        notes: temporaryStatus.notes,
        photos: temporaryStatus.photos,
        started_at: temporaryStatus.started_at,
        completed_at: temporaryStatus.completed_at
      } as SessionTask;
    });
  });

  // Progress calculations
  readonly globalProgress = computed(() => {
    const tasks = this.allTasks();
    const completed = tasks.filter(task => task.status === 'done').length;
    const total = tasks.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  });


  readonly taskGroups = computed((): RoomTaskGroup[] => {
    const tasks = this.allTasks();
    const groupsMap = new Map<string, SessionTask[]>();

    // Grouper par pièce
    tasks.forEach(task => {
      const roomId = task.assignedTask.room_id || task.assignedTask.room.id;
      
      if (!groupsMap.has(roomId)) {
        groupsMap.set(roomId, []);
      }
      groupsMap.get(roomId)!.push(task);
    });

    // Convertir en RoomTaskGroup avec calculs de progression
    return Array.from(groupsMap.entries()).map(([roomId, tasks]) => {
      const completed = tasks.filter(t => t.status === 'done').length;
      const total = tasks.length;
      
      return {
        roomId,
        roomName: tasks[0].assignedTask.room.name,
        tasks: tasks.sort((a, b) => a.assignedTask.task_template.name.localeCompare(b.assignedTask.task_template.name)),
        progress: {
          completed,
          total,
          percentage: total > 0 ? (completed / total) * 100 : 0
        }
      };
    }).sort((a, b) => a.roomName.localeCompare(b.roomName));
  });


  // Permissions
  readonly canCompleteSession = computed(() => {
    const session = this.currentSession();
    const progress = this.globalProgress();
    return session && 
           session.status === 'in_progress' && 
           progress && 
           progress.percentage >= 80; // Minimum 80% pour terminer
  });

  readonly canExportSession = computed(() => {
    const session = this.currentSession();
    return session && ['completed', 'incomplete'].includes(session.status);
  });

  // Nouvelles computed properties pour les éléments visuels
  readonly getTotalRoomsCount = computed(() => {
    return this.taskGroups().length;
  });

  readonly getTotalActiveTasksCount = computed(() => {
    return this.allTasks().filter(task => ['todo', 'in_progress'].includes(task.status)).length;
  });

  constructor() {
    // Effect pour rafraîchir automatiquement
    effect(() => {
      if (this.currentSession()) {
        const interval = setInterval(() => {
          this.apiService.refreshData();
        }, 15000); // Refresh toutes les 15 secondes

        return () => clearInterval(interval);
      }
      return; // Retourner undefined quand pas de session
    });
  }

  /**
   * Actions principales
   */
  async createTodaySession(): Promise<void> {
    if (this.creatingSession()) return;

    this.creatingSession.set(true);
    try {
      console.log('🚀 Création manuelle de la session...');
      await this.apiService.createTodaySession();
      console.log('✅ Session créée avec succès!');
    } catch (error) {
      console.error('❌ Erreur lors de la création de session:', error);
    } finally {
      this.creatingSession.set(false);
    }
  }

  async completeSession(): Promise<void> {
    const session = this.currentSession();
    if (!session || this.completingSession()) return;

    this.completingSession.set(true);
    try {
      // TODO: Implémenter l'API pour terminer une session
      console.log('Terminer session:', session.id);
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    } finally {
      this.completingSession.set(false);
    }
  }

  async exportSession(): Promise<void> {
    const session = this.currentSession();
    if (!session || this.exportingSession()) return;

    this.exportingSession.set(true);
    try {
      const blob = await this.apiService.downloadReport(session.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${this.formatDate(session.date)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      this.exportingSession.set(false);
    }
  }


  /**
   * Gestion du modal de tâche
   */
  openTaskModal(task: SessionTask): void {
    this.taskModal.set({
      isOpen: true,
      task,
      status: task.status,
      performer: task.performed_by || '',
      notes: task.notes || '',
      photos: []
    });
  }

  closeTaskModal(): void {
    this.taskModal.set({
      isOpen: false,
      task: null,
      status: 'todo',
      performer: '',
      notes: '',
      photos: []
    });
  }

  updateTaskModalField(field: keyof Omit<TaskValidationModal, 'isOpen' | 'task' | 'photos'>, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const value = target.value;
    
    this.taskModal.update(modal => ({
      ...modal,
      [field]: value
    }));
  }

  async saveTask(): Promise<void> {
    const modal = this.taskModal();
    if (!modal.task || this.savingTask()) return;

    this.savingTask.set(true);
    try {
      // Upload des photos d'abord
      const photoUrls: string[] = [];
      for (const photo of modal.photos) {
        const url = await this.apiService.uploadPhoto(photo);
        photoUrls.push(url);
      }

      // Mettre à jour le statut temporaire dans taskStatuses
      const taskId = modal.task.id;
      const currentStatuses = this.taskStatuses();
      const updatedStatuses = new Map(currentStatuses);
      
      updatedStatuses.set(taskId, {
        status: modal.status,
        performed_by: modal.performer || undefined,
        notes: modal.notes || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        completed_at: modal.status === 'done' ? new Date().toISOString() : undefined,
        started_at: modal.status === 'in_progress' && !modal.task.started_at ? new Date().toISOString() : modal.task.started_at
      });
      
      this.taskStatuses.set(updatedStatuses);
      
      console.log('✅ Statut de tâche mis à jour localement:', { taskId, status: modal.status });

      this.closeTaskModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.savingTask.set(false);
    }
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newPhotos = Array.from(input.files);
      this.taskModal.update(modal => ({
        ...modal,
        photos: [...modal.photos, ...newPhotos]
      }));
    }
  }

  /**
   * Utilitaires d'affichage
   */
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatTime(timestamp: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  getSessionDescription(session: CleaningSession): string {
    const progress = this.globalProgress();
    if (progress) {
      return `${progress.completed} / ${progress.total} tâches complétées`;
    }
    return `${session.completed_tasks} / ${session.total_tasks} tâches`;
  }

  getSessionStatusClass(status: CleaningSession['status']): string {
    const classes = {
      pending: 'badge-gray',
      in_progress: 'badge-primary',
      completed: 'badge-success',
      incomplete: 'badge-warning'
    };
    return classes[status] || 'badge-gray';
  }

  getSessionStatusLabel(status: CleaningSession['status']): string {
    const labels = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminée',
      incomplete: 'Incomplète'
    };
    return labels[status] || status;
  }

  getStatusColor(status: CleaningLog['status']): string {
    const colors = {
      todo: '#9CA3AF',
      in_progress: '#3B82F6',
      done: '#10B981',
      partial: '#F59E0B',
      blocked: '#EF4444',
      skipped: '#EF4444'
    };
    return colors[status] || '#9CA3AF';
  }

  getStatusBadgeClass(status: CleaningLog['status']): string {
    const classes = {
      todo: 'badge-gray',
      in_progress: 'badge-primary',
      done: 'badge-success',
      partial: 'badge-warning',
      blocked: 'badge-danger',
      skipped: 'badge-danger'
    };
    return classes[status] || 'badge-gray';
  }

  getStatusLabel(status: CleaningLog['status']): string {
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      done: 'Terminé',
      partial: 'Partiel',
      blocked: 'Bloqué',
      skipped: 'Reporté'
    };
    return labels[status] || status;
  }

  getTaskRowClass(status: CleaningLog['status']): string {
    const classes: Record<CleaningLog['status'], string> = {
      todo: '',
      in_progress: 'task-row-in-progress',
      done: 'task-row-completed',
      partial: '',
      blocked: 'task-row-blocked',
      skipped: 'task-row-blocked'
    };
    return classes[status] || '';
  }

  /**
   * Nouvelles méthodes pour les éléments visuels des pièces
   */
  getRoomStatusClass(progressPercentage: number): string {
    if (progressPercentage === 100) {
      return 'room-completed';
    } else if (progressPercentage > 0) {
      return 'room-in-progress';
    }
    return 'room-pending';
  }

  getRoomStatusIcon(progressPercentage: number): string {
    if (progressPercentage === 100) {
      return '✅';
    } else if (progressPercentage > 0) {
      return '🔄';
    }
    return '⏳';
  }

  getProgressColorClass(progressPercentage: number): string {
    if (progressPercentage === 100) {
      return 'text-green-600';
    } else if (progressPercentage > 0) {
      return 'text-blue-600';
    }
    return 'text-gray-500';
  }

  getProgressBarClass(progressPercentage: number): string {
    if (progressPercentage === 100) {
      return 'bg-green-500';
    } else if (progressPercentage > 0) {
      return 'bg-blue-500';
    }
    return 'bg-gray-400';
  }
}