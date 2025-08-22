// ========================================
// src/app/shared/components/auth-debug.component.ts
// ========================================
import { Component, inject, effect } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

/**
 * Composant de diagnostic pour l'authentification
 * Affiche uniquement en mode développement
 */
@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showDebug) {
      <div class="auth-debug">
        <h4>🔍 Debug Auth</h4>
        <div class="debug-info">
          <div class="debug-item">
            <span class="label">Authentifié:</span>
            <span class="value" [class.success]="authService.isAuthenticated()" 
                  [class.error]="!authService.isAuthenticated()">
              {{ authService.isAuthenticated() ? '✅ Oui' : '❌ Non' }}
            </span>
          </div>
          
          <div class="debug-item">
            <span class="label">Loading:</span>
            <span class="value">{{ authService.loading() ? '⏳ Oui' : '✅ Non' }}</span>
          </div>
          
          <div class="debug-item">
            <span class="label">Email:</span>
            <span class="value">{{ authService.currentUser()?.email || 'Aucun' }}</span>
          </div>
          
          <div class="debug-item">
            <span class="label">Rôle:</span>
            <span class="value">{{ authService.userRole() || 'Aucun' }}</span>
          </div>
          
          <div class="debug-item">
            <span class="label">AppUser:</span>
            <span class="value">
              {{ authService.appUser() ? '✅ Chargé' : '❌ Non chargé' }}
            </span>
          </div>
          
          <div class="debug-item">
            <span class="label">Nom complet:</span>
            <span class="value">
              {{ authService.appUser()?.prenom + ' ' + authService.appUser()?.nom || 'N/A' }}
            </span>
          </div>
          
          <div class="debug-item">
            <span class="label">URL actuelle:</span>
            <span class="value">{{ currentUrl }}</span>
          </div>
          
          @if (authService.error()) {
            <div class="debug-item error">
              <span class="label">Erreur:</span>
              <span class="value">{{ authService.error() }}</span>
            </div>
          }
          
          <div class="debug-actions">
            <button (click)="forceRefresh()" class="debug-btn">
              🔄 Refresh
            </button>
            <button (click)="logAuthState()" class="debug-btn">
              📝 Log État
            </button>
            <button (click)="testToken()" class="debug-btn">
              🔑 Test Token
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .auth-debug {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
      max-width: 300px;
      z-index: 9999;
      border: 2px solid #333;
    }
    
    .auth-debug h4 {
      margin: 0 0 10px 0;
      color: #4ade80;
    }
    
    .debug-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .debug-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }
    
    .debug-item.error {
      background: rgba(239, 68, 68, 0.2);
      padding: 5px;
      border-radius: 4px;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .label {
      font-weight: bold;
      color: #94a3b8;
      min-width: 80px;
    }
    
    .value {
      color: #e2e8f0;
      font-weight: bold;
      text-align: right;
      flex: 1;
      word-break: break-all;
    }
    
    .value.success {
      color: #4ade80;
    }
    
    .value.error {
      color: #ef4444;
    }
    
    .debug-actions {
      display: flex;
      gap: 5px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    
    .debug-btn {
      background: #374151;
      color: white;
      border: 1px solid #6b7280;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
    }
    
    .debug-btn:hover {
      background: #4b5563;
    }
  `]
})
export class AuthDebugComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly showDebug = !environment.production;
  currentUrl = window.location.pathname;
  
  constructor() {
    // Mettre à jour l'URL quand elle change
    effect(() => {
      this.currentUrl = window.location.pathname;
    });
    
    // Logger les changements d'état d'auth
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      const loading = this.authService.loading();
      const user = this.authService.currentUser();
      
      console.log('🔍 Auth Debug - État changé:', {
        authenticated: isAuth,
        loading: loading,
        email: user?.email,
        role: this.authService.userRole(),
        appUser: !!this.authService.appUser(),
        url: this.currentUrl,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * Force un refresh de l'état d'authentification
   */
  forceRefresh(): void {
    console.log('🔄 Debug: Force refresh demandé');
    window.location.reload();
  }
  
  /**
   * Log l'état complet d'authentification
   */
  logAuthState(): void {
    const state = {
      isAuthenticated: this.authService.isAuthenticated(),
      loading: this.authService.loading(),
      currentUser: this.authService.currentUser(),
      appUser: this.authService.appUser(),
      userRole: this.authService.userRole(),
      normalizedRole: this.authService.normalizedRole(),
      canManage: this.authService.canManage(),
      isAdmin: this.authService.isAdmin(),
      error: this.authService.error(),
      currentUrl: this.currentUrl,
      timestamp: new Date().toISOString()
    };
    
    console.group('🔍 État complet d\'authentification');
    console.table(state);
    console.log('📦 Objet complet:', state);
    console.groupEnd();
  }
  
  /**
   * Test la récupération du token
   */
  async testToken(): Promise<void> {
    console.log('🔑 Debug: Test de récupération du token...');
    
    try {
      const token = await this.authService.getIdToken();
      if (token) {
        console.log('✅ Debug: Token récupéré avec succès');
        console.log('📝 Debug: Longueur du token:', token.length);
        console.log('📝 Debug: Début du token:', token.substring(0, 50) + '...');
      } else {
        console.warn('⚠️ Debug: Aucun token récupéré');
      }
    } catch (error) {
      console.error('❌ Debug: Erreur lors de la récupération du token:', error);
    }
  }
}