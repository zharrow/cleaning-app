// ========================================
// Composant de diagnostic d'authentification
// src/app/features/auth/auth-diagnostic/auth-diagnostic.component.ts
// ========================================
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

/**
 * Composant de diagnostic pour identifier les problèmes d'authentification
 */
@Component({
  selector: 'app-auth-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-6">🔍 Diagnostic d'authentification</h2>
        
        <!-- État général -->
        <div class="mb-6 p-4 bg-gray-50 rounded">
          <h3 class="font-semibold mb-2">État général</h3>
          <div class="space-y-1 text-sm">
            <div>Authentifié: <span class="font-mono">{{ authService.isAuthenticated() ? '✅ Oui' : '❌ Non' }}</span></div>
            <div>Auth prête: <span class="font-mono">{{ authService.authReady() ? '✅ Oui' : '⏳ Non' }}</span></div>
            <div>En chargement: <span class="font-mono">{{ authService.isLoading() ? '⏳ Oui' : '✅ Non' }}</span></div>
            <div>Environnement: <span class="font-mono">{{ environment.production ? '🚀 Production' : '🔧 Développement' }}</span></div>
          </div>
        </div>
        
        <!-- Utilisateur Firebase -->
        @if (authService.currentUser(); as firebaseUser) {
          <div class="mb-6 p-4 bg-blue-50 rounded">
            <h3 class="font-semibold mb-2">🔥 Firebase User</h3>
            <div class="space-y-1 text-sm">
              <div>UID: <span class="font-mono text-xs bg-white px-1 rounded">{{ firebaseUser.uid }}</span></div>
              <div>Email: <span class="font-mono">{{ firebaseUser.email }}</span></div>
              <div>Vérifié: <span class="font-mono">{{ firebaseUser.emailVerified ? '✅ Oui' : '❌ Non' }}</span></div>
            </div>
          </div>
        }
        
        <!-- Utilisateur App -->
        @if (authService.appUser(); as appUser) {
          <div class="mb-6 p-4 bg-green-50 rounded">
            <h3 class="font-semibold mb-2">👤 App User (API)</h3>
            <div class="space-y-1 text-sm">
              <div>ID: <span class="font-mono">{{ appUser.id }}</span></div>
              <div>Nom: <span class="font-mono">{{ appUser.full_name }}</span></div>
              <div>Rôle: <span class="font-mono font-bold text-blue-600">{{ appUser.role || '⚠️ AUCUN RÔLE' }}</span></div>
              <div>Firebase UID: <span class="font-mono text-xs bg-white px-1 rounded">{{ appUser.firebase_uid }}</span></div>
            </div>
          </div>
        } @else {
          <div class="mb-6 p-4 bg-red-50 rounded">
            <h3 class="font-semibold mb-2 text-red-600">⚠️ Problème détecté: Pas d'App User</h3>
            <p class="text-sm mb-3">L'utilisateur Firebase est connecté mais l'App User n'est pas chargé depuis l'API.</p>
            
            <!-- Test API -->
            <div class="bg-white p-3 rounded border">
              <h4 class="font-medium mb-2">Test de l'API:</h4>
              <button 
                class="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 mr-2"
                (click)="testAPIConnection()"
                [disabled]="testingAPI()"
              >
                @if (testingAPI()) {
                  <span>⏳ Test en cours...</span>
                } @else {
                  🔍 Tester la connexion API
                }
              </button>
              
              @if (apiTestResult()) {
                <div class="mt-2 text-sm" [class]="apiTestResult()!.success ? 'text-green-600' : 'text-red-600'">
                  {{ apiTestResult()!.message }}
                </div>
              }
            </div>
          </div>
        }
        
        <!-- Rôles et permissions -->
        <div class="mb-6 p-4 bg-purple-50 rounded">
          <h3 class="font-semibold mb-2">🎭 Rôles et permissions</h3>
          <div class="space-y-1 text-sm">
            <div>Rôle actuel: <span class="font-mono font-bold">{{ authService.userRole() || '❌ AUCUN' }}</span></div>
            <div>Est Admin: <span class="font-mono">{{ authService.isAdmin() ? '✅ Oui' : '❌ Non' }}</span></div>
            <div>Est Manager: <span class="font-mono">{{ authService.isManager() ? '✅ Oui' : '❌ Non' }}</span></div>
            <div>Est Gérante: <span class="font-mono">{{ authService.isGerante() ? '✅ Oui' : '❌ Non' }}</span></div>
          </div>
        </div>
        
        <!-- Actions de résolution -->
        <div class="mb-6 p-4 bg-yellow-50 rounded">
          <h3 class="font-semibold mb-3">🛠️ Actions de résolution</h3>
          
          @if (!environment.production) {
            <div class="mb-4">
              <h4 class="font-medium mb-2">Mode développement - Forcer un rôle:</h4>
              <div class="flex gap-2">
                <button 
                  class="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                  (click)="setDevRole('admin')"
                >
                  👑 Admin
                </button>
                <button 
                  class="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                  (click)="setDevRole('manager')"
                >
                  👨‍💼 Manager
                </button>
                <button 
                  class="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
                  (click)="setDevRole('gerante')"
                >
                  👩‍💼 Gérante
                </button>
                <button 
                  class="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                  (click)="clearDevRole()"
                >
                  🔄 Reset
                </button>
              </div>
              <p class="text-xs text-gray-600 mt-2">⚠️ Cette fonction ne marche qu'en développement</p>
            </div>
          }
          
          <div class="space-y-2">
            <button 
              class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600 mr-2"
              (click)="refreshUserData()"
              [disabled]="refreshingUser()"
            >
              @if (refreshingUser()) {
                ⏳ Actualisation...
              } @else {
                🔄 Actualiser les données utilisateur
              }
            </button>
            
            <button 
              class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600"
              (click)="createOrUpdateUser()"
              [disabled]="creatingUser()"
            >
              @if (creatingUser()) {
                ⏳ Création...
              } @else {
                👤 Créer/Mettre à jour utilisateur
              }
            </button>
          </div>
        </div>

        <!-- Recommandations -->
        <div class="p-4 bg-blue-50 rounded">
          <h3 class="font-semibold mb-2">💡 Recommandations</h3>
          <ol class="text-sm space-y-1 list-decimal list-inside">
            @if (!authService.currentUser()) {
              <li class="text-red-600">Vous n'êtes pas connecté à Firebase. Connectez-vous d'abord.</li>
            }
            @if (authService.currentUser() && !authService.appUser()) {
              <li class="text-red-600">Votre utilisateur Firebase existe mais pas dans l'API. Cliquez sur "Créer/Mettre à jour utilisateur".</li>
            }
            @if (authService.appUser() && !authService.userRole()) {
              <li class="text-red-600">L'utilisateur n'a pas de rôle défini. Vérifiez dans la base de données que le champ 'role' est bien renseigné.</li>
            }
            @if (authService.userRole() && !authService.isManager()) {
              <li class="text-orange-600">L'utilisateur a le rôle "{{ authService.userRole() }}" qui ne permet pas d'accéder aux pages de gestion.</li>
              <li>Pour accéder à /manage/*, le rôle doit être: admin, manager ou gerante.</li>
            }
            @if (!environment.production) {
              <li class="text-blue-600">En mode dev, vous pouvez forcer un rôle avec les boutons ci-dessus pour tester.</li>
            }
          </ol>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AuthDiagnosticComponent {
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly environment = environment;
  
  // Signals pour les actions
  readonly testingAPI = signal(false);
  readonly apiTestResult = signal<{success: boolean; message: string} | null>(null);
  readonly refreshingUser = signal(false);
  readonly creatingUser = signal(false);
  
  /**
   * Test la connexion à l'API
   */
  async testAPIConnection(): Promise<void> {
    if (this.testingAPI()) return;
    
    this.testingAPI.set(true);
    this.apiTestResult.set(null);
    
    try {
      const firebaseUser = this.authService.currentUser();
      if (!firebaseUser) {
        this.apiTestResult.set({
          success: false,
          message: 'Aucun utilisateur Firebase connecté'
        });
        return;
      }
      
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${environment.apiUrl}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.apiTestResult.set({
          success: true,
          message: `✅ API OK - Utilisateur trouvé: ${userData.full_name} (${userData.role})`
        });
      } else {
        const errorData = await response.json();
        this.apiTestResult.set({
          success: false,
          message: `❌ API Error ${response.status}: ${errorData.detail || 'Erreur inconnue'}`
        });
      }
    } catch (error: any) {
      this.apiTestResult.set({
        success: false,
        message: `❌ Erreur réseau: ${error.message}`
      });
    } finally {
      this.testingAPI.set(false);
    }
  }
  
  /**
   * Actualise les données utilisateur
   */
  async refreshUserData(): Promise<void> {
    if (this.refreshingUser()) return;
    
    this.refreshingUser.set(true);
    try {
      await this.authService.refreshUserData();
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      this.refreshingUser.set(false);
    }
  }
  
  /**
   * Crée ou met à jour l'utilisateur dans l'API
   */
  async createOrUpdateUser(): Promise<void> {
    if (this.creatingUser()) return;
    
    const firebaseUser = this.authService.currentUser();
    if (!firebaseUser) {
      alert('Aucun utilisateur Firebase connecté');
      return;
    }
    
    this.creatingUser.set(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      // Appel à l'endpoint de création/mise à jour
      const response = await fetch(`${environment.apiUrl}/auth/register-or-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
          role: 'admin' // Forcer le rôle admin
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Utilisateur créé/mis à jour:', userData);
        
        // Actualiser les données
        await this.refreshUserData();
        
        alert(`✅ Utilisateur mis à jour avec succès!\nRôle: ${userData.role}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Erreur: ${errorData.detail}`);
      }
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      this.creatingUser.set(false);
    }
  }
  
  /**
   * Actions de développement
   */
  setDevRole(role: 'admin' | 'manager' | 'gerante'): void {
    if (!environment.production) {
      this.authService.setDevRole(role);
      console.log(`✅ Rôle forcé à: ${role}`);
      alert(`Rôle forcé à: ${role}\n\nRafraîchissez la page pour voir les changements.`);
    }
  }
  
  clearDevRole(): void {
    if (!environment.production) {
      this.authService.setDevRole(null);
      console.log('✅ Rôle réinitialisé');
      alert('Rôle réinitialisé\n\nRafraîchissez la page pour voir les changements.');
    }
  }
}