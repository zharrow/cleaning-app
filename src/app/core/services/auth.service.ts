import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppUser {
  id: string;
  firebase_uid: string;
  full_name: string;
  role: 'gerante';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  // Signals pour l'état
  private currentUserSignal = signal<User | null>(null);
  private appUserSignal = signal<AppUser | null>(null);
  private loadingSignal = signal(true);
  private errorSignal = signal<string | null>(null);
  
  // Computed signals
  currentUser = this.currentUserSignal.asReadonly();
  appUser = this.appUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isLoading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  
  initializeAuth() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUserSignal.set(user);
      
      if (user) {
        await this.fetchAppUser();
      } else {
        this.appUserSignal.set(null);
      }
      
      this.loadingSignal.set(false);
    });
  }
  
  async signIn(email: string, password: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUserSignal.set(credential.user);
      await this.fetchAppUser();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorSignal.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSignal.set(null);
      this.appUserSignal.set(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
  
  async getIdToken(): Promise<string | null> {
    const user = this.currentUserSignal();
    if (!user) return null;
    return user.getIdToken();
  }
  
  private async fetchAppUser(): Promise<void> {
    try {
      const response = await this.http.get<AppUser>(`${environment.apiUrl}/users/me`).toPromise();
      if (response) {
        this.appUserSignal.set(response);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  }
  
  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/invalid-email': 'Email invalide',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Utilisateur non trouvé',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/invalid-credential': 'Identifiants invalides',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard'
    };
    return messages[code] || 'Une erreur est survenue';
  }
}