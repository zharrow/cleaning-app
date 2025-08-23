// ========================================
// Composant Historique - src/app/features/history/session-history/session-history.component.ts
// ========================================
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Interface pour les sessions d'historique
 */
interface HistorySession {
  readonly id: string;
  readonly date: string;
  readonly status: 'completed' | 'incomplete' | 'in_progress';
  readonly total_tasks: number;
  readonly completed_tasks: number;
  readonly duration?: number;
  readonly performer_count: number;
  readonly created_at: string;
}

/**
 * Interface pour les filtres
 */
interface HistoryFilters {
  period: string;
  status: string;
}

/**
 * Composant d'historique des sessions
 */
@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Historique des sessions</h1>
            <p class="page-subtitle">
              Consultez les sessions de nettoyage passées
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <button class="btn btn-secondary" (click)="exportHistory()">
              <span class="text-lg">📊</span>
              Exporter
            </button>
            <a routerLink="/session" class="btn btn-primary">
              <span class="text-lg">📋</span>
              Session actuelle
            </a>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Sessions totales</p>
                <p class="text-2xl font-bold text-gray-900">{{ mockSessions().length }}</p>
              </div>
              <span class="text-3xl">📊</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Complètes</p>
                <p class="text-2xl font-bold text-success-600">{{ completedCount() }}</p>
              </div>
              <span class="text-3xl">✅</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Taux de réussite</p>
                <p class="text-2xl font-bold text-primary-600">{{ successRate() }}%</p>
              </div>
              <span class="text-3xl">📈</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Temps moyen</p>
                <p class="text-2xl font-bold text-warning-600">{{ averageDuration() }}min</p>
              </div>
              <span class="text-3xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="card mb-6">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label text-sm">Période</label>
              <select 
                class="form-input form-select" 
                [value]="filters().period"
                (change)="updateFilter('period', $event)"
              >
                <option value="all">Toute la période</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
              </select>
            </div>
            
            <div>
              <label class="form-label text-sm">Statut</label>
              <select 
                class="form-input form-select" 
                [value]="filters().status"
                (change)="updateFilter('status', $event)"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Complètes</option>
                <option value="incomplete">Incomplètes</option>
                <option value="in_progress">En cours</option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button class="btn btn-secondary" (click)="resetFilters()">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des sessions -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Statut</th>
                <th>Progression</th>
                <th>Durée</th>
                <th>Exécutants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (session of filteredSessions(); track session.id) {
                <tr>
                  <td>
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ formatDate(session.date) }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ formatTime(session.created_at) }}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      [class]="getStatusBadgeClass(session.status)"
                    >
                      {{ getStatusLabel(session.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-primary-600 h-2 rounded-full transition-all"
                          [style.width.%]="getProgressPercentage(session)"
                        ></div>
                      </div>
                      <span class="text-sm text-gray-600 min-w-max">
                        {{ session.completed_tasks }}/{{ session.total_tasks }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="text-gray-600">
                      {{ session.duration ? session.duration + 'min' : '-' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-gray-600">
                      {{ session.performer_count }} personne(s)
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <a 
                        [routerLink]="['/history', session.id]"
                        class="btn btn-ghost btn-sm"
                      >
                        👁️ Voir
                      </a>
                      <button 
                        class="btn btn-ghost btn-sm"
                        (click)="downloadReport(session.id)"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (filteredSessions().length === 0) {
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">📚</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune session trouvée
            </h3>
            <p class="text-gray-600 mb-4">
              Aucune session ne correspond à vos critères de recherche.
            </p>
            <button class="btn btn-secondary" (click)="resetFilters()">
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SessionHistoryComponent {
  // Filtres
  readonly filters = signal<HistoryFilters>({
    period: 'all',
    status: 'all'
  });

  // Mock data - à remplacer par l'API
  readonly mockSessions = signal<HistorySession[]>([
    {
      id: '1',
      date: '2024-01-15',
      status: 'completed',
      total_tasks: 25,
      completed_tasks: 25,
      duration: 180,
      performer_count: 3,
      created_at: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      date: '2024-01-14',
      status: 'incomplete',
      total_tasks: 25,
      completed_tasks: 22,
      duration: 160,
      performer_count: 2,
      created_at: '2024-01-14T08:15:00Z'
    },
    {
      id: '3',
      date: '2024-01-13',
      status: 'completed',
      total_tasks: 24,
      completed_tasks: 24,
      duration: 175,
      performer_count: 3,
      created_at: '2024-01-13T08:30:00Z'
    }
  ]);

  // Computed
  readonly completedCount = computed(() => 
    this.mockSessions().filter(s => s.status === 'completed').length
  );

  readonly successRate = computed(() => {
    const sessions = this.mockSessions();
    if (sessions.length === 0) return 0;
    return Math.round((this.completedCount() / sessions.length) * 100);
  });

  readonly averageDuration = computed(() => {
    const sessions = this.mockSessions().filter(s => s.duration);
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return Math.round(total / sessions.length);
  });

  readonly filteredSessions = computed(() => {
    let sessions = this.mockSessions();
    const currentFilters = this.filters();

    if (currentFilters.status !== 'all') {
      sessions = sessions.filter(s => s.status === currentFilters.status);
    }

    // TODO: Implémenter le filtrage par période

    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  /**
   * Gestion des filtres
   */
  updateFilter(field: keyof HistoryFilters, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    this.filters.update(filters => ({
      ...filters,
      [field]: value
    }));
  }

  /**
   * Actions
   */
  resetFilters(): void {
    this.filters.set({
      period: 'all',
      status: 'all'
    });
  }

  exportHistory(): void {
    // TODO: Implémenter l'export
    console.log('Export historique');
  }

  downloadReport(sessionId: string): void {
    // TODO: Implémenter le téléchargement
    console.log('Download report:', sessionId);
  }

  /**
   * Utilitaires
   */
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(date));
  }

  formatTime(timestamp: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  getStatusLabel(status: string): string {
    const labels = {
      completed: 'Terminée',
      incomplete: 'Incomplète',
      in_progress: 'En cours'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      completed: 'badge-success',
      incomplete: 'badge-warning',
      in_progress: 'badge-primary'
    };
    return classes[status as keyof typeof classes] || 'badge-gray';
  }

  getProgressPercentage(session: HistorySession): number {
    return session.total_tasks > 0 
      ? (session.completed_tasks / session.total_tasks) * 100 
      : 0;
  }
}