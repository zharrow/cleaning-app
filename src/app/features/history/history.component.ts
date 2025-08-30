import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, type CleaningSession } from '../../core/services/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">📚 Historique des sessions</h1>
            <p class="page-subtitle">
              Consultez toutes les sessions de nettoyage passées
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button 
              class="btn btn-primary"
              (click)="loadSessions()"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                <div class="spinner spinner-sm"></div>
              } @else {
                <span class="text-lg">🔄</span>
              }
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Sessions totales</p>
                <p class="text-2xl font-bold text-gray-900">{{ sessions().length }}</p>
              </div>
              <span class="text-3xl">📅</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Complétées</p>
                <p class="text-2xl font-bold text-green-600">{{ completedCount() }}</p>
              </div>
              <span class="text-3xl">✅</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">En cours</p>
                <p class="text-2xl font-bold text-blue-600">{{ inProgressCount() }}</p>
              </div>
              <span class="text-3xl">⏳</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Taux de réussite</p>
                <p class="text-2xl font-bold text-purple-600">{{ completionRate() }}%</p>
              </div>
              <span class="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des sessions -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 gap-6">
          @for (i of [1,2,3]; track i) {
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-text mb-2"></div>
                <div class="skeleton skeleton-text w-3/4 mb-4"></div>
                <div class="skeleton skeleton-button"></div>
              </div>
            </div>
          }
        </div>
      } @else if (sessions().length > 0) {
        <div class="grid grid-cols-1 gap-6">
          @for (session of sessions(); track session.id) {
            <div class="card hover-lift animate-fade-in">
              <div class="card-body">
                <div class="flex items-start justify-between">
                  <!-- Informations principales -->
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="text-lg font-semibold text-gray-900">
                        Session du {{ formatDate(session.date) }}
                      </h3>
                      <div 
                        class="badge"
                        [class]="getStatusClass(session.status)"
                      >
                        {{ getStatusLabel(session.status) }}
                      </div>
                    </div>
                    
                    <!-- Métadonnées -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div class="flex items-center gap-2">
                        <span class="text-base">📅</span>
                        <span>Créée le {{ formatDateTime(session.created_at) }}</span>
                      </div>
                      
                      @if (session.updated_at !== session.created_at) {
                        <div class="flex items-center gap-2">
                          <span class="text-base">🔄</span>
                          <span>Mise à jour {{ formatDateTime(session.updated_at) }}</span>
                        </div>
                      }
                      
                      @if (session.notes) {
                        <div class="flex items-center gap-2">
                          <span class="text-base">📝</span>
                          <span>Notes disponibles</span>
                        </div>
                      }
                    </div>
                    
                    @if (session.notes) {
                      <div class="bg-gray-50 p-3 rounded-lg mb-4">
                        <p class="text-sm text-gray-700">{{ session.notes }}</p>
                      </div>
                    }
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center gap-2 ml-4">
                    <button 
                      class="btn btn-secondary btn-sm"
                      [routerLink]="['/history/session', session.id]"
                    >
                      <span class="text-sm">👁️</span>
                      Voir détails
                    </button>
                    
                    @if (session.status === 'completee') {
                      <button 
                        class="btn btn-primary btn-sm"
                        (click)="exportSession(session.id)"
                        [disabled]="exportingId() === session.id"
                      >
                        @if (exportingId() === session.id) {
                          <div class="spinner spinner-xs"></div>
                        } @else {
                          <span class="text-sm">📄</span>
                        }
                        PDF
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Aucune session -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">📅</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune session trouvée
            </h3>
            <p class="text-gray-600 mb-6">
              Les sessions de nettoyage apparaîtront ici une fois créées.
            </p>
            <button 
              class="btn btn-primary"
              routerLink="/session"
            >
              Aller à la session du jour
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hover-lift {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .spinner-xs {
      width: 1rem;
      height: 1rem;
    }
  `]
})
export class HistoryComponent {
  private readonly apiService = inject(ApiService);
  
  // État local
  readonly sessions = signal<CleaningSession[]>([]);
  readonly isLoading = signal(false);
  readonly exportingId = signal<string | null>(null);

  // Statistiques calculées
  readonly completedCount = computed(() => 
    this.sessions().filter(s => s.status === 'completee').length
  );
  
  readonly inProgressCount = computed(() => 
    this.sessions().filter(s => s.status === 'en_cours').length
  );
  
  readonly completionRate = computed(() => {
    const total = this.sessions().length;
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  async ngOnInit() {
    await this.loadSessions();
  }

  /**
   * Charge la liste des sessions depuis l'API
   */
  async loadSessions(): Promise<void> {
    this.isLoading.set(true);
    try {
      const token = await this.apiService.getAuthToken();
      const sessionsData = await this.apiService.httpGet<CleaningSession[]>('/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Trier par date décroissante (plus récentes en premier)
      const sortedSessions = (sessionsData || []).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      this.sessions.set(sortedSessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      this.sessions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Exporte une session en PDF
   */
  async exportSession(sessionId: string): Promise<void> {
    this.exportingId.set(sessionId);
    try {
      await this.apiService.exportSessionToPdf(sessionId);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      this.exportingId.set(null);
    }
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formate une datetime complète
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'completee': return 'badge-success';
      case 'en_cours': return 'badge-warning';
      case 'incomplete': return 'badge-error';
      default: return 'badge-gray';
    }
  }

  /**
   * Retourne le label du statut
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'completee': return 'Terminée';
      case 'en_cours': return 'En cours';
      case 'incomplete': return 'Incomplète';
      default: return status;
    }
  }
}