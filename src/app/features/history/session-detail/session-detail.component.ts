// ========================================
// Composant Détail de session - src/app/features/history/session-detail/session-detail.component.ts
// ========================================
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, type CleaningSession, type CleaningLog, type PdfExportOptions } from '../../../core/services/api.service';

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
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css'
})
export class SessionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);

  // Signals d'état
  readonly sessionId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly downloadingReport = signal(false);
  readonly selectedPhoto = signal<string | null>(null);

  // Export modal
  readonly showingExportModal = signal(false);
  readonly exportOptions = signal<PdfExportOptions>({
    includePhotos: true,
    maxPhotos: 10,
    formatType: 'standard'
  });

  // Session data chargée depuis l'API
  readonly sessionDetail = signal<SessionDetail | null>(null);

  async ngOnInit() {
    // Récupérer l'ID de la session depuis les paramètres de route
    this.route.paramMap.subscribe(params => {
      const sessionId = params.get('sessionId');
      if (sessionId) {
        this.sessionId.set(sessionId);
        this.loadSessionDetail(sessionId);
      }
    });
  }

  /**
   * Charge les détails complets d'une session
   */
  async loadSessionDetail(sessionId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // Charger la session de base
      const session = await this.apiService.getSession(sessionId);

      // Charger les logs de la session
      const logs = await this.apiService.getSessionLogs(sessionId);

      // Charger les statistiques pour les données enrichies
      const stats = await this.apiService.getSessionStatistics(sessionId);

      // Construire l'objet SessionDetail enrichi
      const sessionDetail: SessionDetail = {
        ...session,
        logs: logs || [],
        performers: stats.top_performers?.map((p: any) => p.name) || [],
        photos: logs?.flatMap(log => log.photos || []).filter(Boolean) || [],
        notes: logs?.map(log => log.notes).filter((note): note is string => Boolean(note)) || []
      };

      this.sessionDetail.set(sessionDetail);
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
      this.sessionDetail.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed
  readonly groupedLogs = computed(() => {
    const session = this.sessionDetail();
    if (!session) return [];

    const groups = new Map<string, CleaningLog[]>();
    
    session.logs.forEach(log => {
      const roomId = log.assigned_task.room_id || log.assigned_task.room.id;
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


  /**
   * Actions
   */
  async downloadReport(): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId || this.downloadingReport()) return;

    this.downloadingReport.set(true);
    try {
      await this.apiService.exportSessionToPdf(sessionId);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du rapport PDF');
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
   * Gestion modal d'export
   */
  showExportModal(): void {
    this.showingExportModal.set(true);
  }

  hideExportModal(): void {
    this.showingExportModal.set(false);
  }

  updateExportOption(key: keyof PdfExportOptions, event: any): void {
    const currentOptions = this.exportOptions();
    let value: any;

    if (key === 'includePhotos') {
      value = event.target.checked;
    } else if (key === 'maxPhotos') {
      value = parseInt(event.target.value);
    } else {
      value = event.target.value;
    }

    this.exportOptions.set({
      ...currentOptions,
      [key]: value
    });
  }

  async downloadReportWithOptions(): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId || this.downloadingReport()) return;

    this.downloadingReport.set(true);
    try {
      await this.apiService.exportSessionToPdf(sessionId, this.exportOptions());
      this.hideExportModal();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du rapport PDF');
    } finally {
      this.downloadingReport.set(false);
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