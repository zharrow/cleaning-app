// ========================================
// Multi-tier Authentication Service
// Supports: Developer (Firebase), Admin (Firebase), Employee (PIN)
// ========================================
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { resource, ResourceRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EmployeeService } from './employee.service';
import { UserResponse } from '../../shared/models/user.models';

/**
 * Types pour l'authentification multi-niveau
 */
export type UserType = 'developer' | 'admin' | 'employee';

export interface AppUser {
  readonly id: string;
  readonly firebase_uid?: string; // Optional for employees (PIN auth)
  readonly email?: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly full_name: string;
  readonly user_type: UserType;
  readonly enterprise_id?: string; // For admin and employee
  readonly is_active: boolean;
  readonly created_at: string;
}

export interface AdminUser extends AppUser {
  readonly firebase_uid: string;
  readonly email: string;
  readonly user_type: 'admin';
  readonly enterprise_id: string;
}

export interface EmployeeUser extends AppUser {
  readonly user_type: 'employee';
  readonly enterprise_id: string;
  readonly accessible_rooms: string[];
}

export interface DeveloperUser extends AppUser {
  readonly firebase_uid: string;
  readonly email: string;
  readonly user_type: 'developer';
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface PinLoginCredentials {
  readonly pin_code: string;
  readonly enterprise_id: string;
}

export interface AuthState {
  readonly firebaseUser: User | null;
  readonly appUser: AppUser | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isAuthenticated: boolean;
  readonly userType: UserType | null;
}

/**
 * Multi-tier Authentication Service
 * Gère Firebase Auth (Developer/Admin) + PIN Auth (Employee)
 */
@Injectable({ providedIn: 'root' })
export class AuthMultiTierService {
  // Services injectés
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly employeeService = inject(EmployeeService);

  // Signals d'état
  readonly firebaseUserSignal = signal<User | null>(null);
  readonly appUserSignal = signal<AppUser | null>(null);
  readonly loadingSignal = signal(true);
  readonly errorSignal = signal<string | null>(null);
  readonly authCheckCompleted = signal(false);
  readonly userTypeSignal = signal<UserType | null>(null);

  // Signal pour éviter de créer la session plusieurs fois
  private readonly sessionCreationAttempted = signal(false);

