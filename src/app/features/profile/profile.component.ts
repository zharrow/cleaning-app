// ========================================
// Composant Profil - src/app/features/profile/profile.component.ts
// ========================================
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { EnterpriseService } from '../../core/services/enterprise.service';

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
                      [value]="getFullName(user)"
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
                      [value]="getRoleLabel(authService.userRole())"
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

          <!-- Informations entreprise -->
          @if (enterpriseService.hasEnterprise()) {
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Mon entreprise</h3>
                <button 
                  type="button"
                  (click)="toggleEditEnterprise()"
                  class="btn btn-sm btn-secondary"
                >
                  {{ editingEnterprise() ? 'Annuler' : 'Modifier' }}
                </button>
              </div>
              <div class="card-body">
                @if (enterpriseService.enterprise(); as enterprise) {
                  <div class="space-y-4">
                    @if (!editingEnterprise()) {
                      <!-- Mode lecture -->
                      <div class="enterprise-display">
                        <div class="flex items-start gap-4">
                          @if (enterprise.logo_url) {
                            <img 
                              [src]="enterprise.logo_url" 
                              [alt]="enterprise.name + ' logo'"
                              class="w-16 h-16 rounded-lg object-cover border"
                            >
                          } @else {
                            <div class="w-16 h-16 rounded-lg bg-gray-100 border flex items-center justify-center">
                              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 011-1h2a2 2 0 011 1v5m-4 0h4">
                                </path>
                              </svg>
                            </div>
                          }
                          <div class="flex-1 space-y-3">
                            <div>
                              <label class="form-label">Nom de l'entreprise</label>
                              <div class="text-lg font-semibold text-gray-900">{{ enterprise.name }}</div>
                            </div>
                            @if (enterprise.legal_form) {
                              <div>
                                <label class="form-label">Forme juridique</label>
                                <div class="text-gray-700">{{ enterprise.legal_form }}</div>
                              </div>
                            }
                            @if (enterprise.siret) {
                              <div>
                                <label class="form-label">SIRET</label>
                                <div class="text-gray-700 font-mono">{{ formatSiret(enterprise.siret) }}</div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    } @else {
                      <!-- Mode édition -->
                      <form [formGroup]="enterpriseForm" (ngSubmit)="saveEnterprise()" class="space-y-4">
                        <div class="form-group">
                          <label class="form-label">Nom de l'entreprise *</label>
                          <input 
                            type="text" 
                            class="form-input" 
                            formControlName="name"
                            placeholder="Nom de votre entreprise"
                          />
                          @if (enterpriseForm.get('name')?.invalid && enterpriseForm.get('name')?.touched) {
                            <div class="form-error">Le nom est obligatoire</div>
                          }
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label">URL du logo</label>
                          <input 
                            type="url" 
                            class="form-input" 
                            formControlName="logo_url"
                            placeholder="https://exemple.com/logo.png"
                          />
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label">Forme juridique</label>
                          <select class="form-input form-select" formControlName="legal_form">
                            <option value="">-- Sélectionnez --</option>
                            <option value="SARL">SARL</option>
                            <option value="SAS">SAS</option>
                            <option value="SASU">SASU</option>
                            <option value="EURL">EURL</option>
                            <option value="SA">SA</option>
                            <option value="Association">Association</option>
                            <option value="Entreprise individuelle">Entreprise individuelle</option>
                            <option value="Micro-entreprise">Micro-entreprise</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label">SIRET</label>
                          <input 
                            type="text" 
                            class="form-input" 
                            formControlName="siret"
                            placeholder="12345678901234"
                            maxlength="14"
                          />
                        </div>
                        
                        <div class="flex gap-3">
                          <button 
                            type="submit" 
                            class="btn btn-primary"
                            [disabled]="enterpriseForm.invalid || savingEnterprise()"
                          >
                            @if (savingEnterprise()) {
                              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Enregistrement...
                            } @else {
                              Enregistrer
                            }
                          </button>
                          <button 
                            type="button" 
                            (click)="cancelEditEnterprise()"
                            class="btn btn-secondary"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    }
                  </div>
                }
              </div>
            </div>
          }

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
                <div class="w-20 h-20 bg-primary-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <span class="text-2xl font-bold text-primary-700">
                    {{ getUserInitials(getFullName(user)) }}
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900 mb-1">{{ getFullName(user) }}</h3>
                <p class="text-sm text-gray-600 mb-4">{{ getRoleLabel(authService.userRole()) }}</p>
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
  readonly enterpriseService = inject(EnterpriseService);
  private readonly fb = inject(FormBuilder);

  // Signals d'état
  readonly savingPreferences = signal(false);
  readonly editingEnterprise = signal(false);
  readonly savingEnterprise = signal(false);

  // Formulaire de préférences
  readonly preferencesForm = this.fb.nonNullable.group({
    emailNotifications: [true],
    pushNotifications: [false],
    theme: ['auto'],
    dateFormat: ['dd/MM/yyyy']
  });

  // Formulaire d'entreprise
  readonly enterpriseForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    logo_url: [''],
    legal_form: [''],
    siret: ['', [Validators.pattern(/^\d{14}$/)]]
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
    // Charger les données de l'entreprise
    this.loadEnterpriseData();
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

  getFullName(user: any): string {
    if (user.full_name) {
      return user.full_name;
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.last_name) {
      return user.last_name;
    }
    return 'Utilisateur';
  }

  getUserInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleLabel(role: string | null | undefined): string {
    if (!role) return 'Utilisateur';
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

  /**
   * Méthodes pour l'entreprise
   */
  private async loadEnterpriseData(): Promise<void> {
    try {
      await this.enterpriseService.loadEnterpriseData();
      // Remplir le formulaire avec les données existantes
      const enterprise = this.enterpriseService.enterprise();
      if (enterprise) {
        this.enterpriseForm.patchValue({
          name: enterprise.name,
          logo_url: enterprise.logo_url || '',
          legal_form: enterprise.legal_form || '',
          siret: enterprise.siret || ''
        });
      }
    } catch (error) {
      console.warn('Impossible de charger les données de l\'entreprise:', error);
    }
  }

  toggleEditEnterprise(): void {
    if (this.editingEnterprise()) {
      this.cancelEditEnterprise();
    } else {
      this.editingEnterprise.set(true);
      // Remplir le formulaire avec les données actuelles
      const enterprise = this.enterpriseService.enterprise();
      if (enterprise) {
        this.enterpriseForm.patchValue({
          name: enterprise.name,
          logo_url: enterprise.logo_url || '',
          legal_form: enterprise.legal_form || '',
          siret: enterprise.siret || ''
        });
      }
    }
  }

  cancelEditEnterprise(): void {
    this.editingEnterprise.set(false);
    this.enterpriseForm.reset();
    // Restaurer les valeurs originales
    const enterprise = this.enterpriseService.enterprise();
    if (enterprise) {
      this.enterpriseForm.patchValue({
        name: enterprise.name,
        logo_url: enterprise.logo_url || '',
        legal_form: enterprise.legal_form || '',
        siret: enterprise.siret || ''
      });
    }
  }

  async saveEnterprise(): Promise<void> {
    if (this.enterpriseForm.invalid || this.savingEnterprise()) {
      return;
    }

    this.savingEnterprise.set(true);
    try {
      const formData = this.enterpriseForm.getRawValue();
      
      // Nettoyer les données
      const updateData = {
        name: formData.name,
        logo_url: formData.logo_url || undefined,
        legal_form: formData.legal_form || undefined,
        siret: formData.siret || undefined
      };

      await this.enterpriseService.updateEnterprise(updateData);
      this.editingEnterprise.set(false);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'entreprise:', error);
    } finally {
      this.savingEnterprise.set(false);
    }
  }

  formatSiret(siret: string): string {
    if (!siret || siret.length !== 14) {
      return siret;
    }
    
    // Formater le SIRET comme: 123 456 789 01234
    return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
  }
}