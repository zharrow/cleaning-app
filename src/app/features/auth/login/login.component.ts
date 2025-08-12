// ========================================
// src/app/features/auth/login/login.component.ts
// ========================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LogIn, Mail, Lock, AlertCircle } from 'lucide-angular';

/**
 * Composant de connexion
 * Gère l'authentification Firebase et la redirection
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md animate-slide-up">
        <!-- Logo et titre -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-2xl mb-4">
            <span class="text-3xl">🧹</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Micro-Crèche</h1>
          <p class="text-gray-600 mt-2">Gestion du nettoyage quotidien</p>
        </div>

        <!-- Carte de connexion -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6">Connexion</h2>
          
          <!-- Message d'erreur -->
          @if (authError()) {
            <div class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
              <lucide-icon name="alert-circle" [size]="20" class="text-danger-600 mt-0.5"></lucide-icon>
              <span class="text-sm text-danger-700">{{ authError() }}</span>
            </div>
          }

          <!-- Formulaire -->
          <form (ngSubmit)="handleLogin()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon name="mail" [size]="18" class="text-gray-400"></lucide-icon>
                </div>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  [disabled]="isLoading()"
                  placeholder="votre@email.com"
                  class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <!-- Mot de passe -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon name="lock" [size]="18" class="text-gray-400"></lucide-icon>
                </div>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  [disabled]="isLoading()"
                  placeholder="••••••••"
                  class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <!-- Bouton de connexion -->
            <button
              type="submit"
              [disabled]="isLoading() || !email || !password"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              @if (isLoading()) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion...</span>
              } @else {
                <lucide-icon name="log-in" [size]="20"></lucide-icon>
                <span>Se connecter</span>
              }
            </button>
          </form>

          <!-- Informations de test -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              Version de test - Utilisez vos identifiants Firebase
            </p>
            
            <!-- Debug info en développement -->
            @if (showDebugInfo) {
              <div class="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                <p class="font-semibold mb-1">🐛 Debug Info:</p>
                <p>Auth Ready: {{ authService.authReady() }}</p>
                <p>Is Authenticated: {{ authService.isAuthenticated() }}</p>
                <p>Return URL: {{ returnUrl || 'none' }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-slide-up {
      animation: slide-up 0.5s ease-out;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  
  // Champs du formulaire
  email = '';
  password = '';
  
  // Signals pour l'état
  readonly isLoading = signal(false);
  readonly authError = signal<string | null>(null);
  
  // URL de retour après connexion
  returnUrl: string | null = null;
  
  // Debug mode (désactiver en production)
  readonly showDebugInfo = false; // Mettre à true pour debug
  
  ngOnInit() {
    // Récupérer l'URL de retour depuis les query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    console.log('🔗 Login: Return URL =', this.returnUrl);
  }
  
  /**
   * Gère la soumission du formulaire de connexion
   */
  async handleLogin() {
    // Validation basique
    if (!this.email || !this.password) {
      this.authError.set('Veuillez remplir tous les champs');
      return;
    }
    
    // Réinitialiser l'erreur
    this.authError.set(null);
    this.isLoading.set(true);
    
    try {
      console.log('🔐 Tentative de connexion...');
      
      // Appel au service d'authentification
      await this.authService.signIn(this.email, this.password);
      
      console.log('✅ Connexion réussie!');
      
      // La redirection est gérée dans le service auth
      // mais on peut forcer si nécessaire
      if (this.returnUrl && this.returnUrl !== '/login') {
        await this.router.navigate([this.returnUrl]);
      }
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      
      // Afficher l'erreur
      this.authError.set(
        error.message || 'Une erreur est survenue lors de la connexion'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}