  // Resource pour récupérer les données Admin/Developer depuis l'API
  readonly adminDeveloperResource: ResourceRef<AppUser | null | undefined> = resource({
    request: () => ({ firebaseUid: this.firebaseUserSignal()?.uid }),
    loader: async ({ request }) => {
      if (!request.firebaseUid) return null;

      try {
        const token = await this.firebaseUserSignal()?.getIdToken();
        if (!token) return null;

        const response = await firstValueFrom(
          this.http.get<AppUser>(`${environment.apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        return response;
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        // Si l'utilisateur n'existe pas en base, essayer de le créer
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          try {
            const token = await this.firebaseUserSignal()?.getIdToken();
            if (token) {
              const createResponse = await firstValueFrom(
                this.http.post<{user: AppUser}>(`${environment.apiUrl}/auth/login`, {
                  id_token: token
                })
              );
              return createResponse.user;
            }
          } catch (createError) {
            console.error('Erreur lors de la création automatique:', createError);
          }
        }
        return null;
      }
    }
  });

  // Computed signals publics
  readonly firebaseUser = this.firebaseUserSignal.asReadonly();
  readonly appUser = computed(() =>
    this.appUserSignal() ?? this.adminDeveloperResource.value() ?? null
  );
  readonly isAuthenticated = computed(() =>
    !!this.firebaseUserSignal() || !!this.appUserSignal()
  );
  readonly isLoading = computed(() =>
    this.loadingSignal() || this.adminDeveloperResource.isLoading()
  );
  readonly error = computed(() =>
    this.errorSignal() || this.adminDeveloperResource.error()
  );
  readonly authReady = this.authCheckCompleted.asReadonly();
  readonly userType = computed(() => this.appUser()?.user_type ?? null);

  // User type helpers
  readonly isDeveloper = computed(() => this.userType() === 'developer');
  readonly isAdmin = computed(() => this.userType() === 'admin');
  readonly isEmployee = computed(() => this.userType() === 'employee');

  // État global de l'authentification
  readonly authState = computed<AuthState>(() => ({
    firebaseUser: this.firebaseUser(),
    appUser: this.appUser(),
    isLoading: this.isLoading(),
    error: this.error() as string | null,
    isAuthenticated: this.isAuthenticated(),
    userType: this.userType()
  }));

  constructor() {
    this.initializeAuth();

    // Effect pour logger les changements d'état
    if (!environment.production) {
      effect(() => {
        const state = this.authState();
        console.log('🔐 Auth State:', {
          isAuthenticated: state.isAuthenticated,
          userType: state.userType,
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

    // Effect pour créer automatiquement la session du jour (Admin uniquement)
    effect(() => {
      const user = this.appUser();
      const isAuthenticated = this.isAuthenticated();
      const attempted = this.sessionCreationAttempted();

      if (isAuthenticated && user && user.user_type === 'admin' && !attempted) {
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
      this.firebaseUserSignal.set(user);
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
    const userType = this.userType();

    // Redirection si connecté sur page de login
    if (isAuthenticated && (currentPath === '/login' || currentPath === '/login/pin')) {
      if (userType === 'employee') {
        this.router.navigate(['/tablet']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

    // Redirection si non connecté sur page protégée
    if (!isAuthenticated && !currentPath.startsWith('/login')) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Connexion avec email/password (Developer/Admin uniquement)
   */
  async loginWithFirebase(credentials: LoginCredentials): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      if (userCredential.user) {
        // Le signal sera mis à jour automatiquement par onAuthStateChanged
        // Créer l'utilisateur en base s'il n'existe pas
        try {
          const token = await userCredential.user.getIdToken();
          await firstValueFrom(
            this.http.post(`${environment.apiUrl}/auth/login`, {
              id_token: token
            })
          );
        } catch (error) {
          console.warn('Erreur lors de la création/vérification:', error);
        }

        return true;
      }

      throw new Error('Connexion échouée');
    } catch (error) {
      const errorMessage = this.getFirebaseErrorMessage(error);
      this.errorSignal.set(errorMessage);
      console.error('Erreur de connexion Firebase:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Connexion avec PIN (Employee uniquement)
   */
  async loginWithPin(credentials: PinLoginCredentials): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await this.employeeService.loginWithPin(
        credentials.pin_code,
        credentials.enterprise_id
      );

      if (response.user) {
        // Construire l'objet AppUser pour l'employé
        const employeeUser: EmployeeUser = {
          id: response.user.id,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          full_name: response.user.full_name,
          user_type: 'employee',
          enterprise_id: response.user.enterprise_id,
          is_active: response.user.is_active,
          created_at: response.user.created_at,
          accessible_rooms: response.accessible_rooms
        };

        this.appUserSignal.set(employeeUser);
        this.userTypeSignal.set('employee');

        // Stocker les infos dans localStorage pour persistance
        localStorage.setItem('employee_session', JSON.stringify(employeeUser));

        return true;
      }

      throw new Error('Connexion PIN échouée');
    } catch (error) {
      this.errorSignal.set('Code PIN incorrect ou entreprise invalide');
      console.error('Erreur de connexion PIN:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Déconnexion (tous types d'utilisateurs)
   */
  async logout(): Promise<void> {
    try {
      const userType = this.userType();

      // Firebase logout pour Admin/Developer
      if (userType === 'admin' || userType === 'developer') {
        await signOut(this.auth);
      }

      // Clear employee session
      if (userType === 'employee') {
        localStorage.removeItem('employee_session');
      }

      this.appUserSignal.set(null);
      this.userTypeSignal.set(null);
      this.errorSignal.set(null);
      this.sessionCreationAttempted.set(false);

      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      this.errorSignal.set('Erreur lors de la déconnexion');
    }
  }

  /**
   * Obtient le token Firebase actuel (Admin/Developer uniquement)
   */
  async getToken(): Promise<string | null> {
    const user = this.firebaseUser();
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
    const userType = this.userType();

    if (userType === 'admin' || userType === 'developer') {
      this.adminDeveloperResource.reload();
    }
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
  hasUserType(requiredType: UserType): boolean {
    return this.userType() === requiredType;
  }

  /**
   * Crée automatiquement la session du jour (Admin uniquement)
   */
  private async createTodaySessionIfNeeded(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) return;

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/sessions/today`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      console.log('✅ Session du jour créée/récupérée automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la création automatique de la session:', error);
    }
  }

  /**
   * Convertit les erreurs Firebase en messages lisibles
   */
  private getFirebaseErrorMessage(error: any): string {
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
        return 'Trop de tentatives. Réessayez plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion réseau';
      case 'auth/invalid-credential':
        return 'Identifiants invalides';
      default:
        return error?.message || 'Une erreur est survenue';
    }
  }
}
