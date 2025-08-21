// ========================================
// Composant Dashboard Angular 19
// src/app/features/dashboard/dashboard.component.ts
// ========================================
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, type DashboardStats, type CleaningSession } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Interface pour les cartes de statistiques
 */
interface StatCard {
  readonly title: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly icon: string;
  readonly color: 'primary' | 'success' | 'warning' | 'danger';
  readonly trend?: {
    readonly value: number;
    readonly label: string;
    readonly isPositive: boolean;
  };
}

/**
 * Interface pour les actions rapides
 */
interface QuickAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly route?: string;
  readonly action?: () => void;
  readonly disabled?: boolean;
  readonly color: 'primary' | 'secondary' | 'success';
}

/**
 * Composant Dashboard principal
 * Affiche les statistiques, progression et actions rapides
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      
      <!-- En-tête avec salutation -->
      <div class="page-header">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="page-title">
              {{ getGreeting() }}
              @if (authService.appUser(); as user) {
                <span class="text-primary-600">{{ getFirstName(user.full_name) }}</span>
              }
            </h1>
            <p class="page-subtitle">{{ getCurrentDateFormatted() }}</p>
          </div>
          
          <!-- Actions principales -->
          <div class="flex gap-3">
            @if (canStartSession()) {
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
                Nouvelle session
              </button>
            }
            
            @if (currentSession()) {
              <a 
                routerLink="/session" 
                class="btn btn-success"
              >
                <span class="text-lg">📋</span>
                Continuer la session
              </a>
            }
          </div>
        </div>
      </div>

      <!-- État de chargement -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          @for (i of [1,2,3,4]; track i) {
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-text mb-2"></div>
                <div class="skeleton skeleton-text w-1/2 mb-4"></div>
                <div class="skeleton skeleton-button"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        
        <!-- Cartes de statistiques -->
        @if (statCards().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            @for (card of statCards(); track card.title) {
              <div class="card hover-lift animate-fade-in">
                <div class="card-body">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                      <h3 class="text-sm font-medium text-gray-600 mb-1">
                        {{ card.title }}
                      </h3>
                      <p class="text-2xl font-bold" [class]="getStatValueClass(card.color)">
                        {{ card.value }}
                      </p>
                      @if (card.subtitle) {
                        <p class="text-sm text-gray-500 mt-1">{{ card.subtitle }}</p>
                      }
                    </div>
                    <div 
                      class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                      [class]="getStatIconClass(card.color)"
                    >
                      <span class="text-xl">{{ card.icon }}</span>
                    </div>
                  </div>
                  
                  @if (card.trend) {
                    <div class="flex items-center gap-1">
                      <span 
                        class="text-xs font-medium"
                        [class]="card.trend.isPositive ? 'text-success-600' : 'text-danger-600'"
                      >
                        {{ card.trend.isPositive ? '↗️' : '↘️' }} {{ card.trend.value }}%
                      </span>
                      <span class="text-xs text-gray-500">{{ card.trend.label }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Grille principale -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Progression du jour -->
          <div class="lg:col-span-2">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Progression du jour</h2>
                @if (todayProgress(); as progress) {
                  <p class="card-subtitle">
                    {{ progress.completed }} / {{ progress.total }} tâches complétées
                  </p>
                }
              </div>
              <div class="card-body">
                @if (todayProgress(); as progress) {
                  <!-- Barre de progression -->
                  <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-600">Avancement</span>
                      <span class="text-sm font-semibold text-gray-900">
                        {{ progress.percentage | number:'1.0-0' }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                        [style.width.%]="progress.percentage"
                      ></div>
                    </div>
                  </div>

                  <!-- Indicateurs de statut -->
                  @if (statusBreakdown(); as breakdown) {
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      @for (status of breakdown; track status.label) {
                        <div class="text-center">
                          <div 
                            class="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                            [style.background-color]="status.color"
                          >
                            <span class="text-white text-sm font-semibold">
                              {{ status.count }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-600">{{ status.label }}</p>
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <div class="text-center py-8">
                    <span class="text-4xl mb-4 block">📝</span>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      Aucune session active
                    </h3>
                    <p class="text-gray-600 mb-4">
                      Commencez une nouvelle session pour suivre votre progression.
                    </p>
                    @if (canStartSession()) {
                      <button 
                        class="btn btn-primary"
                        (click)="startNewSession()"
                        [disabled]="startingSession()"
                      >
                        Démarrer une session
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="space-y-6">
            
            <!-- Actions rapides -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Actions rapides</h2>
              </div>
              <div class="card-body">
                <div class="space-y-3">
                  @for (action of quickActions(); track action.id) {
                    @if (action.route) {
                      <a 
                        [routerLink]="action.route"
                        class="block p-4 rounded-lg border-2 border-transparent hover:border-primary-200 hover:bg-primary-50 transition-all duration-200"
                        [class.opacity-50]="action.disabled"
                        [class.pointer-events-none]="action.disabled"
                      >
                        <div class="flex items-start gap-3">
                          <span class="text-2xl">{{ action.icon }}</span>
                          <div class="flex-1">
                            <h4 class="font-medium text-gray-900 mb-1">
                              {{ action.title }}
                            </h4>
                            <p class="text-sm text-gray-600">
                              {{ action.description }}
                            </p>
                          </div>
                          <span class="text-gray-400">→</span>
                        </div>
                      </a>
                    } @else {
                      <button 
                        class="w-full p-4 rounded-lg border-2 border-transparent hover:border-primary-200 hover:bg-primary-50 transition-all duration-200 text-left"
                        [class.opacity-50]="action.disabled"
                        [disabled]="action.disabled"
                        (click)="action.action?.()"
                      >
                        <div class="flex items-start gap-3">
                          <span class="text-2xl">{{ action.icon }}</span>
                          <div class="flex-1">
                            <h4 class="font-medium text-gray-900 mb-1">
                              {{ action.title }}
                            </h4>
                            <p class="text-sm text-gray-600">
                              {{ action.description }}
                            </p>
                          </div>
                        </div>
                      </button>
                    }
                  }
                </div>
              </div>
            </div>

            <!-- Statistiques de la semaine -->
            @if (weeklyStats(); as stats) {
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Cette semaine</h2>
                </div>
                <div class="card-body">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Tâches complétées</span>
                      <span class="font-semibold text-gray-900">{{ stats.tasksCompleted }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Temps moyen/tâche</span>
                      <span class="font-semibold text-gray-900">{{ stats.averageTimePerTask }}min</span>
                    </div>
                    @if (stats.mostActivePerformer) {
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Plus actif</span>
                        <span class="font-semibold text-gray-900">{{ stats.mostActivePerformer }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Sessions récentes -->
        @if (recentSessions().length > 0) {
          <div class="mt-8">
            <div class="card">
              <div class="card-header">
                <div class="flex items-center justify-between">
                  <h2 class="card-title">Sessions récentes</h2>
                  <a routerLink="/history" class="text-sm text-primary-600 hover:text-primary-700">
                    Voir tout →
                  </a>
                </div>
              </div>
              <div class="card-body">
                <div class="overflow-x-auto">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Progression</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (session of recentSessions(); track session.id) {
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
                              [class]="getSessionStatusClass(session.status)"
                            >
                              {{ getSessionStatusLabel(session.status) }}
                            </span>
                          </td>
                          <td>
                            <div class="flex items-center gap-2">
                              <div class="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  class="bg-primary-600 h-2 rounded-full transition-all"
                                  [style.width.%]="getSessionProgress(session)"
                                ></div>
                              </div>
                              <span class="text-sm text-gray-600">
                                {{ session.completed_tasks }}/{{ session.total_tasks }}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button 
                              class="btn btn-ghost btn-sm"
                              (click)="viewSession(session.id)"
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .hover-lift {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
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
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: progress-shine 2s infinite;
    }

    @keyframes progress-shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `]
})
export class DashboardComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);

  // Signals d'état
  private readonly startingSession = signal(false);

  // Computed signals depuis l'API
  readonly dashboardData = computed(() => this.apiService.dashboardStats.value());
  readonly currentSession = computed(() => this.apiService.todaySession.value());
  readonly todayProgress = computed(() => this.apiService.todayProgress());
  readonly isLoading = computed(() => this.apiService.dashboardStats.isLoading());

  // Computed pour les données dérivées
  readonly canStartSession = computed(() => 
    this.authService.isAuthenticated() && !this.currentSession()
  );

  readonly statCards = computed((): StatCard[] => {
    const data = this.dashboardData();
    const progress = this.todayProgress();
    
    if (!data || !progress) return [];

    return [
      {
        title: 'Progression aujourd\'hui',
        value: `${progress.percentage.toFixed(0)}%`,
        subtitle: `${progress.completed}/${progress.total} tâches`,
        icon: '📊',
        color: 'primary',
        trend: progress.percentage > 75 ? {
          value: 12,
          label: 'vs hier',
          isPositive: true
        } : undefined
      },
      {
        title: 'Tâches cette semaine',
        value: data.weeklyStats.tasksCompleted,
        subtitle: 'tâches complétées',
        icon: '✅',
        color: 'success'
      },
      {
        title: 'Temps moyen',
        value: `${data.weeklyStats.averageTimePerTask}min`,
        subtitle: 'par tâche',
        icon: '⏱️',
        color: 'warning'
      },
      {
        title: 'Sessions actives',
        value: this.currentSession() ? 1 : 0,
        subtitle: 'en cours',
        icon: '🔄',
        color: this.currentSession() ? 'success' : 'danger'
      }
    ];
  });

  readonly statusBreakdown = computed(() => {
    const logs = this.apiService.todayLogs.value() || [];
    
    const breakdown = [
      {
        label: 'À faire',
        count: logs.filter(log => log.status === 'todo').length,
        color: '#9CA3AF'
      },
      {
        label: 'En cours',
        count: logs.filter(log => log.status === 'in_progress').length,
        color: '#3B82F6'
      },
      {
        label: 'Terminé',
        count: logs.filter(log => log.status === 'done').length,
        color: '#10B981'
      },
      {
        label: 'Bloqué',
        count: logs.filter(log => log.status === 'blocked').length,
        color: '#EF4444'
      }
    ];

    return breakdown.filter(item => item.count > 0);
  });

  readonly quickActions = computed((): QuickAction[] => [
    {
      id: 'session',
      title: 'Session du jour',
      description: 'Voir et gérer les tâches d\'aujourd\'hui',
      icon: '📋',
      route: '/session',
      color: 'primary'
    },
    {
      id: 'tasks',
      title: 'Toutes les tâches',
      description: 'Gérer l\'ensemble des tâches',
      icon: '📝',
      route: '/tasks',
      color: 'secondary'
    },
    ...(this.authService.isManager() ? [
      {
        id: 'manage',
        title: 'Administration',
        description: 'Gérer les pièces et tâches',
        icon: '⚙️',
        route: '/manage',
        color: 'secondary' as const
      }
    ] : []),
    {
      id: 'export',
      title: 'Exporter les données',
      description: 'Télécharger les rapports',
      icon: '📊',
      action: () => this.exportData(),
      color: 'success',
      disabled: !this.currentSession()
    }
  ]);

  readonly weeklyStats = computed(() => this.dashboardData()?.weeklyStats);
  readonly recentSessions = computed(() => this.dashboardData()?.recentSessions || []);

  constructor() {
    // Effect pour recharger les données périodiquement
    effect(() => {
      if (this.authService.isAuthenticated()) {
        const interval = setInterval(() => {
          this.apiService.refreshData();
        }, 30000); // Refresh toutes les 30 secondes

        // Cleanup à la destruction du composant
        return () => clearInterval(interval);
      }
    });
  }

  /**
   * Actions
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

  async exportData(): Promise<void> {
    const session = this.currentSession();
    if (!session) return;

    try {
      const blob = await this.apiService.downloadReport(session.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${this.formatDate(session.date)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  }

  viewSession(sessionId: string): void {
    // TODO: Naviguer vers la vue détaillée de la session
    console.log('Voir session:', sessionId);
  }

  /**
   * Utilitaires
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour ';
    if (hour < 18) return 'Bon après-midi ';
    return 'Bonsoir ';
  }

  getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
  }

  getCurrentDateFormatted(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatTime(timestamp: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  getStatValueClass(color: StatCard['color']): string {
    const classes = {
      primary: 'text-primary-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600'
    };
    return classes[color];
  }

  getStatIconClass(color: StatCard['color']): string {
    const classes = {
      primary: 'bg-primary-100 text-primary-600',
      success: 'bg-success-100 text-success-600',
      warning: 'bg-warning-100 text-warning-600',
      danger: 'bg-danger-100 text-danger-600'
    };
    return classes[color];
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

  getSessionProgress(session: CleaningSession): number {
    return session.total_tasks > 0 
      ? (session.completed_tasks / session.total_tasks) * 100 
      : 0;
  }
}