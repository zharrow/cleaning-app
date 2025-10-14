// ========================================
// Service d'authentification Angular 19
// src/app/core/services/auth.service.ts
// ========================================
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { resource, ResourceRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/**
 * Types pour l'authentification
 */
export type AppRole = 'admin' | 'manager' | 'gerante';

export interface AppUser {
  readonly id: string;
  readonly firebase_uid: string;
  readonly email?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly full_name?: string; // Computed from first_name + last_name for Admin, or provided directly
  readonly role?: AppRole; // Optional for Admin (can be inferred), required for legacy users
  readonly is_active?: boolean;
  readonly created_by_id?: string;
  readonly created_at: string;
  readonly updated_at?: string;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthState {
  readonly user: User | null;
  readonly appUser: AppUser | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isAuthenticated: boolean;
}

/**
 * Service d'authentification moderne utilisant Angular 19
 * Gère Firebase Auth + API backend avec signals et resource()
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Services injectés
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  
  // Signals d'état
  readonly currentUserSignal = signal<User | null>(null);
  readonly appUserSignal = signal<AppUser | null>(null);
  readonly loadingSignal = signal(true);
  readonly errorSignal = signal<string | null>(null);
  readonly authCheckCompleted = signal(false);
  
  // Dev role override (non-production uniquement)
  private readonly devRoleSignal = signal<AppRole | null>(null);
  
  // Signal pour éviter de créer la session plusieurs fois
  private readonly sessionCreationAttempted = signal(false);
  
  // Resource pour récupérer les données utilisateur depuis l'API
  readonly userResource: ResourceRef<AppUser | null | undefined> = resource({
    request: () => ({ firebaseUid: this.currentUserSignal()?.uid }),
    loader: async ({ request }) => {
      if (!request.firebaseUid) return null;
      
      try {
        const token = await this.currentUserSignal()?.getIdToken();
        if (!token) return null;
        
        const response = await firstValueFrom(
          this.http.get<AppUser>(`${environment.apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        return response;
      } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        // Si l'utilisateur n'existe pas en base, essayer de le créer
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          try {
            const token = await this.currentUserSignal()?.getIdToken();
            if (token) {
              const createResponse = await firstValueFrom(
                this.http.post<{user: AppUser}>(`${environment.apiUrl}/auth/login`, {
                  id_token: token
                })
              );
              return createResponse.user;
            }
          } catch (createError) {
            console.error('Erreur lors de la création automatique de l\'utilisateur:', createError);
          }
        }
        return null;
      }
    }
  });
  
  // Computed signals publics
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly appUser = computed(() => this.userResource.value() ?? null);
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = computed(() => this.loadingSignal() || this.userResource.isLoading());
  readonly error = computed(() => this.errorSignal() || this.userResource.error());
  readonly authReady = this.authCheckCompleted.asReadonly();
  
  // Role helpers avec support du dev override
  readonly userRole = computed<AppRole | null>(() => {
    // En développement, priorité au rôle override
    if (!environment.production && this.devRoleSignal()) {
      return this.devRoleSignal();
    }

    const user = this.appUser();
    if (!user) return null;

    // Si le rôle est explicitement défini, l'utiliser
    if (user.role) return user.role;

    // Sinon, déduire le rôle : si l'utilisateur a firebase_uid, c'est un Admin
    // (User/employés n'ont pas firebase_uid, ils utilisent PIN)
    if (user.firebase_uid) return 'admin';

    return null;
  });
  
  readonly isAdmin = computed(() => this.userRole() === 'admin');
  readonly isManager = computed(() => ['admin', 'manager'].includes(this.userRole() ?? ''));
  readonly isGerante = computed(() => ['admin', 'manager', 'gerante'].includes(this.userRole() ?? ''));
  
  // État global de l'authentification
  readonly authState = computed<AuthState>(() => ({
    user: this.currentUser(),
    appUser: this.appUser(),
    isLoading: this.isLoading(),
    error: this.error() as string | null,
    isAuthenticated: this.isAuthenticated()
  }));
  
  constructor() {
    this.initializeAuth();
    
    // Effect pour logger les changements d'état
    if (!environment.production) {
      effect(() => {
        const state = this.authState();
        console.log('🔐 Auth State:', {
          isAuthenticated: state.isAuthenticated,
          userRole: this.userRole(),
          isLoading: state.isLoading,
          error: state.error
        });
      });
    }
    
    // Effect pour la navigation automatique
    effect(() => {
      if (this.authReady() && !this.isLoading()) {
        this.handleAuthStateChange();
      }
    });

    // Effect pour créer automatiquement la session du jour
    effect(() => {
      const user = this.appUser();
      const isAuthenticated = this.isAuthenticated();
      const attempted = this.sessionCreationAttempted();
      
      if (isAuthenticated && user && (user.role === 'admin' || user.role === 'manager') && !attempted) {
        this.sessionCreationAttempted.set(true);
        this.createTodaySessionIfNeeded();
      }
    });
  }
  
  /**
   * Initialise l'écoute des changements d'authentification Firebase
   */
  private initializeAuth(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSignal.set(user);
      this.errorSignal.set(null);
      
      if (!this.authCheckCompleted()) {
        this.authCheckCompleted.set(true);
        this.loadingSignal.set(false);
      }
    });
  }
  
  /**
   * Gère les changements d'état d'authentification pour la navigation
   */
  private handleAuthStateChange(): void {
    const currentPath = this.router.url;
    const isAuthenticated = this.isAuthenticated();
    
    // Redirection si connecté sur page de login
    if (isAuthenticated && currentPath === '/login') {
      this.router.navigate(['/dashboard']);
    }
    
    // Redirection si non connecté sur page protégée
    if (!isAuthenticated && !currentPath.startsWith('/login')) {
      this.router.navigate(['/login']);
    }
  }
  
  /**
   * Connexion avec email/password
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      
      if (userCredential.user) {
        // Le signal currentUser sera mis à jour automatiquement par onAuthStateChanged
        // Le resource userResource se rechargera automatiquement
        
        // Créer l'utilisateur en base s'il n'existe pas déjà
        try {
          const token = await userCredential.user.getIdToken();
          await firstValueFrom(
            this.http.post(`${environment.apiUrl}/auth/login`, {
              id_token: token
            })
          );
        } catch (error) {
          console.warn('Erreur lors de la création/vérification de l\'utilisateur en base:', error);
        }
        
        return true;
      }
      
      throw new Error('Connexion échouée');
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.errorSignal.set(errorMessage);
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.appUserSignal.set(null);
      this.errorSignal.set(null);
      // Réinitialiser le flag de création de session pour la prochaine connexion
      this.sessionCreationAttempted.set(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      this.errorSignal.set('Erreur lors de la déconnexion');
    }
  }
  
  /**
   * Obtient le token Firebase actuel
   */
  async getToken(): Promise<string | null> {
    const user = this.currentUser();
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }
  
  /**
   * Rafraîchit les données utilisateur
   */
  async refreshUserData(): Promise<void> {
    this.userResource.reload();
  }
  
  /**
   * Méthodes utilitaires pour le développement
   */
  
  /**
   * Override du rôle en développement (dev uniquement)
   */
  setDevRole(role: AppRole | null): void {
    if (environment.production) {
      console.warn('setDevRole() ne fonctionne qu\'en développement');
      return;
    }
    
    this.devRoleSignal.set(role);
    console.log(`🔧 Dev role override: ${role}`);
  }
  
  /**
   * Reset de l'erreur
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
  
  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  hasPermission(requiredRole: AppRole): boolean {
    const currentRole = this.userRole();
    if (!currentRole) return false;
    
    const roleHierarchy: Record<AppRole, number> = {
      'gerante': 1,
      'manager': 2,
      'admin': 3
    };
    
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  }
  
  /**
   * Crée automatiquement la session du jour si nécessaire
   */
  private async createTodaySessionIfNeeded(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) return;

      // Appeler l'endpoint POST /sessions/today pour créer ou récupérer la session
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/sessions/today`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      console.log('✅ Session du jour créée/récupérée automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la création automatique de la session:', error);
      // Ne pas bloquer l'authentification si la création de session échoue
    }
  }

  /**
   * Méthodes privées
   */
  
  /**
   * Convertit les erreurs Firebase en messages lisibles
   */
  private getErrorMessage(error: any): string {
    const errorCode = error?.code || '';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresse email invalide';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/too-many-requests':
        return 'Trop de tentatives de connexion. Réessayez plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion réseau';
      case 'auth/invalid-credential':
        return 'Identifiants invalides';
      default:
        return error?.message || 'Une erreur est survenue lors de la connexion';
    }
  }
}