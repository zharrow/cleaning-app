import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ApiService } from './core/services/api.service';
import { filter } from 'rxjs/operators';

/**
 * Interface pour les notifications système
 */
interface SystemNotification {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly message: string;
  readonly timeout?: number;
}

/**
 * Composant racine de l'application
 * Gère l'état global, l'authentification et les notifications
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <!-- Skip link pour l'accessibilité -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <!-- État de chargement initial -->
    @if (showInitialLoader()) {
      <div class="app-loading">
        <div class="app-loading-content">
          <div class="app-loading-spinner"></div>
          <p class="app-loading-text">
            {{ loadingMessage() }}
          </p>
        </div>
      </div>
    }

    <!-- Application principale -->
    @if (appReady()) {
      <div class="app-layout" [class.offline]="isOffline()">
        
        <!-- Header si utilisateur connecté -->
        @if (authService.isAuthenticated()) {
          <header class="app-header">
            <div class="flex items-center justify-between px-6 h-full">
              <!-- Logo et titre -->
              <div class="flex items-center gap-4">
                <button 
                  class="btn btn-ghost btn-icon lg:hidden"
                  (click)="toggleMobileMenu()"
                  [attr.aria-label]="sidebarOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
                >
                  @if (sidebarOpen()) {
                    <span class="text-xl">✕</span>
                  } @else {
                    <span class="text-xl">☰</span>
                  }
                </button>
                
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🧹</span>
                  <h1 class="text-lg font-semibold text-gray-900">
                    Micro-Crèche
                  </h1>
                </div>
              </div>

              <!-- Actions utilisateur -->
              <div class="flex items-center gap-4">
                <!-- Indicateur de synchronisation -->
                @if (syncInProgress()) {
                  <div class="flex items-center gap-2 text-sm text-primary-600">
                    <div class="spinner spinner-sm"></div>
                    <span>Synchronisation...</span>
                  </div>
                }

                <!-- Profil utilisateur -->
                @if (authService.appUser(); as user) {
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">
                        {{ user.full_name }}
                      </p>
                      <p class="text-xs text-gray-500 capitalize">
                        {{ user.role }}
                      </p>
                    </div>
                    
                    <button 
                      class="btn btn-ghost btn-icon"
                      (click)="toggleUserMenu()"
                      [attr.aria-label]="'Menu utilisateur'"
                    >
                      <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-primary-700">
                          {{ getUserInitials(user.full_name) }}
                        </span>
                      </div>
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Menu utilisateur dropdown -->
            @if (showUserMenu()) {
              <div class="absolute top-full right-4 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div class="py-2">
                  <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mon profil
                  </a>
                  <button 
                    class="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
                    (click)="logout()"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            }
          </header>
        }

        <!-- Contenu principal -->
        <main class="app-main" id="main-content">
          
          <!-- Sidebar mobile overlay -->
          @if (sidebarOpen() && isMobile()) {
            <div 
              class="fixed inset-0 bg-black/50 z-40 lg:hidden"
              (click)="closeMobileMenu()"
            ></div>
          }

          <!-- Sidebar pour les utilisateurs connectés -->
          @if (authService.isAuthenticated()) {
            <aside 
              class="app-sidebar"
              [class.open]="sidebarOpen()"
              [class.collapsed]="sidebarCollapsed()"
            >
              <nav class="p-4">
                <!-- Navigation principale -->
                <ul class="nav nav-vertical space-y-1">
                  @for (item of navigationItems(); track item.path) {
                    <li class="nav-item">
                      <a 
                        [routerLink]="item.path" 
                        class="nav-link"
                        [class.active]="currentRoute() === item.path"
                        (click)="handleNavClick()"
                      >
                        <span class="text-lg">{{ item.icon }}</span>
                        @if (!sidebarCollapsed()) {
                          <span>{{ item.label }}</span>
                        }
                      </a>
                    </li>
                  }
                </ul>

                <!-- Actions rapides -->
                @if (!sidebarCollapsed()) {
                  <div class="mt-8 pt-4 border-t border-gray-200">
                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Actions rapides
                    </h3>
                    
                    @if (canStartSession()) {
                      <button 
                        class="btn btn-primary btn-sm w-full mb-2"
                        (click)="startNewSession()"
                        [disabled]="startingSession()"
                      >
                        @if (startingSession()) {
                          <div class="spinner spinner-sm"></div>
                        }
                        Nouvelle session
                      </button>
                    }

                    @if (todayProgress(); as progress) {
                      <div class="text-sm text-gray-600">
                        <p class="mb-1">Progression du jour</p>
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            [style.width.%]="progress.percentage"
                          ></div>
                        </div>
                        <p class="text-xs">
                          {{ progress.completed }} / {{ progress.total }} tâches
                        </p>
                      </div>
                    }
                  </div>
                }
              </nav>
            </aside>
          }

          <!-- Zone de contenu -->
          <div class="app-content">
            <router-outlet></router-outlet>
          </div>
        </main>

        <!-- Indicateurs système -->
        @if (isOffline()) {
          <div class="offline-indicator">
            📡 Mode hors ligne - Les données seront synchronisées à la reconnexion
          </div>
        }

        @if (hasUpdates()) {
          <div class="sync-indicator">
            ⬇️ Nouvelle version disponible - 
            <button class="underline" (click)="refreshApp()">
              Mettre à jour
            </button>
          </div>
        }
      </div>
    }

    <!-- Notifications système -->
    @if (notifications().length > 0) {
      <div class="fixed top-20 right-4 z-50 space-y-2">
        @for (notification of notifications(); track notification.id) {
          <div 
            class="alert px-4 py-3 rounded-lg shadow-lg animate-slide-left"
            [class]="getNotificationClass(notification.type)"
          >
            <div class="flex items-start gap-3">
              <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ notification.message }}</p>
              </div>
              <button 
                class="text-sm opacity-70 hover:opacity-100"
                (click)="dismissNotification(notification.id)"
              >
                ✕
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .app-header {
      position: relative;
    }

    .app-sidebar {
      transition: all 0.3s ease;
    }

    @media (max-width: 1023px) {
      .app-sidebar {
        position: fixed;
        top: var(--header-height);
        left: -100%;
        height: calc(100vh - var(--header-height));
        z-index: 30;
      }

      .app-sidebar.open {
        left: 0;
      }
    }

    .router-outlet-container {
      animation: fade-in 0.3s ease-out;
    }

    .notification-enter {
      animation: slide-left 0.3s ease-out;
    }

    .notification-leave {
      animation: slide-out-right 0.3s ease-in;
    }
  `]
})
export class AppComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Signals d'état local
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly showUserMenu = signal(false);
  readonly notifications = signal<SystemNotification[]>([]);
  readonly isOffline = signal(false);
  readonly hasUpdates = signal(false);
  readonly startingSession = signal(false);
  readonly currentRoute = signal('/');

  // Computed signals
  readonly appReady = computed(() => 
    this.authService.authReady() && !this.authService.isLoading()
  );

  readonly showInitialLoader = computed(() => 
    !this.authService.authReady() || this.authService.isLoading()
  );

  readonly loadingMessage = computed(() => {
    if (!this.authService.authReady()) {
      return 'Initialisation de l\'authentification...';
    }
    if (this.authService.isLoading()) {
      return 'Chargement des données utilisateur...';
    }
    return 'Chargement...';
  });

  toggleUserMenu(): void { this.showUserMenu.update(show => !show); }

  readonly navigationItems = computed(() => {
    const baseItems = [
      { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
      { path: '/session', label: 'Session du jour', icon: '📋' },
      { path: '/tasks', label: 'Tâches', icon: '✅' }
    ];

    // Ajouter les items de gestion si autorisé
    if (this.authService.isManager()) {
      baseItems.push(
        { path: '/manage/tasks', label: 'Gestion tâches', icon: '⚙️' },
        { path: '/manage/rooms', label: 'Gestion pièces', icon: '🏠' }
      );
    }

    return baseItems;
  });

  readonly canStartSession = computed(() => 
    this.authService.isAuthenticated() && !this.apiService.todaySession.value()
  );

  readonly todayProgress = computed(() => this.apiService.todayProgress());

  readonly syncInProgress = computed(() => 
    this.apiService.isLoading() && this.authService.isAuthenticated()
  );

  readonly isMobile = computed(() => 
    typeof window !== 'undefined' && window.innerWidth < 1024
  );

  constructor() {
    this.setupRouterSubscription();
    this.setupOfflineDetection();
    this.setupUserMenuClickOutside();
    
    // Effect pour fermer le menu mobile lors de changements de route
    effect(() => {
      if (this.currentRoute()) {
        this.closeMobileMenu();
        this.showUserMenu.set(false);
      }
    });

    // Effect pour logger les erreurs API
    effect(() => {
      if (this.apiService.hasError()) {
        this.showNotification('error', 'Erreur lors du chargement des données');
      }
    });
  }

  /**
   * Gestion de la navigation
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
      });
  }

  /**
   * Actions utilisateur
   */
  toggleMobileMenu(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.sidebarOpen.set(false);
  }

  handleNavClick(): void {
    if (this.isMobile()) {
      this.closeMobileMenu();
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.showNotification('success', 'Déconnexion réussie');
    } catch (error) {
      this.showNotification('error', 'Erreur lors de la déconnexion');
    }
  }

  async startNewSession(): Promise<void> {
    if (this.startingSession()) return;

    this.startingSession.set(true);
    try {
      const session = await this.apiService.startNewSession();
      this.showNotification('success', 'Nouvelle session créée avec succès');
      this.router.navigate(['/session']);
    } catch (error) {
      this.showNotification('error', 'Erreur lors de la création de la session');
      console.error('Erreur startNewSession:', error);
    } finally {
      this.startingSession.set(false);
    }
  }

  /**
   * Gestion des notifications
   */
  showNotification(type: SystemNotification['type'], message: string, timeout = 5000): void {
    const notification: SystemNotification = {
      id: Date.now().toString(),
      type,
      message,
      timeout
    };

    this.notifications.update(notifications => [...notifications, notification]);

    // Auto-dismiss après timeout
    if (timeout > 0) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, timeout);
    }
  }

  dismissNotification(id: string): void {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  getNotificationClass(type: SystemNotification['type']): string {
    const classes = {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-danger'
    };
    return classes[type] || 'alert-info';
  }

  getNotificationIcon(type: SystemNotification['type']): string {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Utilitaires
   */
  getUserInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  refreshApp(): void {
    window.location.reload();
  }

  /**
   * Détection hors ligne
   */
  private setupOfflineDetection(): void {
    if (typeof window !== 'undefined') {
      this.isOffline.set(!navigator.onLine);
      
      window.addEventListener('online', () => {
        this.isOffline.set(false);
        this.showNotification('success', 'Connexion rétablie');
        this.apiService.refreshData();
      });
      
      window.addEventListener('offline', () => {
        this.isOffline.set(true);
        this.showNotification('warning', 'Connexion perdue - Mode hors ligne');
      });
    }
  }

  /**
   * Fermeture du menu utilisateur en cliquant à l'extérieur
   */
  private setupUserMenuClickOutside(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (event) => {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          this.showUserMenu.set(false);
        }
      });
    }
  }
}