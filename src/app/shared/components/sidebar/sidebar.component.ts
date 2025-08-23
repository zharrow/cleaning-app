// ========================================
// Sidebar avec 3 sections distinctes
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
 * Interface pour les sections de navigation
 */
interface NavSection {
  readonly title: string;
  readonly items: NavItem[];
  readonly showForAll?: boolean;
}

/**
 * Sidebar moderne avec 3 sections distinctes
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="bg-white h-screen w-64 shadow-lg border-r border-gray-200 flex flex-col">
      
      <!-- Header avec logo -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center">
          <span class="text-2xl">🧹</span>
          <span class="ml-2 text-xl font-bold text-gray-900">CleanTrack</span>
        </div>
      </div>

      <!-- Navigation principale -->
      <nav class="flex-1 overflow-y-auto">
        
        <!-- Section 1: Navigation principale -->
        <div class="px-4 py-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Navigation
          </h3>
          <ul class="space-y-2">
            @for (item of mainNavItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
                  class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  <span class="text-lg mr-3 group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </div>

        <!-- Section 2: Gestion (si manager/admin) -->
        @if (showManagementSection()) {
          <div class="px-4 py-6 border-t border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Gestion
            </h3>
            <ul class="space-y-2">
              @for (item of managementNavItems; track item.path) {
                <li>
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="bg-green-50 text-green-700 border-r-2 border-green-700"
                    class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span class="text-lg mr-3 group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                    {{ item.label }}
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </nav>

      <!-- Section 3: Profil utilisateur (en bas) -->
      <div class="border-t border-gray-200 p-4">
        <!-- Info utilisateur -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-white">{{ getUserInitials() }}</span>
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ userName() }}</p>
              <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
            </div>
          </div>
        </div>

        <!-- Actions utilisateur -->
        <ul class="space-y-1">
          <li>
            <button
              (click)="navigateToProfile()"
              class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Mon profil
            </button>
          </li>
          <li>
            <button
              (click)="logout()"
              [disabled]="loggingOut()"
              class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-700 hover:text-red-800 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
            >
              @if (loggingOut()) {
                <div class="w-5 h-5 mr-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
              } @else {
                <svg class="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                </svg>
              }
              Se déconnecter
            </button>
          </li>
        </ul>
      </div>
    </aside>
  `,
  styles: [`
    /* Styles pour la sidebar active */
    :host {
      display: block;
      height: 100vh;
    }
    
    .router-link-active {
      font-weight: 600;
    }
    
    /* Animation hover sur les icônes */
    .group:hover .group-hover\\:scale-110 {
      transform: scale(1.1);
    }
    
    /* Scrollbar personnalisée */
    nav::-webkit-scrollbar {
      width: 4px;
    }
    
    nav::-webkit-scrollbar-track {
      background: transparent;
    }
    
    nav::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 2px;
    }
    
    nav::-webkit-scrollbar-thumb:hover {
      background: #d1d5db;
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
    { path: '/tasks', label: 'Tâches', icon: '✅' }
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