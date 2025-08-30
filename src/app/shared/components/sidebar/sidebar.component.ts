// ========================================
// Sidebar moderne et épurée
// src/app/shared/components/sidebar/sidebar.component.ts
// ========================================
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour les éléments de navigation
 */
interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly requiresRole?: string[];
}

/**
 * Sidebar moderne avec design minimaliste et épuré
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="bg-white/95 backdrop-blur-lg h-screen w-64 shadow-xl border-r border-gray-100 flex flex-col">
      
      <!-- Header avec logo moderne -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-xl">🧹</span>
          </div>
          <div>
            <span class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">CleanTrack</span>
            <p class="text-xs text-gray-500 mt-0.5">Gestion de nettoyage</p>
          </div>
        </div>
      </div>

      <!-- Navigation principale -->
      <nav class="flex-1 overflow-y-auto py-6">
        
        <!-- Section 1: Navigation principale -->
        <div class="px-4 mb-8">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded"></div>
            <h3 class="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Navigation
            </h3>
          </div>
          <ul class="space-y-1 list-none">
            @for (item of mainNavItems; track item.path) {
              <li class="list-none">
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-blue-500 text-white shadow-lg border-r-4 border-blue-600"
                  [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
                  class="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 relative overflow-hidden no-underline"
                >
                  <!-- Fond animé au hover -->
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all duration-300 rounded-xl"></div>
                  
                  <!-- Contenu -->
                  <div class="relative flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all duration-200">
                      <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{ item.icon }}</span>
                    </div>
                    <span class="font-medium">{{ item.label }}</span>
                  </div>
                  
                  <!-- Indicateur actif -->
                  <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-1.5 h-1.5 bg-blue-500 rounded"></div>
                  </div>
                </a>
              </li>
            }
          </ul>
        </div>

        <!-- Section 2: Gestion (si manager/admin) -->
        @if (showManagementSection()) {
          <div class="px-4 mb-8">
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-600 rounded"></div>
              <h3 class="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Gestion
              </h3>
            </div>
            <ul class="space-y-1 list-none">
              @for (item of managementNavItems; track item.path) {
                <li class="list-none">
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="bg-green-500 text-white shadow-lg border-r-4 border-green-600"
                    class="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 relative overflow-hidden no-underline"
                  >
                    <!-- Fond animé au hover -->
                    <div class="absolute inset-0 bg-gradient-to-r from-green-50/0 to-emerald-50/0 group-hover:from-green-50/50 group-hover:to-emerald-50/50 transition-all duration-300 rounded-xl"></div>
                    
                    <!-- Contenu -->
                    <div class="relative flex items-center space-x-3">
                      <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all duration-200">
                        <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{ item.icon }}</span>
                      </div>
                      <span class="font-medium">{{ item.label }}</span>
                    </div>
                    
                    <!-- Indicateur actif -->
                    <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div class="w-1.5 h-1.5 bg-green-500 rounded"></div>
                    </div>
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </nav>

      <!-- Section 3: Profil utilisateur (en bas) -->
      <div class="border-t border-gray-100 p-4">
        <!-- Info utilisateur moderne -->
        <div class="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                <span class="text-sm font-bold text-white">{{ getUserInitials() }}</span>
              </div>
              <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded shadow-sm"></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ userName() }}</p>
              <div class="flex items-center space-x-2 mt-1">
                <div class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                  {{ roleLabel() }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions utilisateur modernes -->
        <div class="space-y-2">
          <button
            (click)="navigateToProfile()"
            class="group w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
          >
            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <span>Mon profil</span>
            <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </button>
          
          <button
            (click)="logout()"
            [disabled]="loggingOut()"
            class="group w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl text-red-700 hover:text-red-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div class="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 group-hover:shadow-sm transition-all duration-200">
              @if (loggingOut()) {
                <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded animate-spin"></div>
              } @else {
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                </svg>
              }
            </div>
            <span>{{ loggingOut() ? 'Déconnexion...' : 'Se déconnecter' }}</span>
            @if (!loggingOut()) {
              <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            }
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    /* Styles pour la sidebar moderne */
    :host {
      display: block;
      height: 100vh;
    }
    
    /* Suppression des puces et underlines */
    ul, li {
      list-style: none !important;
      list-style-type: none !important;
      margin: 0;
      padding: 0;
    }
    
    a, a:hover, a:visited, a:active, a:focus {
      text-decoration: none !important;
      outline: none;
    }
    
    .no-underline {
      text-decoration: none !important;
    }
    
    /* Effet glassmorphism */
    .backdrop-blur-lg {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    
    /* Scrollbar personnalisée ultra-fine */
    nav::-webkit-scrollbar {
      width: 3px;
    }
    
    nav::-webkit-scrollbar-track {
      background: transparent;
    }
    
    nav::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
      border-radius: 2px;
    }
    
    nav::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #d1d5db, #9ca3af);
    }
    
    /* Animation des éléments de navigation */
    .router-link-active {
      font-weight: 600 !important;
    }
    
    /* Styles spécifiques pour les liens actifs */
    .router-link-active .group-hover\\:scale-110 {
      color: white !important;
      transform: scale(1.05);
    }
    
    .router-link-active .bg-gray-100 {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white;
    }
    
    /* Effet hover sur les icônes */
    .group:hover .group-hover\\:scale-110 {
      transform: scale(1.1);
    }
    
    /* Animations fluides */
    * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Effet de survol sur les sections */
    .group:hover {
      transform: translateX(2px);
    }
    
    /* États actifs avec fond coloré */
    .router-link-active {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .router-link-active:hover {
      transform: translateX(4px) !important;
      background-color: rgb(59 130 246) !important; /* Garde le bleu même au hover */
    }
  `]
})
export class SidebarComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Signaux d'état
  readonly loggingOut = signal(false);
  
  // Configuration de navigation
  readonly mainNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '🏠' },
    { path: '/session', label: 'Session du jour', icon: '📅' },
    { path: '/tasks', label: 'Mes tâches', icon: '✅' },
    { path: '/history', label: 'Historique', icon: '📚' }
  ];
  
  readonly managementNavItems: NavItem[] = [
    { path: '/manage/tasks', label: 'Gestion des tâches', icon: '⚙️' },
    { path: '/manage/rooms', label: 'Gestion des pièces', icon: '🏠' },
    { path: '/manage/performers', label: 'Gestion de l\'équipe', icon: '👥' }
  ];
  
  // Computed signals
  readonly showManagementSection = computed(() => {
    return this.authService.isManager() || this.authService.isAdmin();
  });
  
  readonly userName = computed(() => {
    const appUser = this.authService.appUser();
    if (appUser?.full_name) return appUser.full_name;
    
    const firebaseUser = this.authService.currentUser();
    return firebaseUser?.email?.split('@')[0] || 'Utilisateur';
  });
  
  readonly roleLabel = computed(() => {
    const role = this.authService.userRole();
    const roleLabels = {
      'admin': 'Administrateur',
      'manager': 'Manager',
      'gerante': 'Gérante'
    };
    return role ? roleLabels[role] : 'Utilisateur';
  });
  
  readonly getUserInitials = computed(() => {
    const name = this.userName();
    return name.split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });
  
  /**
   * Actions utilisateur
   */
  async navigateToProfile(): Promise<void> {
    this.router.navigate(['/profile']);
  }
  
  async logout(): Promise<void> {
    if (this.loggingOut()) return;
    
    this.loggingOut.set(true);
    
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.loggingOut.set(false);
    }
  }
}