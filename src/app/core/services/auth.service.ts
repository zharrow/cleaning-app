// src/app/core/services/auth.service.ts
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  IdTokenResult 
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, catchError, of, throwError } from 'rxjs';

export type AppRole = 'admin' | 'manager' | 'gerante';

export interface AppUser {
  id: string;
  firebase_uid: string;
  full_name: string;
  role: AppRole;
  created_at: string;
}

/**
 * Service d'authentification amélioré avec gestion du refresh des tokens
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  
  // Signals pour l'état
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly appUserSignal = signal<AppUser | null>(null);
  private readonly loadingSignal = signal(true);
  private readonly errorSignal = signal<string | null>(null);
  private readonly authCheckCompleted = signal(false);
  private readonly tokenExpirationSignal = signal<Date | null>(null);
  
  // Dev mode role override (uniquement en dev)
  private readonly devRoleSignal = signal<AppRole | null>(null);
  
  // Cache pour éviter les appels API multiples
  private tokenCache: { token: string; expiration: Date } | null = null;
  
  // Signals publics
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly appUser = this.appUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly authReady = this.authCheckCompleted.asReadonly();
  
  // Computed role avec support du dev mode
  readonly userRole = computed<AppRole | null>(() => {
    // En dev, priorité au role override
    if (!environment.production && this.devRoleSignal()) {
      return this.devRoleSignal();
    }
    return this.appUserSignal()?.role || null;
  });
  
  // Role normalisé pour la compatibilité
  readonly normalizedRole = computed<AppRole | null>(() => {
    const role = this.userRole();
    if (!role) return null;
    
    // Normalisation des variantes de rôles
    const roleMap: Record<string, AppRole> = {
      'admin': 'admin',
      'administrator': 'admin',
      'manager': 'manager',
      'gestionnaire': 'manager',
      'gerante': 'gerante',
      'gerant': 'gerante'
    };
    
    return roleMap[role.toLowerCase()] || role as AppRole;
  });
  
  // Helpers pour les permissions
  readonly canManage = computed(() => {
    const role = this.normalizedRole();
    return role === 'admin' || role === 'manager' || role === 'gerante';
  });
  
  readonly isAdmin = computed(() => this.normalizedRole() === 'admin');
  readonly isManager = computed(() => this.normalizedRole() === 'manager');
  readonly isGerante = computed(() => this.normalizedRole() === 'gerante');
  
  constructor() {
    console.log('🔐 AuthService initialisé');
    this.initializeAuthListener();
    this.setupTokenRefreshMonitor();
    this.loadDevRole();
  }
  
  /**
   * Charge le rôle dev depuis localStorage (dev uniquement)
   */
  private loadDevRole(): void {
    if (!environment.production) {
      const savedRole = localStorage.getItem('devRole') as AppRole | null;
      if (savedRole) {
        this.devRoleSignal.set(savedRole);
        console.log('🎭 Dev role chargé:', savedRole);
      }
    }
  }
  
  /**
   * Définit le rôle en mode dev (dev uniquement)
   */
  setDevRole(role: AppRole | null): void {
    if (environment.production) {
      console.warn('setDevRole n\'est pas disponible en production');
      return;
    }
    
    this.devRoleSignal.set(role);
    
    if (role) {
      localStorage.setItem('devRole', role);
      console.log('🎭 Dev role défini:', role);
    } else {
      localStorage.removeItem('devRole');
      console.log('🎭 Dev role supprimé');
    }
  }
  
  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: AppRole): boolean {
    return this.normalizedRole() === role;
  }
  
  /**
   * Initialise l'écoute des changements d'état d'authentification
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      console.log('👤 État auth changé:', user ? 'Connecté' : 'Déconnecté');
      
      this.currentUserSignal.set(user);
      this.loadingSignal.set(false);
      
      if (user) {
        // Récupérer les infos du token
        const tokenResult = await user.getIdTokenResult();
        this.tokenExpirationSignal.set(new Date(tokenResult.expirationTime));
        
        console.log('🕐 Token expire à:', tokenResult.expirationTime);
        
        // Récupérer le profil utilisateur depuis l'API
        await this.fetchAppUser();
      } else {
        this.appUserSignal.set(null);
        this.tokenCache = null;
        this.tokenExpirationSignal.set(null);
      }
      
      this.authCheckCompleted.set(true);
    });
  }
  
  /**
   * Configure un moniteur pour rafraîchir le token avant expiration
   */
  private setupTokenRefreshMonitor(): void {
    effect(() => {
      const expiration = this.tokenExpirationSignal();
      const user = this.currentUserSignal();
      
      if (!expiration || !user) return;
      
      // Rafraîchir 5 minutes avant l'expiration
      const refreshTime = expiration.getTime() - Date.now() - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        console.log(`⏰ Refresh du token prévu dans ${Math.round(refreshTime / 1000 / 60)} minutes`);
        
        setTimeout(async () => {
          console.log('🔄 Refresh automatique du token...');
          await this.refreshToken();
        }, refreshTime);
      }
    });
  }
  
  /**
   * Connexion avec email et mot de passe
   * Alias pour signInWithEmail pour la compatibilité
   */
  async signIn(email: string, password: string): Promise<void> {
    return this.signInWithEmail(email, password);
  }
  
  /**
   * Connexion avec email et mot de passe
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    console.log('🔑 Tentative de connexion:', email);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      console.log('✅ Connexion Firebase réussie');
      
      // Forcer le refresh du token pour avoir un token frais
      await userCredential.user.getIdToken(true);
      
      // Récupérer le profil utilisateur
      await this.fetchAppUser();
      
      console.log('✅ Profil utilisateur chargé');
      await this.router.navigate(['/dashboard']);
      
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      const errorMessage = this.getFirebaseErrorMessage(error.code);
      this.errorSignal.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Récupère le profil utilisateur depuis l'API backend
   */
  private async fetchAppUser(): Promise<void> {
    try {
      console.log('📥 Récupération du profil utilisateur...');
      
      // Attendre que le token soit disponible
      const token = await this.getIdToken(true);
      if (!token) {
        throw new Error('Pas de token disponible');
      }
      
      const response = await firstValueFrom(
        this.http.get<AppUser>(`${environment.apiUrl}/users/me`).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('❌ Erreur API:', error);
            
            // Si 404, l'utilisateur n'existe pas encore côté backend
            if (error.status === 404) {
              return this.createUserProfile();
            }
            
            return throwError(() => error);
          })
        )
      );
      
      if (response) {
        this.appUserSignal.set(response as AppUser);
        console.log('✅ Profil récupéré:', (response as AppUser).full_name, 'Role:', (response as AppUser).role);
      }
    } catch (error) {
      console.error('⚠️ Erreur récupération profil:', error);
      
      // En dev, créer un mock user si l'API est down
      if (!environment.production && this.currentUserSignal()) {
        const mockUser: AppUser = {
          id: 'mock-id',
          firebase_uid: this.currentUserSignal()!.uid,
          full_name: this.currentUserSignal()!.email?.split('@')[0] || 'Dev User',
          role: 'gerante',
          created_at: new Date().toISOString()
        };
        
        this.appUserSignal.set(mockUser);
        console.log('🎭 Mock user créé pour le dev:', mockUser);
      }
    }
  }
  
  /**
   * Crée le profil utilisateur côté backend lors de la première connexion
   */
  private async createUserProfile() {
    const user = this.currentUserSignal();
    if (!user) return of(null);
    
    console.log('🆕 Création du profil utilisateur côté backend...');
    
    const token = await user.getIdToken();
    
    return this.http.post<AppUser>(`${environment.apiUrl}/auth/login`, {
      id_token: token
    });
  }
  
  /**
   * Récupère le token Firebase avec gestion du cache
   * @param forceRefresh Force le refresh du token même s'il n'est pas expiré
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.currentUserSignal();
    if (!user) {
      console.warn('⚠️ Pas d\'utilisateur connecté');
      return null;
    }
    
    try {
      // Vérifier le cache si pas de force refresh
      if (!forceRefresh && this.tokenCache) {
        const now = new Date();
        // Utiliser le cache si le token expire dans plus de 5 minutes
        if (this.tokenCache.expiration > new Date(now.getTime() + 5 * 60 * 1000)) {
          console.log('📦 Utilisation du token en cache');
          return this.tokenCache.token;
        }
      }
      
      console.log('🔄 Récupération du token Firebase...');
      const token = await user.getIdToken(forceRefresh);
      const tokenResult = await user.getIdTokenResult();
      
      // Mettre à jour le cache
      this.tokenCache = {
        token,
        expiration: new Date(tokenResult.expirationTime)
      };
      
      this.tokenExpirationSignal.set(this.tokenCache.expiration);
      console.log('✅ Token récupéré, expire à:', tokenResult.expirationTime);
      
      return token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      this.tokenCache = null;
      return null;
    }
  }
  
  /**
   * Force le refresh du token
   */
  async refreshToken(): Promise<string | null> {
    console.log('🔄 Refresh forcé du token...');
    return this.getIdToken(true);
  }
  
  /**
   * Déconnexion
   * Alias pour signOut pour la compatibilité
   */
  async signOutUser(): Promise<void> {
    return this.signOut();
  }
  
  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    console.log('🚪 Déconnexion...');
    
    try {
      await signOut(this.auth);
      this.currentUserSignal.set(null);
      this.appUserSignal.set(null);
      this.tokenCache = null;
      this.tokenExpirationSignal.set(null);
      
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
   * Vérifie si l'authentification est prête
   */
  async waitForAuthCheck(): Promise<boolean> {
    if (this.authCheckCompleted()) {
      return this.isAuthenticated();
    }
    
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
   * Traduit les codes d'erreur Firebase
   */
  private getFirebaseErrorMessage(code: string): string {
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
    
    return messages[code] || 'Une erreur est survenue';
  }
}