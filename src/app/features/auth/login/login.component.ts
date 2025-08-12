// ========================================
// src/app/features/auth/login/login.component.ts
// ========================================
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LogIn, Mail, Lock, AlertCircle } from 'lucide-angular';

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
          
          @if (authError()) {
            <div class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
              <lucide-icon name="alert-circle" [size]="20" class="text-danger-600 mt-0.5"></lucide-icon>
              <span class="text-sm text-danger-700">{{ authError() }}</span>
            </div>
          }

          <form (ngSubmit)="handleLogin()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon name="mail" [size]="20" class="text-gray-400"></lucide-icon>
                </div>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="gerante@microcreche.fr"
                  [disabled]="isLoading()"
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
                  <lucide-icon name="lock" [size]="20" class="text-gray-400"></lucide-icon>
                </div>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  [disabled]="isLoading()"
                />
              </div>
            </div>

            <!-- Bouton de connexion -->
            <button
              type="submit"
              [disabled]="isLoading()"
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

          <!-- Version de test -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              Version de test - Utilisez vos identifiants Firebase
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';
  
  isLoading = signal(false);
  authError = signal<string | null>(null);
  
  constructor() {
    // Configure les icônes Lucide
    this.configureLucideIcons();
  }
  
  async handleLogin() {
    if (!this.email || !this.password) {
      this.authError.set('Veuillez remplir tous les champs');
      return;
    }
    
    this.isLoading.set(true);
    this.authError.set(null);
    
    try {
      await this.authService.signIn(this.email, this.password);
    } catch (error: any) {
      this.authError.set(error.message || 'Erreur de connexion');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private configureLucideIcons() {
    // Les icônes sont automatiquement disponibles via LucideAngularModule
  }
}