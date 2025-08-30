// ========================================
// Dashboard corrigé avec gestion du chargement
// src/app/features/dashboard/dashboard.component.ts
// ========================================
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

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
 * Interface pour les activités récentes
 */
interface RecentActivity {
  readonly id: string;
  readonly title: string;
  readonly timestamp: string;
  readonly status: string;
  readonly statusClass: string;
  readonly icon: string;
}

/**
 * Composant Dashboard principal avec gestion du chargement améliorée
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center min-h-screen">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded animate-spin"></div>
            <p class="text-gray-600">Chargement du tableau de bord...</p>
            @if (loadingDetails()) {
              <p class="text-sm text-gray-500">{{ loadingDetails() }}</p>
            }
          </div>
        </div>
      } @else {
        <div class="page-container">
          
          <!-- En-tête avec salutation -->
          <div class="page-header">
            <div class="text-center">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ getGreeting() }}
                @if (displayName(); as name) {
                  <span class="text-blue-600">{{ name }}</span>
                }
              </h1>
              <p class="text-gray-600 mb-4">{{ getCurrentDateFormatted() }}</p>
              
              <!-- État utilisateur -->
              <div class="flex justify-center items-center gap-4">
                <span class="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                  ✅ Connecté
                </span>
                @if (userRole()) {
                  <span class="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    {{ getRoleLabel() }}
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Cartes de statistiques -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            @for (card of statCards(); track card.title) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">{{ card.title }}</p>
                    <p class="text-2xl font-bold text-gray-900 mt-2">{{ card.value }}</p>
                    @if (card.subtitle) {
                      <p class="text-xs text-gray-500 mt-1">{{ card.subtitle }}</p>
                    }
                  </div>
                  <div class="text-3xl opacity-80">{{ card.icon }}</div>
                </div>
                
                @if (card.trend) {
                  <div class="flex items-center mt-4 text-sm">
                    @if (card.trend.isPositive) {
                      <span class="text-green-600 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7h-10"></path>
                        </svg>
                        +{{ card.trend.value }}%
                      </span>
                    } @else {
                      <span class="text-red-600 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10"></path>
                        </svg>
                        {{ card.trend.value }}%
                      </span>
                    }
                    <span class="text-gray-500 ml-2">{{ card.trend.label }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Activité récente -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Activité récente</h2>
            
            <div class="space-y-4">
              @if (recentActivities().length === 0) {
                <div class="text-center py-8">
                  <div class="text-6xl mb-4">📋</div>
                  <p class="text-gray-600">Aucune activité récente</p>
                  <p class="text-sm text-gray-500 mt-1">Commencez une nouvelle session pour voir vos activités</p>
                </div>
              } @else {
                @for (activity of recentActivities(); track activity.id) {
                  <div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="text-2xl">{{ activity.icon }}</div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                      <p class="text-xs text-gray-500">{{ activity.timestamp }}</p>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                          [class]="activity.statusClass">
                      {{ activity.status }}
                    </span>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Section d'information sur le système -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Informations système</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-2">Authentification</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>État:</span>
                    <span class="text-green-600 font-medium">✅ Connecté</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Email:</span>
                    <span class="font-mono text-xs">{{ authService.currentUser()?.email || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Rôle:</span>
                    <span class="font-medium">{{ userRole() || 'En attente...' }}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-2">Application</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Version:</span>
                    <span class="font-mono">2.0.0</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Environnement:</span>
                    <span class="font-mono">{{ isProduction() ? 'Production' : 'Développement' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Dernière synchro:</span>
                    <span class="text-xs">{{ getLastSyncTime() }}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-2">Données utilisateur</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Profil chargé:</span>
                    <span class="font-medium">{{ authService.appUser() ? '✅ Oui' : '⏳ Chargement...' }}</span>
                  </div>
                  @if (authService.appUser()) {
                    <div class="flex justify-between">
                      <span>ID utilisateur:</span>
                      <span class="font-mono text-xs">{{ authService.appUser()?.id }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Créé le:</span>
                      <span class="text-xs">{{ formatDate(authService.appUser()?.created_at) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    .page-header {
      margin-bottom: 2rem;
    }
    
    .btn {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
    }
    
    .btn-primary {
      @apply text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
    }
    
    .btn-secondary {
      @apply text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-500;
    }
    
    .btn:disabled {
      @apply opacity-50 cursor-not-allowed;
    }
  `]
})
export class DashboardComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  
  // Signaux d'état - plus besoin des actions car déplacées dans le header
  
  // Computed pour l'état de chargement
  readonly isLoading = computed(() => {
    // En cours de chargement si auth pas prête ou utilisateur en cours de chargement
    return !this.authService.authReady() || this.authService.isLoading();
  });
  
  readonly loadingDetails = computed(() => {
    if (!this.authService.authReady()) return 'Initialisation de l\'authentification...';
    if (this.authService.isLoading()) return 'Chargement des données utilisateur...';
    return null;
  });
  
  readonly displayName = computed(() => {
    const appUser = this.authService.appUser();
    if (appUser?.full_name) return appUser.full_name;
    
    const email = this.authService.currentUser()?.email;
    return email ? email.split('@')[0] : 'Utilisateur';
  });
  
  readonly userRole = computed(() => this.authService.userRole());
  
  readonly statCards = computed<StatCard[]>(() => [
    {
      title: 'Sessions aujourd\'hui',
      value: 0, // À remplacer par les vraies données
      subtitle: 'Pas encore de session',
      icon: '📅',
      color: 'primary' as const
    },
    {
      title: 'Tâches complétées',
      value: 0,
      subtitle: 'Cette semaine',
      icon: '✅',
      color: 'success' as const,
      trend: { value: 12, label: 'vs semaine dernière', isPositive: true }
    },
    {
      title: 'Temps moyen',
      value: '0 min',
      subtitle: 'Par session',
      icon: '⏱️',
      color: 'warning' as const
    },
    {
      title: 'Efficacité',
      value: '100%',
      subtitle: 'Score de qualité',
      icon: '🎯',
      color: 'success' as const
    }
  ]);
  
  readonly recentActivities = computed<RecentActivity[]>(() => [
    // Mock data - à remplacer par les vraies données
    // {
    //   id: '1',
    //   title: 'Session de nettoyage terminée',
    //   timestamp: 'Il y a 2 heures',
    //   status: 'Terminé',
    //   statusClass: 'bg-green-100 text-green-800',
    //   icon: '✅'
    // }
  ]);
  
  constructor() {
    // Effect pour logger les changements d'état
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      const appUser = this.authService.appUser();
      const loading = this.isLoading();
      
      console.log('📊 Dashboard State:', {
        isAuthenticated: isAuth,
        hasAppUser: !!appUser,
        isLoading: loading,
        userRole: this.userRole(),
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // Méthodes utilitaires
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
  
  getCurrentDateFormatted(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  getRoleLabel(): string {
    const role = this.userRole();
    const labels = {
      'admin': 'Administrateur',
      'manager': 'Manager',
      'gerante': 'Gérante'
    };
    return role ? labels[role] : 'Utilisateur';
  }
  
  isProduction(): boolean {
    return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  }
  
  getLastSyncTime(): string {
    return new Date().toLocaleTimeString('fr-FR');
  }
  
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }
}
