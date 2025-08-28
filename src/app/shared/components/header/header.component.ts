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
    <!-- Header moderne avec hiérarchie visuelle claire -->
    <header class="header-main">
      
      <!-- Ligne principale du header -->
      <div class="header-top">
        <!-- Branding et navigation contextuelle -->
        <div class="header-brand">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8">
                <path d="M3 12h18m-9-9v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            <div class="brand-text">
              <h1 class="brand-name">CleanTrack</h1>
              <span class="brand-tagline">Tableau de bord</span>
            </div>
          </div>
        </div>

        <!-- Zone centrale: Status et progression condensée -->
        <div class="header-center">
          <div class="status-overview">
            <!-- Progression principale -->
            <div class="progress-summary">
              <div class="progress-circle">
                <svg class="progress-ring" viewBox="0 0 36 36">
                  <circle class="progress-ring-bg" cx="18" cy="18" r="16"></circle>
                  <circle 
                    class="progress-ring-fill" 
                    cx="18" 
                    cy="18" 
                    r="16"
                    [style.stroke-dasharray]="circumference() + ' ' + circumference()"
                    [style.stroke-dashoffset]="dashOffset()"
                  ></circle>
                </svg>
                <div class="progress-text">
                  <span class="progress-percentage">{{ progressStats().percentage }}%</span>
                </div>
              </div>
              <div class="progress-details">
                <span class="progress-label">Session en cours</span>
                <span class="progress-subtitle">{{ progressStats().completed }}/{{ progressStats().total }} tâches</span>
              </div>
            </div>

            <!-- Métriques rapides -->
            <div class="metrics-quick">
              <div class="metric-item" [class.metric-active]="progressStats().inProgress > 0">
                <div class="metric-value">{{ progressStats().inProgress }}</div>
                <div class="metric-label">En cours</div>
                <div class="metric-indicator in-progress"></div>
              </div>
              <div class="metric-item" [class.metric-warning]="progressStats().blocked > 0">
                <div class="metric-value">{{ progressStats().blocked }}</div>
                <div class="metric-label">Bloquées</div>
                <div class="metric-indicator blocked"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions et contrôles -->
        <div class="header-actions">
          
          <!-- Status système -->
          <div class="system-status">
            @if (syncInProgress()) {
              <div class="status-indicator syncing">
                <div class="status-dot"></div>
                <span>Sync...</span>
              </div>
            } @else {
              <div class="status-indicator online">
                <div class="status-dot"></div>
                <span>En ligne</span>
              </div>
            }
          </div>

          <!-- Contrôles -->
          <div class="header-controls">
            <button
              (click)="refreshData()"
              [disabled]="refreshing()"
              class="control-button"
              [class.control-loading]="refreshing()"
              title="Actualiser"
            >
              @if (refreshing()) {
                <div class="spinner-small"></div>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
                  </path>
                </svg>
              }
            </button>

            <!-- Menu actions -->
            <div class="action-menu" [class.menu-open]="actionMenuOpen()" (click)="toggleActionMenu()">
              <button class="menu-trigger">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
              @if (actionMenuOpen()) {
                <div class="menu-dropdown">
                  <button class="menu-item">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Rapport
                  </button>
                  <button class="menu-item">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Paramètres
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de progression moderne et discrète -->
      @if (showDetailedProgress()) {
        <div class="progress-bar-container">
          <div class="progress-track">
            <div class="progress-segments">
              <!-- Segments colorés par statut -->
              <div class="progress-segment completed" 
                   [style.width.%]="getSegmentWidth('completed')"></div>
              <div class="progress-segment in-progress" 
                   [style.width.%]="getSegmentWidth('inProgress')"></div>
              <div class="progress-segment blocked" 
                   [style.width.%]="getSegmentWidth('blocked')"></div>
            </div>
            
            <!-- Indicateur de position actuelle -->
            <div class="progress-pointer" 
                 [style.left.%]="progressStats().percentage"></div>
          </div>
          
          <!-- Labels contextuels -->
          <div class="progress-labels">
            <span class="label-start">Début</span>
            <span class="label-current">{{ progressStats().percentage }}% terminé</span>
            <span class="label-end">Objectif</span>
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    /* =======================
       HEADER PRINCIPAL 
       ======================= */
    .header-main {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    /* =======================
       LAYOUT PRINCIPAL 
       ======================= */
    .header-top {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      padding: 1rem 2rem;
      gap: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* =======================
       BRANDING 
       ======================= */
    .header-brand {
      display: flex;
      align-items: center;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.2;
    }

    .brand-tagline {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* =======================
       ZONE CENTRALE - STATUS 
       ======================= */
    .header-center {
      display: flex;
      justify-content: center;
    }

    .status-overview {
      display: flex;
      align-items: center;
      gap: 3rem;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    /* =======================
       PROGRESSION CIRCULAIRE 
       ======================= */
    .progress-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-circle {
      position: relative;
      width: 64px;
      height: 64px;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-ring-bg {
      fill: none;
      stroke: #e5e7eb;
      stroke-width: 2;
    }

    .progress-ring-fill {
      fill: none;
      stroke: #3b82f6;
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .progress-percentage {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .progress-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .progress-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .progress-subtitle {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* =======================
       MÉTRIQUES RAPIDES 
       ======================= */
    .metrics-quick {
      display: flex;
      gap: 1.5rem;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
      background: rgba(255, 255, 255, 0.5);
    }

    .metric-item.metric-active {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .metric-item.metric-warning {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .metric-indicator.in-progress {
      background: #3b82f6;
      animation: pulse 2s infinite;
    }

    .metric-indicator.blocked {
      background: #ef4444;
      animation: pulse 2s infinite;
    }

    /* =======================
       ACTIONS ET CONTRÔLES 
       ======================= */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .system-status {
      display: flex;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .status-indicator.online {
      background: rgba(34, 197, 94, 0.1);
      color: #15803d;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .status-indicator.syncing {
      background: rgba(59, 130, 246, 0.1);
      color: #1d4ed8;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .syncing .status-dot {
      animation: pulse 1.5s infinite;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .control-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.8);
      color: #64748b;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .control-button:hover:not(:disabled) {
      background: #ffffff;
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .control-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* =======================
       MENU ACTIONS 
       ======================= */
    .action-menu {
      position: relative;
    }

    .menu-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.8);
      color: #64748b;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .menu-trigger:hover {
      background: #ffffff;
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.2);
    }

    .menu-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 160px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      z-index: 200;
      animation: menu-appear 0.2s ease-out;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      border: none;
      background: none;
      color: #374151;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .menu-item:hover {
      background: #f3f4f6;
      color: #1f2937;
    }

    /* =======================
       BARRE DE PROGRESSION 
       ======================= */
    .progress-bar-container {
      padding: 0 2rem 1rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .progress-track {
      position: relative;
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-segments {
      display: flex;
      height: 100%;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-segment {
      height: 100%;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-segment.completed {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .progress-segment.in-progress {
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    }

    .progress-segment.blocked {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-pointer {
      position: absolute;
      top: -2px;
      width: 10px;
      height: 10px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      transform: translateX(-50%);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .label-current {
      font-weight: 600;
      color: #3b82f6;
    }

    /* =======================
       ANIMATIONS 
       ======================= */
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }

    @keyframes menu-appear {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* =======================
       RESPONSIVE 
       ======================= */
    @media (max-width: 1024px) {
      .header-top {
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        padding: 1rem;
      }

      .metrics-quick {
        gap: 1rem;
      }

      .status-overview {
        gap: 2rem;
      }
    }

    @media (max-width: 768px) {
      .header-top {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 1rem;
      }

      .status-overview {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .metrics-quick {
        justify-content: center;
      }

      .progress-bar-container {
        padding: 0 1rem 1rem;
      }
    }
  `]
})
export class HeaderComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  
  // Signaux d'état
  readonly refreshing = signal(false);
  readonly actionMenuOpen = signal(false);
  readonly showDetailedProgress = signal(true);
  
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

  // Computed pour la progression circulaire
  readonly circumference = computed(() => 2 * Math.PI * 16);
  
  readonly dashOffset = computed(() => {
    const percentage = this.progressStats().percentage;
    return this.circumference() - (percentage / 100) * this.circumference();
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
    // Simulation de données pour démontrer les effets visuels
    setTimeout(() => {
      this.mockProgressData.set({
        todo: 3,
        inProgress: 2,
        completed: 8,
        blocked: 1,
        total: 14,
        percentage: 65
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

  /**
   * Gestion du menu d'actions
   */
  toggleActionMenu(): void {
    this.actionMenuOpen.update(open => !open);
  }

  /**
   * Calcule la largeur des segments de progression
   */
  getSegmentWidth(type: 'completed' | 'inProgress' | 'blocked'): number {
    const stats = this.progressStats();
    if (stats.total === 0) return 0;
    
    switch (type) {
      case 'completed':
        return (stats.completed / stats.total) * 100;
      case 'inProgress':
        return (stats.inProgress / stats.total) * 100;
      case 'blocked':
        return (stats.blocked / stats.total) * 100;
      default:
        return 0;
    }
  }
}