// ========================================
// Header avec logo et barre de progression
// src/app/shared/components/header/header.component.ts
// ========================================
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour les statistiques de progression
 */
interface ProgressStats {
  readonly todo: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly blocked: number;
  readonly total: number;
  readonly percentage: number;
}

/**
 * Header avec barre de progression globale
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        
        <!-- Section gauche: Logo et titre -->
        <div class="flex items-center">
          <div class="flex items-center mr-8">
            <span class="text-2xl mr-2">🧹</span>
            <span class="text-xl font-bold text-gray-900">CleanTrack</span>
          </div>
          
          <!-- Barre de progression globale -->
          <div class="flex items-center space-x-6">
            <h2 class="text-lg font-semibold text-gray-900">Progression globale</h2>
            <div class="flex items-center space-x-4">
              <span class="text-2xl font-bold text-blue-600">{{ progressStats().percentage }}%</span>
              
              <!-- Indicateurs de statut -->
              <div class="flex items-center space-x-4">
                <!-- À faire -->
                <div class="flex items-center space-x-2">
                  <div class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <span class="text-sm font-bold text-gray-600">{{ progressStats().todo }}</span>
                  </div>
                  <span class="text-sm text-gray-600">À faire</span>
                </div>
                
                <!-- En cours -->
                <div class="flex items-center space-x-2">
                  <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span class="text-sm font-bold text-blue-600">{{ progressStats().inProgress }}</span>
                  </div>
                  <span class="text-sm text-gray-600">En cours</span>
                </div>
                
                <!-- Terminé -->
                <div class="flex items-center space-x-2">
                  <div class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <span class="text-sm font-bold text-green-600">{{ progressStats().completed }}</span>
                  </div>
                  <span class="text-sm text-gray-600">Terminé</span>
                </div>
                
                <!-- Bloqué -->
                <div class="flex items-center space-x-2">
                  <div class="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                    <span class="text-sm font-bold text-red-600">{{ progressStats().blocked }}</span>
                  </div>
                  <span class="text-sm text-gray-600">Bloqué</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Section droite: Actions -->
        <div class="flex items-center space-x-4">
          
          <!-- Indicateur de synchronisation -->
          @if (syncInProgress()) {
            <div class="flex items-center space-x-2 text-sm text-blue-600">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Synchronisation...</span>
            </div>
          }
          
          <!-- Info session automatique -->
          <div class="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            Session créée automatiquement
          </div>
          
          <!-- Bouton actualiser -->
          <button
            (click)="refreshData()"
            [disabled]="refreshing()"
            class="flex items-center space-x-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Actualiser les données"
          >
            @if (refreshing()) {
              <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            }
          </button>
        </div>
      </div>
      
      <!-- Barre de progression visuelle -->
      <div class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-700 ease-out"
            [style.width.%]="progressStats().percentage"
          ></div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    /* Animation pour la barre de progression */
    .transition-all {
      transition: all 0.3s ease-in-out;
    }
    
    /* Effet hover sur les boutons */
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Style pour les indicateurs de statut */
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class HeaderComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  
  // Signaux d'état
  readonly refreshing = signal(false);
  
  // Mock data pour la progression (à remplacer par les vraies données)
  private readonly mockProgressData = signal<ProgressStats>({
    todo: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    total: 0,
    percentage: 0
  });
  
  // Computed signals
  readonly progressStats = computed(() => this.mockProgressData());
  
  readonly syncInProgress = computed(() => {
    return this.authService.isLoading();
  });
  
  
  constructor() {
    // Simuler des données de progression (à remplacer par un service)
    this.loadProgressData();
  }
  
  /**
   * Charger les données de progression
   * À remplacer par un appel au service API
   */
  private loadProgressData(): void {
    // Simulation de données
    setTimeout(() => {
      this.mockProgressData.set({
        todo: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
        total: 0,
        percentage: 0
      });
    }, 100);
  }
  
  /**
   * Actions
   */
  async refreshData(): Promise<void> {
    if (this.refreshing()) return;
    
    this.refreshing.set(true);
    try {
      // Recharger les données de progression
      this.loadProgressData();
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Erreur lors du refresh:', error);
    } finally {
      this.refreshing.set(false);
    }
  }
}