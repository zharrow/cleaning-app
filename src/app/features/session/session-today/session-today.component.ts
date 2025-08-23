import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, type CleaningLog, type CleaningSession } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour les groupes de tâches par pièce
 */
interface RoomTaskGroup {
  readonly roomId: string;
  readonly roomName: string;
  readonly tasks: CleaningLog[];
  readonly progress: {
    readonly completed: number;
    readonly total: number;
    readonly percentage: number;
  };
}

/**
 * Interface pour les filtres
 */
interface TaskFilters {
  status: 'all' | 'todo' | 'in_progress' | 'done' | 'blocked';
  room: string;
  performer: string;
}

/**
 * Interface pour le modal de validation de tâche
 */
interface TaskValidationModal {
  isOpen: boolean;
  task: CleaningLog | null;
  status: CleaningLog['status'];
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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      
      <!-- En-tête de session -->
      @if (currentSession(); as session) {
        <div class="page-header">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 class="page-title">
                Session du {{ formatDate(session.date) }}
              </h1>
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
        <!-- Aucune session active -->
        <div class="page-header">
          <div class="text-center">
            <h1 class="page-title">Aucune session active</h1>
            <p class="page-subtitle mb-6">
              Commencez une nouvelle session pour aujourd'hui
            </p>
            <button 
              class="btn btn-primary"
              (click)="startNewSession()"
              [disabled]="startingSession()"
            >
              @if (startingSession()) {
                <div class="spinner spinner-sm"></div>
              } @else {
                <span class="text-lg">🚀</span>
              }
              Démarrer une session
            </button>
          </div>
        </div>
      }

