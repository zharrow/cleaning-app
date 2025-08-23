import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, type LoginCredentials } from '../../../core/services/auth.service';

/**
 * Interface pour l'état du formulaire
 */
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Interface pour les erreurs de validation
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Composant de connexion moderne avec Angular 19
 * Utilise les signals pour la gestion d'état et les nouvelles syntaxes de template
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div class="w-full max-w-md animate-slide-up">
        
        <!-- Logo et titre -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-2xl mb-4 hover-scale">
            <span class="text-3xl">🧹</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Micro-Crèche</h1>
          <p class="text-gray-600">Gestion du nettoyage quotidien</p>
        </div>

        <!-- Carte de connexion -->
        <div class="card card-elevated">
          <div class="card-body">
            <h2 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Connexion</h2>
            
            <!-- Messages d'alerte -->
            @if (errorMessage()) {
              <div class="alert alert-danger mb-4">
                <div class="alert-icon">
                  <span class="text-lg">⚠️</span>
                </div>
                <div class="alert-content">
                  <p class="alert-message">{{ errorMessage() }}</p>
                </div>
              </div>
            }

            @if (queryParams()['error']; as error) {
              <div class="alert alert-warning mb-4">
                <div class="alert-icon">
                  <span class="text-lg">ℹ️</span>
                </div>
                <div class="alert-content">
                  <p class="alert-message">{{ getErrorMessage(error) }}</p>
                </div>
              </div>
            }

            <!-- Formulaire de connexion -->
            <form [formGroup]="loginFormGroup" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Champ email -->
              <div class="form-group">
                <label for="email" class="form-label required">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-input"
                  [class.error]="hasFieldError('email')"
                  placeholder="votre@email.com"
                  autocomplete="email"
                  [disabled]="isSubmitting()"
                />
                @if (hasFieldError('email')) {
                  <div class="form-error">{{ getFieldError('email') }}</div>
                }
              </div>

              <!-- Champ mot de passe -->
              <div class="form-group">
                <label for="password" class="form-label required">Mot de passe</label>
                <div class="relative">
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    class="form-input pr-12"
                    [class.error]="hasFieldError('password')"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    [disabled]="isSubmitting()"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    (click)="togglePasswordVisibility()"
                    [disabled]="isSubmitting()"
                    [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  >
                    <span class="text-gray-400 hover:text-gray-600 text-lg">
                      {{ showPassword() ? '🙈' : '👁️' }}
                    </span>
                  </button>
                </div>
                @if (hasFieldError('password')) {
                  <div class="form-error">{{ getFieldError('password') }}</div>
                }
              </div>

              <!-- Option "Se souvenir de moi" -->
              <div class="flex items-center justify-between">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    formControlName="rememberMe"
                    class="mr-2"
                    [disabled]="isSubmitting()"
                  />
                  <span class="text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                
                <button
                  type="button"
                  class="text-sm text-primary-600 hover:text-primary-700"
                  (click)="showForgotPassword()"
                  [disabled]="isSubmitting()"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <!-- Bouton de soumission -->
              <button
                type="submit"
                class="btn btn-primary btn-full"
                [disabled]="loginFormGroup.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <div class="spinner spinner-sm"></div>
                  <span>Connexion en cours...</span>
                } @else {
                  <span>Se connecter</span>
                  <span class="text-lg">🔐</span>
                }
              </button>
            </form>

            <!-- Aide et liens -->
            <div class="mt-6 pt-6 border-t border-gray-200">
              <div class="text-center text-sm text-gray-600">
                <p class="mb-2">Première connexion ?</p>
                <p>Contactez votre administrateur pour obtenir vos identifiants.</p>
              </div>
            </div>

            <!-- Mode développement -->
            @if (showDevFeatures()) {
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="text-center">
                  <p class="text-xs text-gray-500 mb-3">🔧 Mode développement</p>
                  <div class="flex gap-2 justify-center">
                    @for (account of devAccounts(); track account.email) {
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        (click)="fillDevAccount(account)"
                        [disabled]="isSubmitting()"
                      >
                        {{ account.label }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Informations sur l'application -->
        <div class="mt-8 text-center text-sm text-gray-500">
          <p>Application PWA - Fonctionne hors ligne</p>
          <p class="mt-1">Version {{ appVersion }}</p>
        </div>
      </div>
    </div>

    <!-- Modal "Mot de passe oublié" -->
    @if (showForgotPasswordModal()) {
      <div class="modal-overlay" (click)="closeForgotPassword()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Mot de passe oublié</h3>
            <button 
              class="modal-close"
              (click)="closeForgotPassword()"
              [attr.aria-label]="'Fermer'"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <p class="text-gray-600 mb-4">
              Contactez votre administrateur pour réinitialiser votre mot de passe.
            </p>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-700">
                <strong>Administrateur :</strong><br>
                📧 admin&#64;micro-creche.fr<br>
                📞 01 23 45 67 89
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              class="btn btn-secondary"
              (click)="closeForgotPassword()"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .relative {
      position: relative;
    }

    .animate-slide-up {
      animation: slide-up 0.6s ease-out;
    }

    .hover-scale {
      transition: transform 0.2s ease;
    }

    .hover-scale:hover {
      transform: scale(1.05);
    }

    /* Animation au focus des champs */
    .form-input:focus {
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }

    /* Animation du bouton */
    .btn:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }

    /* Amélioration de l'accessibilité */
    .form-input:focus,
    .btn:focus {
      outline: 2px solid var(--color-primary-400);
      outline-offset: 2px;
    }
  `]
})
export class LoginComponent {
  // Services injectés
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Version de l'application
  readonly appVersion = '1.0.0';

  // Signals d'état - rendus publics pour le template
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly showForgotPasswordModal = signal(false);
  readonly formErrors = signal<FormErrors>({});

  // Form reactive
  readonly loginFormGroup = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  // Computed signals
  readonly errorMessage = computed(() => this.authService.error());
  readonly canSubmit = computed(() => 
    this.loginFormGroup.valid && !this.isSubmitting()
  );
  readonly queryParams = computed(() => this.route.snapshot.queryParams);
  readonly showDevFeatures = computed(() => 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );

  // Comptes de développement
  readonly devAccounts = signal([
    {
      email: 'gerante@micro-creche.fr',
      password: 'password123',
      label: 'Gérante'
    },
    {
      email: 'admin@micro-creche.fr',
      password: 'admin123',
      label: 'Admin'
    }
  ]);

  constructor() {
    // Effect pour rediriger si déjà connecté
    effect(() => {
      if (this.authService.isAuthenticated() && this.authService.authReady()) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Effect pour gérer les erreurs de validation
    effect(() => {
      const controls = this.loginFormGroup.controls;
      const errors: FormErrors = {};

      if (controls.email.invalid && controls.email.touched) {
        if (controls.email.errors?.['required']) {
          errors.email = 'L\'adresse email est requise';
        } else if (controls.email.errors?.['email']) {
          errors.email = 'Format d\'email invalide';
        }
      }

      if (controls.password.invalid && controls.password.touched) {
        if (controls.password.errors?.['required']) {
          errors.password = 'Le mot de passe est requis';
        } else if (controls.password.errors?.['minlength']) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }
      }

      this.formErrors.set(errors);
    });

    // Restaurer email si "se souvenir de moi" était coché
    this.restoreRememberedEmail();
  }

  /**
   * Soumission du formulaire
   */
  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.markAllFieldsAsTouched();
    
    if (this.loginFormGroup.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    
    try {
      const formValue = this.loginFormGroup.getRawValue();
      const credentials: LoginCredentials = {
        email: formValue.email,
        password: formValue.password
      };

      const success = await this.authService.login(credentials);
      
      if (success) {
        // Sauvegarder l'email si "se souvenir de moi" est coché
        this.handleRememberMe(formValue);
        
        // La redirection sera gérée automatiquement par le guard/service
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Actions d'interface
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  showForgotPassword(): void {
    this.showForgotPasswordModal.set(true);
  }

  closeForgotPassword(): void {
    this.showForgotPasswordModal.set(false);
  }

  fillDevAccount(account: { email: string; password: string }): void {
    this.loginFormGroup.patchValue({
      email: account.email,
      password: account.password
    });
  }

  /**
   * Gestion des erreurs
   */
  hasFieldError(field: keyof FormErrors): boolean {
    return !!this.formErrors()[field];
  }

  getFieldError(field: keyof FormErrors): string {
    return this.formErrors()[field] || '';
  }

  getErrorMessage(errorType: string): string {
    const messages: Record<string, string> = {
      'insufficient_permissions': 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
      'manage_access_denied': 'Accès refusé : fonctionnalités de gestion réservées aux managers.',
      'readonly_access': 'Accès en lecture seule : vous ne pouvez pas modifier les données.',
      'session_expired': 'Votre session a expiré, veuillez vous reconnecter.'
    };
    
    return messages[errorType] || 'Une erreur est survenue.';
  }

  /**
   * Méthodes utilitaires
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginFormGroup.controls).forEach(key => {
      this.loginFormGroup.get(key)?.markAsTouched();
    });
  }

  private handleRememberMe(formValue: LoginForm): void {
    if (typeof localStorage !== 'undefined') {
      if (formValue.rememberMe) {
        localStorage.setItem('rememberedEmail', formValue.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    }
  }

  private restoreRememberedEmail(): void {
    if (typeof localStorage !== 'undefined') {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        this.loginFormGroup.patchValue({
          email: rememberedEmail,
          rememberMe: true
        });
      }
    }
  }
}