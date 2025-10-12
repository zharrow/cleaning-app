// ========================================
// Header avec logo et barre de progression
// src/app/shared/components/header/header.component.ts
// ========================================
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { EnterpriseService } from '../../../core/services/enterprise.service';

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
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);
  readonly enterpriseService = inject(EnterpriseService);
  
  // Signaux d'état
  readonly refreshing = signal(false);
  readonly actionMenuOpen = signal(false);
  
  // Computed signals pour l'entreprise
  readonly enterpriseName = computed(() => this.enterpriseService.enterpriseName());
  readonly enterpriseLogo = computed(() => this.enterpriseService.enterpriseLogo());
  
  // Computed signals avec vraies données
  readonly progressStats = computed((): ProgressStats => {
    const todayTasks = this.apiService.todaySessionTasks();
    
    // Si pas de tâches, retourner des stats vides
    if (todayTasks.length === 0) {
      return {
        todo: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
        total: 0,
        percentage: 0
      };
    }

    // Calculer les stats basées sur les vrais statuts temporaires
    const todo = todayTasks.filter(task => task.status === 'todo').length;
    const inProgress = todayTasks.filter(task => task.status === 'in_progress').length;
    const completed = todayTasks.filter(task => task.status === 'done').length;
    const blocked = todayTasks.filter(task => ['blocked', 'skipped'].includes(task.status)).length;
    const total = todayTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      todo,
      inProgress,
      completed,
      blocked,
      total,
      percentage
    };
  });
  
  readonly syncInProgress = computed(() => {
    return this.apiService.isLoading() || this.authService.isLoading();
  });

  // Computed pour la progression circulaire
  readonly circumference = computed(() => 2 * Math.PI * 16);
  
  readonly dashOffset = computed(() => {
    const percentage = this.progressStats().percentage;
    return this.circumference() - (percentage / 100) * this.circumference();
  });
  
  
  constructor() {
    // Charger les données de l'entreprise au démarrage
    this.loadEnterpriseData();
  }

  /**
   * Charger les données de l'entreprise
   */
  private async loadEnterpriseData(): Promise<void> {
    try {
      await this.enterpriseService.loadEnterpriseData();
    } catch (error) {
      console.warn('Impossible de charger les données de l\'entreprise:', error);
    }
  }

  /**
   * Gestion des erreurs de logo
   */
  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.warn('Erreur lors du chargement du logo:', img.src);
    // Le logo sera remplacé par le placeholder via le template Angular
  }
  
  /**
   * Actions
   */
  async refreshData(): Promise<void> {
    if (this.refreshing()) return;
    
    this.refreshing.set(true);
    try {
      // Rafraîchir les données API
      this.apiService.refreshData();
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