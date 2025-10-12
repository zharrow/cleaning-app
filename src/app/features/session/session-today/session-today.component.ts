import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, type CleaningLog, type CleaningSession, type AssignedTask, type TodayTaskStatus } from '../../../core/services/api.service';
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
  templateUrl: './session-today.component.html',
  styleUrl: './session-today.component.css'
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
  readonly allTasks = computed(() => this.apiService.todaySessionTasks());
  readonly isLoading = computed(() => 
    this.apiService.todaySession.isLoading() || this.apiService.assignedTasks.isLoading()
  );

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
  readonly canFinalizeSession = computed(() => {
    return this.apiService.canFinalizeSession();
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

  // Signal pour contrôler le refresh automatique
  private readonly backgroundRefreshEnabled = signal(true);

  constructor() {
    // Effect pour rafraîchir automatiquement en arrière-plan
    effect(() => {
      if (this.currentSession() && this.backgroundRefreshEnabled()) {
        const interval = setInterval(async () => {
          // Refresh en arrière-plan seulement si la page est visible
          if (!document.hidden) {
            await this.refreshDataSilently();
          }
        }, 60000); // Refresh toutes les 60 secondes (moins fréquent)

        return () => clearInterval(interval);
      }
      return; // Retourner undefined quand pas de session
    });

    // Arrêter le refresh auto quand l'utilisateur interagit
    this.pauseAutoRefreshOnUserActivity();
  }

  /**
   * Refresh silencieux des données sans indicateurs de loading
   */
  private async refreshDataSilently(): Promise<void> {
    try {
      // Utiliser la méthode silencieuse de l'ApiService
      this.apiService.refreshDataSilently();
      console.log('🔄 Refresh silencieux des données effectué');
    } catch (error) {
      console.error('❌ Erreur lors du refresh silencieux:', error);
    }
  }

  /**
   * Pause le refresh automatique pendant l'activité utilisateur
   */
  private pauseAutoRefreshOnUserActivity(): void {
    let activityTimeout: number;
    
    const resetActivityTimer = () => {
      this.backgroundRefreshEnabled.set(false);
      clearTimeout(activityTimeout);
      
      // Reprendre le refresh après 2 minutes d'inactivité
      activityTimeout = window.setTimeout(() => {
        this.backgroundRefreshEnabled.set(true);
        console.log('🔄 Refresh automatique réactivé après inactivité');
      }, 120000); // 2 minutes
    };

    // Écouter les événements d'activité utilisateur
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
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

  async finalizeSession(): Promise<void> {
    const session = this.currentSession();
    if (!session || this.completingSession() || !this.canFinalizeSession()) return;

    this.completingSession.set(true);
    try {
      console.log('🚀 Finalisation de la session:', session.id);
      
      // Utiliser la méthode complète qui finalise et complète la session
      await this.apiService.finalizeAndCompleteSession(session.id);
      
      console.log('✅ Session finalisée avec succès!');
      
      // Rediriger vers l'historique après finalisation
      // this.router.navigate(['/history']);
      
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de la session');
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
      console.log('📤 Début sauvegarde tâche:', modal.task.id);
      console.log('📸 Photos à uploader:', modal.photos.length);
      
      // Upload des photos d'abord
      const photoUrls: string[] = [];
      if (modal.photos.length > 0) {
        console.log('🔄 Upload des photos en cours...');
        for (let i = 0; i < modal.photos.length; i++) {
          const photo = modal.photos[i];
          console.log(`📷 Upload photo ${i + 1}/${modal.photos.length}:`, photo.name);
          try {
            const url = await this.apiService.uploadPhoto(photo);
            photoUrls.push(url);
            console.log(`✅ Photo ${i + 1} uploadée:`, url);
          } catch (photoError) {
            console.error(`❌ Erreur upload photo ${i + 1}:`, photoError);
            // Continuer même si une photo échoue
          }
        }
        console.log(`🎯 ${photoUrls.length}/${modal.photos.length} photos uploadées avec succès`);
      }

      // Mettre à jour le statut temporaire via l'API service
      const taskId = modal.task.id;
      const updateData = {
        status: modal.status,
        performed_by: modal.performer || undefined,
        notes: modal.notes || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined
      };
      
      console.log('💾 Mise à jour statut tâche:', updateData);
      this.apiService.updateTodayTaskStatus(taskId, updateData);

      console.log('✅ Sauvegarde terminée avec succès');
      this.closeTaskModal();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      // Afficher l'erreur à l'utilisateur
      alert(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      this.savingTask.set(false);
    }
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log('📁 Sélection de fichiers détectée');
    console.log('📎 Files:', input.files);
    
    if (input.files) {
      const newPhotos = Array.from(input.files);
      console.log('📸 Nouvelles photos sélectionnées:', newPhotos.length);
      newPhotos.forEach((photo, index) => {
        console.log(`  ${index + 1}. ${photo.name} (${photo.size} bytes, ${photo.type})`);
      });
      
      this.taskModal.update(modal => {
        const updatedPhotos = [...modal.photos, ...newPhotos];
        console.log('📋 Total photos dans modal:', updatedPhotos.length);
        return {
          ...modal,
          photos: updatedPhotos
        };
      });
    } else {
      console.log('❌ Aucun fichier sélectionné');
    }
  }

  removePhoto(index: number): void {
    console.log('🗑️ Suppression photo à l\'index:', index);
    this.taskModal.update(modal => {
      const updatedPhotos = modal.photos.filter((_, i) => i !== index);
      console.log('📋 Photos restantes:', updatedPhotos.length);
      return {
        ...modal,
        photos: updatedPhotos
      };
    });
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
      en_cours: 'badge-primary',
      completee: 'badge-success',
      incomplete: 'badge-warning'
    };
    return classes[status as keyof typeof classes] || 'badge-gray';
  }

  getSessionStatusLabel(status: CleaningSession['status']): string {
    const labels = {
      en_cours: 'En cours',
      completee: 'Terminée',
      incomplete: 'Incomplète'
    };
    return labels[status as keyof typeof labels] || status;
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