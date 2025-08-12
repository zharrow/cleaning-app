// ========================================
// src/app/app.component.ts
// ========================================
import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

/**
 * Composant racine de l'application
 * Gère l'initialisation de l'authentification et affiche un loader
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <!-- Loader pendant la vérification de l'authentification -->
    @if (!authReady()) {
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div class="text-center">
          <!-- Spinner animé -->
          <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          
          <!-- Texte de chargement -->
          <p class="text-gray-600 animate-pulse">Vérification de l'authentification...</p>
        </div>
      </div>
    }
    
    <!-- Application principale -->
    @if (authReady()) {
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <router-outlet></router-outlet>
      </div>
    }
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  
  // Signal pour savoir si l'auth est prête
  readonly authReady = this.authService.authReady;
  
  constructor() {
    // Log pour debug
    effect(() => {
      console.log('🚀 App: Auth ready =', this.authReady());
      if (this.authReady()) {
        console.log('🚀 App: User authenticated =', this.authService.isAuthenticated());
      }
    });
  }
}