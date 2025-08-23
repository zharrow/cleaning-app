// ========================================
// Composant Profil - src/app/features/profile/profile.component.ts
// ========================================
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

/**
 * Composant de profil utilisateur
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container max-w-4xl">
      
      <!-- En-tête -->
      <div class="page-header">
        <h1 class="page-title">Mon profil</h1>
        <p class="page-subtitle">Gérez vos informations personnelles et préférences</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Informations utilisateur -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Informations de base -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Informations personnelles</h3>
            </div>
            <div class="card-body">
              @if (authService.appUser(); as user) {
                <div class="space-y-4">
                  <div class="form-group">
                    <label class="form-label">Nom complet</label>
                    <input 
                      type="text" 
                      class="form-input" 
                      [value]="user.full_name"
                      readonly
                    />
                    <div class="form-help">
                      Contactez l'administrateur pour modifier votre nom
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Rôle</label>
                    <input 
                      type="text" 
                      class="form-input" 
                      [value]="getRoleLabel(user.role)"
                      readonly
                    />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Membre depuis</label>
                    <input 
                      type="text" 
                      class="form-input" 
                      [value]="formatDate(user.created_at)"
                      readonly
                    />
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Préférences -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Préférences</h3>
            </div>
            <div class="card-body">
              <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
                <div class="space-y-4">
                  
                  <div class="form-group">
                    <label class="form-label">Notifications</label>
                    <div class="space-y-2">
                      <label class="flex items-center">
                        <input 
                          type="checkbox" 
                          formControlName="emailNotifications"
                          class="mr-3"
                        />
                        <span class="text-sm">Recevoir les notifications par email</span>
                      </label>
                      <label class="flex items-center">
                        <input 
                          type="checkbox" 
                          formControlName="pushNotifications"
                          class="mr-3"
                        />
                        <span class="text-sm">Notifications push</span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Interface</label>
                    <select class="form-input form-select" formControlName="theme">
                      <option value="auto">Automatique (système)</option>
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Format de date</label>
                    <select class="form-input form-select" formControlName="dateFormat">
                      <option value="dd/MM/yyyy">JJ/MM/AAAA</option>
                      <option value="MM/dd/yyyy">MM/JJ/AAAA</option>
                      <option value="yyyy-MM-dd">AAAA-MM-JJ</option>
                    </select>
                  </div>
                </div>
                
                <div class="flex justify-end mt-6">
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    [disabled]="preferencesForm.invalid || savingPreferences()"
                  >
                    @if (savingPreferences()) {
                      <div class="spinner spinner-sm"></div>
                    }
                    Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Sécurité -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Sécurité</h3>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Mot de passe</h4>
                  <p class="text-sm text-gray-600 mb-3">
                    Votre mot de passe est géré par Firebase Authentication.
                  </p>
                  <button class="btn btn-secondary btn-sm" (click)="resetPassword()">
                    Réinitialiser le mot de passe
                  </button>
                </div>
                
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Sessions actives</h4>
                  <p class="text-sm text-gray-600 mb-3">
                    Gérez vos sessions de connexion actives.
                  </p>
                  <button class="btn btn-danger btn-sm" (click)="logoutAllDevices()">
                    Déconnecter tous les appareils
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          
          <!-- Avatar et actions rapides -->
          <div class="card">
            <div class="card-body text-center">
              @if (authService.appUser(); as user) {
                <div class="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span class="text-2xl font-bold text-primary-700">
                    {{ getUserInitials(user.full_name) }}
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900 mb-1">{{ user.full_name }}</h3>
                <p class="text-sm text-gray-600 mb-4">{{ getRoleLabel(user.role) }}</p>
              }
              
              <button class="btn btn-danger btn-sm w-full" (click)="logout()">
                Se déconnecter
              </button>
            </div>
          </div>

          <!-- Statistiques personnelles -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Mes statistiques</h3>
            </div>
            <div class="card-body">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Sessions cette semaine</span>
                  <span class="font-semibold text-gray-900">{{ userStats().sessionsThisWeek }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Tâches validées</span>
                  <span class="font-semibold text-gray-900">{{ userStats().tasksCompleted }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Temps total</span>
                  <span class="font-semibold text-gray-900">{{ userStats().totalTime }}h</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Actions rapides</h3>
            </div>
            <div class="card-body">
              <div class="space-y-2">
                <a href="/session" class="btn btn-secondary btn-sm w-full">
                  📋 Session du jour
                </a>
                <a href="/dashboard" class="btn btn-secondary btn-sm w-full">
                  📊 Tableau de bord
                </a>
                <a href="/help" class="btn btn-secondary btn-sm w-full">
                  ❓ Aide
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Signals d'état
  readonly savingPreferences = signal(false);

  // Formulaire de préférences
  readonly preferencesForm = this.fb.nonNullable.group({
    emailNotifications: [true],
    pushNotifications: [false],
    theme: ['auto'],
    dateFormat: ['dd/MM/yyyy']
  });

  // Statistiques utilisateur (mock)
  readonly userStats = signal({
    sessionsThisWeek: 5,
    tasksCompleted: 42,
    totalTime: 12.5
  });

  constructor() {
    // Charger les préférences depuis le localStorage
    this.loadPreferences();
  }

  /**
   * Actions
   */
  async savePreferences(): Promise<void> {
    if (this.savingPreferences()) return;

    this.savingPreferences.set(true);
    try {
      const preferences = this.preferencesForm.getRawValue();
      
      // Sauvegarder en localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Appliquer le thème
      this.applyTheme(preferences.theme);
      
      console.log('Préférences sauvegardées:', preferences);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.savingPreferences.set(false);
    }
  }

  resetPassword(): void {
    // TODO: Implémenter la réinitialisation de mot de passe Firebase
    console.log('Réinitialisation du mot de passe');
  }

  async logoutAllDevices(): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir déconnecter tous les appareils ?')) {
      // TODO: Implémenter la déconnexion de tous les appareils
      console.log('Déconnexion de tous les appareils');
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  /**
   * Utilitaires
   */
  private loadPreferences(): void {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        this.preferencesForm.patchValue(preferences);
        this.applyTheme(preferences.theme);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
  }

  private applyTheme(theme: string): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto - suivre les préférences système
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  getUserInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleLabel(role: string): string {
    const labels = {
      admin: 'Administrateur',
      manager: 'Manager',
      gerante: 'Gérante'
    };
    return labels[role as keyof typeof labels] || role;
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  }
}