// ========================================
// App.component.ts adapté pour la nouvelle architecture
// src/app/app.component.ts
// ========================================
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
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
 * ✅ Utilise MainLayoutComponent pour les utilisateurs connectés
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
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
    } @else {
      
      <!-- ✅ NOUVEAU: Utilisation de MainLayoutComponent pour utilisateurs connectés -->
      @if (authService.isAuthenticated()) {
        <app-main-layout id="main-content"></app-main-layout>
      } @else {
        <!-- Page de login pour utilisateurs non connectés -->
        <div class="min-h-screen bg-gray-50" id="main-content">
          <router-outlet></router-outlet>
        </div>
      }
      
    }

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

    <!-- Notifications système -->
    @if (notifications().length > 0) {
      <div class="fixed top-4 right-4 z-50 space-y-2">
        @for (notification of notifications(); track notification.id) {
          <div 
            class="alert px-4 py-3 rounded-lg shadow-lg animate-slide-in"
            [class]="getNotificationClass(notification.type)"
          >
            <div class="flex items-start gap-3">
              <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ notification.message }}</p>
              </div>
              <button 
                class="text-sm opacity-70 hover:opacity-100 hover:bg-white/20 rounded px-1"
                (click)="dismissNotification(notification.id)"
                title="Fermer"
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
      background-color: #f9fafb;
    }

    /* Skip link pour l'accessibilité */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
    }
    
    .skip-link:focus {
      top: 6px;
    }

    /* Loader d'initialisation */
    .app-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .app-loading-content {
      text-align: center;
      color: white;
    }

    .app-loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .app-loading-text {
      font-size: 0.9rem;
      opacity: 0.9;
      margin: 0;
    }

    /* Indicateurs système */
    .offline-indicator,
    .sync-indicator {
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      background: #f59e0b;
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      text-align: center;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .sync-indicator {
      background: #3b82f6;
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }

    /* Styles des notifications */
    .alert {
      min-width: 300px;
      max-width: 400px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .alert-info {
      background: rgba(59, 130, 246, 0.9);
      color: white;
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.9);
      color: white;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.9);
      color: white;
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.9);
      color: white;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .offline-indicator,
      .sync-indicator {
        left: 0.5rem;
        right: 0.5rem;
        bottom: 0.5rem;
      }

      .alert {
        min-width: 280px;
        max-width: calc(100vw - 2rem);
      }
    }
  `]
})
export class AppComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Signals d'état global
  readonly notifications = signal<SystemNotification[]>([]);
  readonly isOffline = signal(false);
  readonly hasUpdates = signal(false);

  // Computed signals
  readonly appReady = computed(() => 
    this.authService.authReady() && !this.authService.isLoading()
  );

  readonly showInitialLoader = computed(() => 
    !this.authService.authReady() || (this.authService.isLoading() && !this.authService.isAuthenticated())
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

  constructor() {
    this.setupOfflineDetection();
    this.setupErrorHandling();
    this.setupRoutingEffects();
    
    // Logger les changements d'état d'authentification
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      const loading = this.authService.isLoading();
      console.log('🔐 App State:', { isAuthenticated: isAuth, loading, timestamp: new Date().toISOString() });
    });
  }

  /**
   * Configuration des effets de routage
   */
  private setupRoutingEffects(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Logger les changements de route
        console.log('🔄 Navigation:', event.url);
        
        // Fermer les notifications lors du changement de route
        if (event.url !== '/login') {
          this.clearOldNotifications();
        }
      });
  }

  /**
   * Gestion des erreurs globales
   */
  private setupErrorHandling(): void {
    // Effect pour les erreurs API
    effect(() => {
      if (this.apiService.hasError()) {
        this.showNotification('error', 'Erreur lors du chargement des données');
      }
    });

    // Effect pour les erreurs d'authentification
    effect(() => {
      const error = this.authService.error();
      if (error) {
        this.showNotification('error', `Erreur d'authentification: ${error}`);
      }
    });
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

  private clearOldNotifications(): void {
    // Garder seulement les notifications d'erreur
    this.notifications.update(notifications => 
      notifications.filter(n => n.type === 'error')
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
   * Utilitaires système
   */
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
        
        // Refresh des données si utilisateur connecté
        if (this.authService.isAuthenticated()) {
          this.apiService.refreshData?.();
        }
      });
      
      window.addEventListener('offline', () => {
        this.isOffline.set(true);
        this.showNotification('warning', 'Connexion perdue - Mode hors ligne', 0); // Pas de timeout
      });
    }
  }

  /**
   * API publique pour que les composants enfants puissent afficher des notifications
   */
  static showGlobalNotification?: (type: SystemNotification['type'], message: string, timeout?: number) => void;

  ngOnInit(): void {
    // Exposer la méthode de notification globalement
    AppComponent.showGlobalNotification = (type, message, timeout) => {
      this.showNotification(type, message, timeout);
    };
  }

  ngOnDestroy(): void {
    // Nettoyer la référence globale
    AppComponent.showGlobalNotification = undefined;
  }
}