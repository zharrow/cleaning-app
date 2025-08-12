// ========================================
// src/app/core/services/auth.service.ts
// ========================================
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Interface représentant un utilisateur de l'application
 */
export type AppRole = 'admin' | 'manager' | 'gerante';

export interface AppUser {
  id: string;
  firebase_uid: string;
  full_name: string;
  role: AppRole;
  created_at: string;
}

/**
 * Service de gestion de l'authentification Firebase
 * Gère la connexion, déconnexion et l'état de l'utilisateur
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  
  // Signals pour gérer l'état de l'authentification
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly appUserSignal = signal<AppUser | null>(null);
  private readonly loadingSignal = signal(true);
  private readonly errorSignal = signal<string | null>(null);
  private readonly authCheckCompleted = signal(false);
  
  // Dev-only role override (non-production)
  private readonly devRoleSignal = signal<AppRole | null>(null);
  
  // Signals publics en lecture seule
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly appUser = this.appUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly authReady = this.authCheckCompleted.asReadonly();

  // Role helpers avec priorité au dev role
  readonly userRole = computed<AppRole | null>(() => {
    // En dev, priorité au rôle override
    if (!environment.production && this.devRoleSignal()) {
      return this.devRoleSignal();
    }
    // Sinon utiliser le rôle de l'API
    return this.appUserSignal()?.role ?? null;
  });
  
  // Normalize to permission tiers
  readonly normalizedRole = computed<'admin' | 'manager' | null>(() => {
    const role = this.userRole();
    if (!role) return null;
    
    // Map gerante to manager for permissions
    if (role === 'admin') return 'admin';
    if (role === 'manager' || role === 'gerante') return 'manager';
    return null;
  });
  
  readonly canManage = computed(() => {
    const norm = this.normalizedRole();
    return norm === 'admin' || norm === 'manager';
  });

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: AppRole | 'admin' | 'manager'): boolean {
    const currentRole = this.userRole();
    const normalized = this.normalizedRole();
    
    // Vérification directe du rôle
    if (currentRole === role) return true;
    
    // Vérification avec normalisation
    if (role === 'manager' && normalized === 'manager') return true;
    if (role === 'admin' && normalized === 'admin') return true;
    if (role === 'gerante' && (currentRole === 'gerante' || normalized === 'manager')) return true;
    
    return false;
  }

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   */
  hasAnyRole(roles: Array<AppRole | 'admin' | 'manager'>): boolean {
    return roles.some(r => this.hasRole(r));
  }
  
  constructor() {
    // Initialiser l'authentification automatiquement
    this.initializeAuth();
    
    // Charger un éventuel override de rôle en dev
    if (!environment.production) {
      this.loadDevRoleFromStorage();
      
      // Helpers debug accessibles depuis la console
      (window as any).authDebug = {
        setRole: (role: AppRole | null) => this.setDevRole(role),
        getRole: () => this.devRoleSignal(),
        getCurrentRole: () => this.userRole(),
        getNormalizedRole: () => this.normalizedRole(),
        canManage: () => this.canManage(),
        clearRole: () => this.setDevRole(null),
        info: () => ({
          isAuthenticated: this.isAuthenticated(),
          devRole: this.devRoleSignal(),
          userRole: this.userRole(),
          normalizedRole: this.normalizedRole(),
          canManage: this.canManage(),
          appUser: this.appUserSignal()
        })
      };
      
      console.log('🔧 Debug auth disponible: authDebug.info()');
    }
    
    // Logger les changements de rôle en dev
    if (!environment.production) {
      effect(() => {
        const role = this.userRole();
        const normalized = this.normalizedRole();
        if (role || normalized) {
          console.log('🎭 Role update:', { 
            userRole: role, 
            normalized,
            canManage: this.canManage() 
          });
        }
      });
    }
  }
  
  /**
   * Charge le rôle dev depuis le localStorage
   */
  private loadDevRoleFromStorage(): void {
    if (environment.production) return;
    
    try {
      const storedRole = localStorage.getItem('devRole');
      if (storedRole === 'admin' || storedRole === 'manager' || storedRole === 'gerante') {
        this.devRoleSignal.set(storedRole as AppRole);
        console.log('🎭 Dev role loaded:', storedRole);
      }
    } catch (error) {
      console.error('Error loading dev role:', error);
    }
  }

  /**
   * Définit un rôle de développement (dev uniquement)
   */
  setDevRole(role: AppRole | null): void {
    if (environment.production) {
      console.warn('Dev role override is disabled in production');
      return;
    }
    
    try {
      if (role) {
        localStorage.setItem('devRole', role);
        console.log('🎭 Dev role set:', role);
      } else {
        localStorage.removeItem('devRole');
        console.log('🎭 Dev role cleared');
      }
      this.devRoleSignal.set(role);
    } catch (error) {
      console.error('Error setting dev role:', error);
    }
  }
  
  /**
   * Initialise l'écouteur d'état Firebase Auth
   */
  private initializeAuth(): void {
    console.log('🔐 Initialisation de l\'authentification...');
    
    onAuthStateChanged(this.auth, async (user) => {
      console.log('🔄 État auth changé:', user?.email || 'non connecté');
      
      this.currentUserSignal.set(user);
      
      if (user) {
        // Utilisateur connecté - récupérer les données
        await this.fetchAppUser();
        
        // Rediriger vers dashboard si on est sur login
        if (window.location.pathname === '/login') {
          console.log('➡️ Redirection vers dashboard');
          this.router.navigate(['/dashboard']);
        }
      } else {
        // Utilisateur déconnecté
        this.appUserSignal.set(null);
        this.devRoleSignal.set(null); // Clear dev role on logout
        
        // Rediriger vers login si nécessaire
        if (window.location.pathname !== '/login') {
          console.log('➡️ Redirection vers login');
          this.router.navigate(['/login']);
        }
      }
      
      this.loadingSignal.set(false);
      this.authCheckCompleted.set(true);
    });
  }
  
  /**
   * Connexion avec email et mot de passe
   */
  async signIn(email: string, password: string): Promise<void> {
    console.log('🔑 Tentative de connexion pour:', email);
    
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Connexion réussie:', credential.user.email);
      
      this.currentUserSignal.set(credential.user);
      
      // Récupérer les données utilisateur depuis l'API
      await this.fetchAppUser();
      
      // Navigation vers dashboard
      console.log('➡️ Navigation vers dashboard...');
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      const errorMessage = this.getErrorMessage(error.code);
      this.errorSignal.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Déconnexion de l'utilisateur
   */
  async signOutUser(): Promise<void> {
    console.log('🚪 Déconnexion...');
    
    try {
      await signOut(this.auth);
      this.currentUserSignal.set(null);
      this.appUserSignal.set(null);
      
      // Clear dev role on logout
      if (!environment.production) {
        this.devRoleSignal.set(null);
        localStorage.removeItem('devRole');
      }
      
      console.log('✅ Déconnexion réussie');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      throw error;
    }
  }
  
  /**
   * Récupère le token Firebase pour les appels API
   */
  async getIdToken(): Promise<string | null> {
    const user = this.currentUserSignal();
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Erreur récupération token:', error);
      return null;
    }
  }
  
  /**
   * Attendre que la vérification d'authentification soit terminée
   */
  async waitForAuthCheck(): Promise<boolean> {
    // Si déjà vérifié, retourner immédiatement
    if (this.authCheckCompleted()) {
      return this.isAuthenticated();
    }
    
    // Attendre que la vérification soit terminée (max 5 secondes)
    const maxWait = 5000;
    const checkInterval = 100;
    let waited = 0;
    
    while (!this.authCheckCompleted() && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    return this.isAuthenticated();
  }
  
  /**
   * Récupère les données utilisateur depuis l'API backend
   */
  private async fetchAppUser(): Promise<void> {
    try {
      console.log('📥 Récupération du profil utilisateur...');
      
      const response = await firstValueFrom(
        this.http.get<AppUser>(`${environment.apiUrl}/users/me`)
      );
      
      if (response) {
        this.appUserSignal.set(response);
        console.log('✅ Profil récupéré:', response.full_name, 'Role:', response.role);
      }
    } catch (error) {
      console.error('⚠️ Erreur récupération profil (API peut-être indisponible):', error);
      
      // En dev, on peut créer un utilisateur fictif si l'API est down
      if (!environment.production && this.currentUserSignal()) {
        const mockUser: AppUser = {
          id: 'mock-id',
          firebase_uid: this.currentUserSignal()!.uid,
          full_name: this.currentUserSignal()!.email?.split('@')[0] || 'Dev User',
          role: this.devRoleSignal() || 'gerante',
          created_at: new Date().toISOString()
        };
        
        this.appUserSignal.set(mockUser);
        console.log('🎭 Mock user created for dev:', mockUser);
      }
    }
  }
  
  /**
   * Traduit les codes d'erreur Firebase
   */
  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/invalid-email': 'Email invalide',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Utilisateur non trouvé',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/invalid-credential': 'Identifiants invalides',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau, vérifiez votre connexion',
      'auth/invalid-login-credentials': 'Email ou mot de passe incorrect'
    };
    
    return messages[code] || 'Une erreur est survenue lors de la connexion';
  }
}