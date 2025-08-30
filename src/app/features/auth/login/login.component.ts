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
    <div class="min-h-screen flex px-4 lg:px-8 py-6">
      <!-- Left side - Visual/Branding -->
      <div class="hidden lg:flex lg:flex-1 relative bg-gradient-dark overflow-hidden rounded-3xl mr-8">
        <!-- Background orbs -->
        <div class="absolute inset-0">
          <div class="absolute w-80 h-80 orb orb-primary animate-pulse" style="top: 20%; left: 20%;"></div>
          <div class="absolute w-60 h-60 orb orb-secondary animate-pulse animate-delay-1000" style="bottom: 20%; right: 20%;"></div>
        </div>
        
        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-center px-12 py-12">
          <div class="flex flex-col gap-12">
            <!-- Logo -->
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 glass-dark rounded-xl flex items-center justify-center">
                <span class="text-3xl">🧹</span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-white">CleanCare</h1>
                <p class="text-success-400 text-base font-semibold">Nettoyage Professionnel</p>
              </div>
            </div>
            
            <!-- Hero text -->
            <div class="flex flex-col gap-6">
              <h2 class="text-5xl font-extrabold text-white leading-tight">
                Gérez vos<br>
                <span class="text-gradient-accent">
                  opérations
                </span><br>
                de nettoyage
              </h2>
              <p class="text-xl text-gray-300 leading-relaxed max-w-lg">
                Une solution complète pour planifier, suivre et optimiser vos activités de nettoyage professionnel.
              </p>
            </div>
            
            <!-- Features -->
            <div class="flex flex-col gap-5">
              <h3 class="text-lg font-semibold text-white mb-2">Fonctionnalités clés</h3>
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-4 text-gray-200">
                  <div class="w-3 h-3 bg-success-400 rounded flex-shrink-0"></div>
                  <span class="text-base">Planification intelligente des tâches</span>
                </div>
                <div class="flex items-center gap-4 text-gray-200">
                  <div class="w-3 h-3 bg-primary-400 rounded flex-shrink-0"></div>
                  <span class="text-base">Suivi en temps réel</span>
                </div>
                <div class="flex items-center gap-4 text-gray-200">
                  <div class="w-3 h-3 bg-warning-400 rounded flex-shrink-0"></div>
                  <span class="text-base">Rapports détaillés</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Login Form -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 bg-white lg:px-12">
        <div class="w-full" style="max-width: 24rem;">
          <div class="flex flex-col gap-8 animate-slide-up">
            <!-- Mobile logo -->
            <div class="lg:hidden text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                <span class="text-2xl">🧹</span>
              </div>
              <h1 class="text-2xl font-bold text-primary">CleanCare</h1>
              <p class="text-secondary text-sm">Nettoyage Professionnel</p>
            </div>
            
            <!-- Form header -->
            <div class="text-center lg:text-left">
              <h2 class="text-3xl font-bold text-primary">Connexion</h2>
              <p class="mt-2 text-secondary">Accédez à votre espace de travail</p>
            </div>
            
            <!-- Messages d'alerte -->
            @if (errorMessage()) {
              <div class="alert alert-danger">
                <div class="alert-icon">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="alert-content">
                  <div class="alert-title">Erreur de connexion</div>
                  <div class="alert-message">{{ errorMessage() }}</div>
                </div>
              </div>
            }

            @if (queryParams()['error']; as error) {
              <div class="alert alert-warning">
                <div class="alert-icon">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="alert-content">
                  <div class="alert-title">Information</div>
                  <div class="alert-message">{{ getErrorMessage(error) }}</div>
                </div>
              </div>
            }

            <!-- Formulaire de connexion -->
            <form [formGroup]="loginFormGroup" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
              
              <!-- Champ email -->
              <div class="form-group">
                <label for="email" class="form-label">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-input"
                  [class.error]="hasFieldError('email')"
                  placeholder="nom@exemple.com"
                  autocomplete="email"
                  [disabled]="isSubmitting()"
                />
                @if (hasFieldError('email')) {
                  <div class="form-error">{{ getFieldError('email') }}</div>
                }
              </div>

              <!-- Champ mot de passe -->
              <div class="form-group">
                <label for="password" class="form-label">
                  Mot de passe
                </label>
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
                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-muted hover:text-secondary transition-all"
                    (click)="togglePasswordVisibility()"
                    [disabled]="isSubmitting()"
                    [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (!showPassword()) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      }
                    </svg>
                  </button>
                </div>
                @if (hasFieldError('password')) {
                  <div class="form-error">{{ getFieldError('password') }}</div>
                }
              </div>

              <!-- Options -->
              <div class="flex items-center justify-between">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="rememberMe"
                    class="w-4 h-4 rounded border text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-0"
                    [disabled]="isSubmitting()"
                  />
                  <span class="ml-2 text-sm text-secondary">Se souvenir de moi</span>
                </label>
                
                <button
                  type="button"
                  class="text-sm text-primary font-medium hover:text-primary-600 transition-all underline underline-offset-4"
                  (click)="showForgotPassword()"
                  [disabled]="isSubmitting()"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <!-- Bouton de soumission -->
              <button
                type="submit"
                class="btn btn-primary btn-full btn-lg hover-lift"
                [disabled]="loginFormGroup.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <div class="spinner spinner-sm"></div>
                  <span>Connexion en cours...</span>
                } @else {
                  <span>Se connecter</span>
                }
              </button>
            </form>

            <!-- Aide -->
            <div class="text-center pt-6 border-t">
              <p class="text-sm text-secondary">
                Première connexion ? 
                <button
                  type="button"
                  class="font-medium text-primary hover:text-primary-600 transition-all underline underline-offset-4"
                  (click)="showForgotPassword()"
                >
                  Contactez l'administrateur
                </button>
              </p>
            </div>

            <!-- Footer -->
            <div class="text-center pt-8">
              <div class="flex items-center justify-center gap-6 text-xs text-muted">
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clip-rule="evenodd" />
                  </svg>
                  <span>Sécurisé</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span>PWA</span>
                </div>
                <span>v{{ appVersion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal "Mot de passe oublié" -->
    @if (showForgotPasswordModal()) {
      <div class="modal-overlay animate-fade-in" (click)="closeForgotPassword()">
        <div class="modal-content animate-fade-in-scale" style="max-width: 32rem;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Besoin d'aide ?</h3>
              </div>
            </div>
            <button 
              class="modal-close"
              (click)="closeForgotPassword()"
              [attr.aria-label]="'Fermer'"
            >
              ✕
            </button>
          </div>
          
          <div class="modal-body">
            <p class="text-secondary mb-4">
              Pour obtenir vos identifiants ou réinitialiser votre mot de passe, contactez votre administrateur système.
            </p>
            
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <svg class="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <dt class="text-sm font-medium text-primary">Email</dt>
                    <dd class="text-sm text-secondary">admin&#64;cleancare.fr</dd>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <svg class="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <dt class="text-sm font-medium text-primary">Téléphone</dt>
                    <dd class="text-sm text-secondary">01 23 45 67 89</dd>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <svg class="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <dt class="text-sm font-medium text-primary">Disponibilité</dt>
                    <dd class="text-sm text-secondary">Lun-Ven 9h-18h</dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button
              class="btn btn-primary btn-full"
              (click)="closeForgotPassword()"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
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