      <!-- Progression globale -->
      @if (globalProgress(); as progress) {
        <div class="card mb-8">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">
                Progression globale
              </h2>
              <span class="text-lg font-bold text-primary-600">
                {{ progress.percentage | number:'1.0-0' }}%
              </span>
            </div>
            
            <!-- Barre de progression -->
            <div class="w-full bg-gray-200 rounded-full h-4 mb-4 progress-bar">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500 ease-out"
                [style.width.%]="progress.percentage"
              ></div>
            </div>
            
            <!-- Statistiques détaillées -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (stat of progressStats(); track stat.label) {
                <div class="text-center">
                  <div 
                    class="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-semibold"
                    [style.background-color]="stat.color"
                  >
                    {{ stat.count }}
                  </div>
                  <p class="text-sm text-gray-600">{{ stat.label }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Filtres -->
      @if (allTasks().length > 0) {
        <div class="card mb-6">
          <div class="card-body">
            <div class="flex flex-col md:flex-row gap-4">
              <!-- Filtre par statut -->
              <div class="flex-1">
                <label class="form-label text-sm">Statut</label>
                <select 
                  class="form-input form-select"
                  [value]="filters().status"
                  (change)="updateFilter('status', $event)"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                  <option value="blocked">Bloqué</option>
                </select>
              </div>
              
              <!-- Filtre par pièce -->
              <div class="flex-1">
                <label class="form-label text-sm">Pièce</label>
                <select 
                  class="form-input form-select"
                  [value]="filters().room"
                  (change)="updateFilter('room', $event)"
                >
                  <option value="">Toutes les pièces</option>
                  @for (room of availableRooms(); track room.id) {
                    <option [value]="room.id">{{ room.name }}</option>
                  }
                </select>
              </div>
              
              <!-- Filtre par exécutant -->
              <div class="flex-1">
                <label class="form-label text-sm">Exécutant</label>
                <select 
                  class="form-input form-select"
                  [value]="filters().performer"
                  (change)="updateFilter('performer', $event)"
                >
                  <option value="">Tous les exécutants</option>
                  @for (performer of availablePerformers(); track performer) {
                    <option [value]="performer">{{ performer }}</option>
                  }
                </select>
              </div>
              
              <!-- Bouton reset -->
              <div class="flex items-end">
                <button 
                  class="btn btn-secondary"
                  (click)="resetFilters()"
                >
                  Reset
                </button>
              </div>
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
      } @else if (filteredTaskGroups().length > 0) {
        <div class="space-y-6">
          @for (group of filteredTaskGroups(); track group.roomId) {
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
                          {{ task.assigned_task.task_template.name }}
                        </h4>
                        @if (task.assigned_task.task_template.description) {
                          <p class="text-sm text-gray-600 mb-2">
                            {{ task.assigned_task.task_template.description }}
                          </p>
                        }
                        
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                          <span>⏱️ {{ task.assigned_task.task_template.estimated_duration }}min</span>
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
            <span class="text-6xl mb-4 block">🔍</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune tâche trouvée
            </h3>
            <p class="text-gray-600 mb-4">
              Modifiez vos filtres pour voir plus de résultats.
            </p>
            <button 
              class="btn btn-secondary"
              (click)="resetFilters()"
            >
              Réinitialiser les filtres
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
              Valider la tâche : {{ taskModal().task!.assigned_task.task_template.name }}
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
                  @for (performer of availablePerformers(); track performer) {
                    <option [value]="performer">{{ performer }}</option>
                  }
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
  `]
})
export class SessionTodayComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  // Signals d'état
  readonly startingSession = signal(false);
  readonly completingSession = signal(false);
  readonly exportingSession = signal(false);
  readonly savingTask = signal(false);

  // Filtres
  readonly filters = signal<TaskFilters>({
    status: 'all',
    room: '',
    performer: ''
  });

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
  readonly allTasks = computed(() => this.apiService.todayLogs.value() || []);
  readonly isLoading = computed(() => 
    this.apiService.todaySession.isLoading() || this.apiService.todayLogs.isLoading()
  );

  // Progress calculations
  readonly globalProgress = computed(() => this.apiService.todayProgress());

  readonly progressStats = computed(() => {
    const tasks = this.allTasks();
    return [
      {
        label: 'À faire',
        count: tasks.filter(t => t.status === 'todo').length,
        color: '#9CA3AF'
      },
      {
        label: 'En cours',
        count: tasks.filter(t => t.status === 'in_progress').length,
        color: '#3B82F6'
      },
      {
        label: 'Terminé',
        count: tasks.filter(t => t.status === 'done').length,
        color: '#10B981'
      },
      {
        label: 'Bloqué',
        count: tasks.filter(t => ['blocked', 'skipped'].includes(t.status)).length,
        color: '#EF4444'
      }
    ];
  });

  // Filtered data
  readonly filteredTasks = computed(() => {
    const tasks = this.allTasks();
    const filters = this.filters();

    return tasks.filter(task => {
      // Filtre par statut
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Filtre par pièce
      if (filters.room && task.assigned_task.room_id !== filters.room) {
        return false;
      }

      // Filtre par exécutant
      if (filters.performer && task.performed_by !== filters.performer) {
        return false;
      }

      return true;
    });
  });

  readonly filteredTaskGroups = computed((): RoomTaskGroup[] => {
    const tasks = this.filteredTasks();
    const groupsMap = new Map<string, CleaningLog[]>();

    // Grouper par pièce
    tasks.forEach(task => {
      const roomId = task.assigned_task.room_id;
      const roomName = task.assigned_task.room.name;
      
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
        roomName: tasks[0].assigned_task.room.name,
        tasks: tasks.sort((a, b) => a.assigned_task.task_template.name.localeCompare(b.assigned_task.task_template.name)),
        progress: {
          completed,
          total,
          percentage: total > 0 ? (completed / total) * 100 : 0
        }
      };
    }).sort((a, b) => a.roomName.localeCompare(b.roomName));
  });

  // Options pour les filtres
  readonly availableRooms = computed(() => {
    const rooms = new Map<string, { id: string, name: string }>();
    this.allTasks().forEach(task => {
      const room = task.assigned_task.room;
      rooms.set(room.id, { id: room.id, name: room.name });
    });
    return Array.from(rooms.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly availablePerformers = computed(() => {
    const performers = new Set<string>();
    this.allTasks().forEach(task => {
      if (task.performed_by) {
        performers.add(task.performed_by);
      }
    });
    // Ajouter quelques performers par défaut
    performers.add('Marie Dupont');
    performers.add('Pierre Martin');
    performers.add('Sophie Bernard');
    return Array.from(performers).sort();
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
  async startNewSession(): Promise<void> {
    if (this.startingSession()) return;

    this.startingSession.set(true);
    try {
      await this.apiService.startNewSession();
    } catch (error) {
      console.error('Erreur lors du démarrage de la session:', error);
    } finally {
      this.startingSession.set(false);
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
   * Gestion des filtres
   */
  updateFilter(field: keyof TaskFilters, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    this.filters.update(filters => ({
      ...filters,
      [field]: value
    }));
  }

  resetFilters(): void {
    this.filters.set({
      status: 'all',
      room: '',
      performer: ''
    });
  }

  /**
   * Gestion du modal de tâche
   */
  openTaskModal(task: CleaningLog): void {
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

      // Mise à jour de la tâche
      await this.apiService.updateCleaningLog(modal.task.id, {
        status: modal.status,
        performed_by: modal.performer || undefined,
        notes: modal.notes || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined
      });

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
}