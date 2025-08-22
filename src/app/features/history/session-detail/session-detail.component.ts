// ========================================
// Composant Détail de session - src/app/features/history/session-detail/session-detail.component.ts
// ========================================
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, type CleaningSession, type CleaningLog } from '../../../core/services/api.service';

/**
 * Interface pour les détails complets d'une session
 */
interface SessionDetail extends CleaningSession {
  readonly logs: CleaningLog[];
  readonly performers: string[];
  readonly photos: string[];
  readonly notes: string[];
}

/**
 * Composant de détail d'une session
 * Affiche toutes les informations d'une session passée
 */
@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      
      @if (isLoading()) {
        <!-- État de chargement -->
        <div class="space-y-6">
          <div class="card">
            <div class="card-body">
              <div class="skeleton skeleton-text w-1/3 mb-4"></div>
              <div class="skeleton skeleton-text w-1/2 mb-2"></div>
              <div class="skeleton skeleton-text w-1/4"></div>
            </div>
          </div>
          
          @for (i of [1,2,3]; track i) {
            <div class="card">
              <div class="card-header">
                <div class="skeleton skeleton-text w-1/4"></div>
              </div>
              <div class="card-body">
                <div class="space-y-2">
                  @for (j of [1,2,3]; track j) {
                    <div class="skeleton skeleton-text"></div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (sessionDetail(); as session) {
        
        <!-- En-tête de session -->
        <div class="page-header">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <a routerLink="/history" class="btn btn-ghost btn-icon">
                  <span class="text-lg">←</span>
                </a>
                <h1 class="page-title">Session du {{ formatDate(session.date) }}</h1>
              </div>
              <p class="page-subtitle">
                {{ getSessionDescription(session) }}
              </p>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-3">
              <span 
                class="badge badge-lg"
                [class]="getStatusBadgeClass(session.status)"
              >
                {{ getStatusLabel(session.status) }}
              </span>
              
              <button 
                class="btn btn-secondary"
                (click)="downloadReport()"
                [disabled]="downloadingReport()"
              >
                @if (downloadingReport()) {
                  <div class="spinner spinner-sm"></div>
                } @else {
                  <span class="text-lg">📄</span>
                }
                Télécharger le rapport
              </button>
            </div>
          </div>
        </div>

        <!-- Statistiques de la session -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Progression</p>
                  <p class="text-2xl font-bold text-primary-600">
                    {{ getProgressPercentage(session) }}%
                  </p>
                </div>
                <span class="text-3xl">📊</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  class="bg-primary-600 h-2 rounded-full transition-all"
                  [style.width.%]="getProgressPercentage(session)"
                ></div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Tâches terminées</p>
                  <p class="text-2xl font-bold text-success-600">
                    {{ session.completed_tasks }}/{{ session.total_tasks }}
                  </p>
                </div>
                <span class="text-3xl">✅</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Exécutants</p>
                  <p class="text-2xl font-bold text-warning-600">{{ session.performers.length }}</p>
                </div>
                <span class="text-3xl">👥</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Photos prises</p>
                  <p class="text-2xl font-bold text-danger-600">{{ session.photos.length }}</p>
                </div>
                <span class="text-3xl">📸</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Détails par pièce -->
        <div class="space-y-6 mb-8">
          @for (roomGroup of groupedLogs(); track roomGroup.roomId) {
            <div class="card">
              <div class="card-header">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="card-title">{{ roomGroup.roomName }}</h3>
                    <p class="card-subtitle">
                      {{ roomGroup.completed }}/{{ roomGroup.total }} tâches complétées
                    </p>
                  </div>
                  
                  <!-- Progression de la pièce -->
                  <div class="flex items-center gap-3">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        class="h-2 rounded-full transition-all"
                        [class]="roomGroup.percentage === 100 ? 'bg-success-500' : 'bg-primary-500'"
                        [style.width.%]="roomGroup.percentage"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-600">
                      {{ roomGroup.percentage }}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="space-y-4">
                  @for (log of roomGroup.logs; track log.id) {
                    <div 
                      class="flex items-start gap-4 p-4 rounded-lg border"
                      [class]="getLogBorderClass(log.status)"
                    >
                      
                      <!-- Statut visuel -->
                      <div class="flex-shrink-0 mt-1">
                        <div 
                          class="w-6 h-6 rounded-full flex items-center justify-center"
                          [style.background-color]="getStatusColor(log.status)"
                        >
                          <span class="text-white text-sm font-bold">
                            {{ getStatusIcon(log.status) }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Contenu de la tâche -->
                      <div class="flex-1">
                        <div class="flex items-start justify-between mb-2">
                          <h4 class="font-medium text-gray-900">
                            {{ log.assigned_task.task_template.name }}
                          </h4>
                          <span 
                            class="badge badge-sm"
                            [class]="getStatusBadgeClass(log.status)"
                          >
                            {{ getStatusLabel(log.status) }}
                          </span>
                        </div>
                        
                        @if (log.assigned_task.task_template.description) {
                          <p class="text-sm text-gray-600 mb-3">
                            {{ log.assigned_task.task_template.description }}
                          </p>
                        }
                        
                        <!-- Informations d'exécution -->
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <span>⏱️ {{ log.assigned_task.task_template.estimated_duration }}min</span>
                          
                          @if (log.performed_by) {
                            <span>👤 {{ log.performed_by }}</span>
                          }
                          
                          @if (log.completed_at) {
                            <span>✅ {{ formatTime(log.completed_at) }}</span>
                          }
                          
                          @if (log.photos && log.photos.length > 0) {
                            <span>📸 {{ log.photos.length }} photo(s)</span>
                          }
                        </div>
                        
                        <!-- Notes -->
                        @if (log.notes) {
                          <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-sm text-gray-700">
                              <strong>Notes :</strong> {{ log.notes }}
                            </p>
                          </div>
                        }
                        
                        <!-- Photos -->
                        @if (log.photos && log.photos.length > 0) {
                          <div class="flex gap-2 mt-3">
                            @for (photo of log.photos; track photo) {
                              <img 
                                [src]="photo" 
                                [alt]="'Photo de ' + log.assigned_task.task_template.name"
                                class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                (click)="openPhotoModal(photo)"
                              />
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Résumé de la session -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Résumé de la session</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <!-- Informations générales -->
              <div>
                <h4 class="font-semibold text-gray-900 mb-4">Informations générales</h4>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Date de début :</span>
                    <span class="font-medium">{{ formatDateTime(session.created_at) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Date de fin :</span>
                    <span class="font-medium">{{ formatDateTime(session.updated_at) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Durée totale :</span>
                    <span class="font-medium">{{ getSessionDuration(session) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Statut final :</span>
                    <span 
                      class="badge"
                      [class]="getStatusBadgeClass(session.status)"
                    >
                      {{ getStatusLabel(session.status) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Participants -->
              <div>
                <h4 class="font-semibold text-gray-900 mb-4">Participants</h4>
                <div class="space-y-2">
                  @for (performer of session.performers; track performer) {
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-primary-700">
                          {{ getInitials(performer) }}
                        </span>
                      </div>
                      <span class="text-gray-900">{{ performer }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        
      } @else {
        <!-- Session non trouvée -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">❓</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Session non trouvée
            </h3>
            <p class="text-gray-600 mb-6">
              La session que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <a routerLink="/history" class="btn btn-primary">
              Retour à l'historique
            </a>
          </div>
        </div>
      }
    </div>

    <!-- Modal Photo -->
    @if (selectedPhoto()) {
      <div 
        class="modal-overlay"
        (click)="closePhotoModal()"
      >
        <div class="modal-content max-w-4xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Photo de la tâche</h3>
            <button class="modal-close" (click)="closePhotoModal()">✕</button>
          </div>
          <div class="modal-body p-0">
            <img 
              [src]="selectedPhoto()" 
              alt="Photo de la tâche"
              class="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .badge-lg {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
  `]
})
export class SessionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);

  // Signals d'état
  private readonly sessionId = signal<string | null>(null);
  private readonly isLoading = signal(false);
  private readonly downloadingReport = signal(false);
  private readonly selectedPhoto = signal<string | null>(null);

  // Mock data pour la session (à remplacer par l'API)
  private readonly sessionDetail = signal<SessionDetail | null>({
    id: '1',
    date: '2024-01-15',
    status: 'completed',
    total_tasks: 25,
    completed_tasks: 25,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T11:30:00Z',
    performers: ['Marie Dupont', 'Pierre Martin', 'Sophie Bernard'],
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
    notes: ['Quelques observations importantes'],
    logs: [
      {
        id: '1',
        session_id: '1',
        assigned_task_id: '1',
        status: 'done',
        performed_by: 'Marie Dupont',
        notes: 'Nettoyage complet effectué',
        photos: ['photo1.jpg'],
        started_at: '2024-01-15T08:15:00Z',
        completed_at: '2024-01-15T08:30:00Z',
        assigned_task: {
          id: '1',
          room_id: '1',
          task_template_id: '1',
          frequency: 'daily' as const,
          suggested_time: '08:00',
          default_performer: 'Marie Dupont',
          is_active: true,
          room: {
            id: '1',
            name: 'Salle d\'activités',
            description: 'Espace principal de jeu',
            order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          task_template: {
            id: '1',
            name: 'Nettoyer les surfaces',
            description: 'Nettoyer et désinfecter toutes les surfaces',
            category: 'Surfaces',
            estimated_duration: 15,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        created_at: '2024-01-15T08:15:00Z',
        updated_at: '2024-01-15T08:30:00Z'
      }
      // Plus de logs...
    ]
  });

  // Computed
  readonly groupedLogs = computed(() => {
    const session = this.sessionDetail();
    if (!session) return [];

    const groups = new Map<string, CleaningLog[]>();
    
    session.logs.forEach(log => {
      const roomId = log.assigned_task.room_id;
      if (!groups.has(roomId)) {
        groups.set(roomId, []);
      }
      groups.get(roomId)!.push(log);
    });

    return Array.from(groups.entries()).map(([roomId, logs]) => {
      const completed = logs.filter(log => log.status === 'done').length;
      const total = logs.length;
      
      return {
        roomId,
        roomName: logs[0].assigned_task.room.name,
        logs: logs.sort((a, b) => a.assigned_task.task_template.name.localeCompare(b.assigned_task.task_template.name)),
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }).sort((a, b) => a.roomName.localeCompare(b.roomName));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sessionId');
    if (id) {
      this.sessionId.set(id);
      this.loadSessionDetail(id);
    }
  }

  /**
   * Chargement des données
   */
  private async loadSessionDetail(sessionId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // TODO: Charger les données depuis l'API
      console.log('Chargement session:', sessionId);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      this.sessionDetail.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actions
   */
  async downloadReport(): Promise<void> {
    const session = this.sessionDetail();
    if (!session || this.downloadingReport()) return;

    this.downloadingReport.set(true);
    try {
      // TODO: Implémenter le téléchargement via l'API
      console.log('Téléchargement rapport session:', session.id);
      
      // Simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    } finally {
      this.downloadingReport.set(false);
    }
  }

  openPhotoModal(photoUrl: string): void {
    this.selectedPhoto.set(photoUrl);
  }

  closePhotoModal(): void {
    this.selectedPhoto.set(null);
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

  formatDateTime(timestamp: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  getSessionDescription(session: SessionDetail): string {
    return `${session.completed_tasks} sur ${session.total_tasks} tâches complétées par ${session.performers.length} personne(s)`;
  }

  getProgressPercentage(session: SessionDetail): number {
    return session.total_tasks > 0 
      ? Math.round((session.completed_tasks / session.total_tasks) * 100) 
      : 0;
  }

  getSessionDuration(session: SessionDetail): string {
    const start = new Date(session.created_at);
    const end = new Date(session.updated_at);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // en minutes
    
    if (duration < 60) {
      return `${duration} minutes`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
    }
  }

  getStatusLabel(status: string): string {
    const labels = {
      completed: 'Terminée',
      incomplete: 'Incomplète',
      in_progress: 'En cours',
      done: 'Terminé',
      todo: 'À faire',
      blocked: 'Bloqué',
      partial: 'Partiel',
      skipped: 'Reporté'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      completed: 'badge-success',
      incomplete: 'badge-warning',
      in_progress: 'badge-primary',
      done: 'badge-success',
      todo: 'badge-gray',
      blocked: 'badge-danger',
      partial: 'badge-warning',
      skipped: 'badge-danger'
    };
    return classes[status as keyof typeof classes] || 'badge-gray';
  }

  getStatusColor(status: string): string {
    const colors = {
      done: '#10B981',
      todo: '#9CA3AF',
      blocked: '#EF4444',
      partial: '#F59E0B',
      skipped: '#EF4444'
    };
    return colors[status as keyof typeof colors] || '#9CA3AF';
  }

  getStatusIcon(status: string): string {
    const icons = {
      done: '✓',
      todo: '○',
      blocked: '✗',
      partial: '◑',
      skipped: '⊘'
    };
    return icons[status as keyof typeof icons] || '○';
  }

  getLogBorderClass(status: string): string {
    const classes = {
      done: 'border-success-200 bg-success-50',
      todo: 'border-gray-200 bg-gray-50',
      blocked: 'border-danger-200 bg-danger-50',
      partial: 'border-warning-200 bg-warning-50',
      skipped: 'border-danger-200 bg-danger-50'
    };
    return classes[status as keyof typeof classes] || 'border-gray-200 bg-gray-50';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}