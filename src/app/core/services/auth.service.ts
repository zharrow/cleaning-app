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
  readonly isAuthenticated = computed(() => !!this.currentUserSignal()); // CORRECTION ICI
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly authReady = this.authCheckCompleted.asReadonly();

  // Role helpers
  readonly userRole = computed<AppRole | null>(() => this.appUserSignal()?.role ?? null);
  // Normalize to permission tiers; allow dev override when not in production
  readonly normalizedRole = computed<'admin' | 'manager' | null>(() => {
    const override = !environment.production ? this.devRoleSignal() : null;
    const r = (override ?? this.userRole()) as AppRole | null;
    if (!r) return null;
    return r === 'admin' ? 'admin' : 'manager';
  });
  readonly canManage = computed(() => this.normalizedRole() === 'admin' || this.normalizedRole() === 'manager');

  hasRole(role: AppRole | 'admin' | 'manager'): boolean {
    const norm = this.normalizedRole();
    if (!norm) return false;
    // If asked for 'gerante', treat as manager equivalence
    if (role === 'gerante') return norm === 'manager';
    return norm === role;
  }

  hasAnyRole(roles: Array<AppRole | 'admin' | 'manager'>): boolean {
    return roles.some(r => this.hasRole(r));
  }
  
  constructor() {
    // Initialiser l'authentification automatiquement
    this.initializeAuth();
    
    // Charger un éventuel override de rôle en dev
    if (!environment.production) {
      this.loadDevRoleFromStorage();
      // Petites aides debug accessibles depuis la console
      (window as any).authDebug = {
        setRole: (role: AppRole | null) => this.setDevRole(role),
        getRole: () => this.devRoleSignal(),
        clearRole: () => this.setDevRole(null),
      };
    }
  }
  
  private loadDevRoleFromStorage(): void {
    try {
      const v = localStorage.getItem('devRole');
      if (v === 'admin' || v === 'manager' || v === 'gerante') {
        this.devRoleSignal.set(v);
      }
    } catch {}
  }

  setDevRole(role: AppRole | null): void {
    if (environment.production) return; // Sécurité
    try {
      if (role) {
        localStorage.setItem('devRole', role);
      } else {
        localStorage.removeItem('devRole');
      }
      this.devRoleSignal.set(role);
    } catch {}
  }
  
  /**
   * Initialise l'écouteur d'état Firebase Auth
   * Appelé automatiquement dans le constructeur
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
   * @param email Email de l'utilisateur
   * @param password Mot de passe
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
      console.log('✅ Déconnexion réussie');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      throw error;
    }
  }
  
  /**
   * Récupère le token Firebase pour les appels API
   * @returns Token JWT ou null
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
   * Utile pour les guards
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
      
      // Utiliser firstValueFrom pour convertir Observable en Promise
      const response = await firstValueFrom(
        this.http.get<AppUser>(`${environment.apiUrl}/users/me`)
      );
      
      if (response) {
        this.appUserSignal.set(response);
        console.log('✅ Profil récupéré:', response.full_name);
      }
    } catch (error) {
      console.error('⚠️ Erreur récupération profil (API peut-être indisponible):', error);
      // Ne pas bloquer la connexion si l'API backend est down
      // L'utilisateur peut quand même accéder à l'app
    }
  }
  
  /**
   * Traduit les codes d'erreur Firebase en messages français
   * @param code Code d'erreur Firebase
   * @returns Message d'erreur en français
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