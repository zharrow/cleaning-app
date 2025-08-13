// src/app/features/debug/auth-debug.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AuthDebugService } from '../../core/services/auth-debug.service';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

/**
 * Composant de debug pour diagnostiquer les problèmes d'authentification
 * À utiliser uniquement en développement
 */
@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-container">
      <h2>🔍 Debug Authentification</h2>
      
      @if (!isProduction) {
        <div class="warning">
          ⚠️ Mode développement - Outils de debug activés
        </div>
        
        <div class="section">
          <h3>État actuel</h3>
          <div class="status-grid">
            <div class="status-item">
              <span class="label">Authentifié:</span>
              <span [class.success]="authService.isAuthenticated()" 
                    [class.error]="!authService.isAuthenticated()">
                {{ authService.isAuthenticated() ? '✅ Oui' : '❌ Non' }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="label">Utilisateur Firebase:</span>
              <span>{{ authService.currentUser()?.email || 'Aucun' }}</span>
            </div>
            
            <div class="status-item">
              <span class="label">Utilisateur App:</span>
              <span>{{ authService.appUser()?.full_name || 'Non chargé' }}</span>
            </div>
            
            <div class="status-item">
              <span class="label">API URL:</span>
              <code>{{ apiUrl }}</code>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Actions de test</h3>
          <div class="button-grid">
            <button (click)="runFullDiagnostic()" 
                    [disabled]="diagnosticRunning()">
              {{ diagnosticRunning() ? '🔄 En cours...' : '🔍 Diagnostic complet' }}
            </button>
            
            <button (click)="testGetToken()" 
                    [disabled]="!authService.isAuthenticated()">
              🔑 Récupérer Token
            </button>
            
            <button (click)="testApiCall()" 
                    [disabled]="!authService.isAuthenticated()">
              📡 Test API /users/me
            </button>
            
            <button (click)="testRoomCreation()" 
                    [disabled]="!authService.isAuthenticated()">
              🏠 Test création Room
            </button>
            
            <button (click)="forceTokenRefresh()" 
                    [disabled]="!authService.isAuthenticated()">
              🔄 Forcer refresh token
            </button>
            
            <button (click)="clearConsole()">
              🧹 Nettoyer console
            </button>
          </div>
        </div>
        
        @if (lastTestResult()) {
          <div class="section">
            <h3>Résultat du dernier test</h3>
            <pre [class.success]="!lastTestError()" 
                 [class.error]="lastTestError()">{{ lastTestResult() }}</pre>
          </div>
        }
        
        <div class="section">
          <h3>Conseils de debug</h3>
          <ul>
            <li>Ouvrez la console (F12) pour voir les logs détaillés</li>
            <li>Vérifiez l'onglet Network pour voir les requêtes HTTP</li>
            <li>Cherchez les erreurs 401 dans les réponses</li>
            <li>Vérifiez que le header Authorization est présent</li>
            <li>Le token doit commencer par "Bearer "</li>
          </ul>
        </div>
      } @else {
        <div class="error">
          🚫 Les outils de debug ne sont pas disponibles en production
        </div>
      }
    </div>
  `,
  styles: [`
    .debug-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    
    h2 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    h3 {
      color: #555;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }
    
    .error {
      background: #f8d7da;
      border: 1px solid #dc3545;
      color: #721c24;
      padding: 1rem;
      border-radius: 4px;
    }
    
    .section {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .status-grid {
      display: grid;
      gap: 1rem;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
    }
    
    .label {
      font-weight: 600;
      color: #666;
    }
    
    .success {
      color: #28a745;
    }
    
    .error {
      color: #dc3545;
    }
    
    code {
      background: #e9ecef;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
    }
    
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    button {
      padding: 0.75rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    button:hover:not(:disabled) {
      background: #0056b3;
    }
    
    button:disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    pre {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      border: 1px solid #dee2e6;
    }
    
    pre.success {
      border-color: #28a745;
      background: #d4edda;
    }
    
    pre.error {
      border-color: #dc3545;
      background: #f8d7da;
    }
    
    ul {
      margin: 0;
      padding-left: 1.5rem;
    }
    
    li {
      margin: 0.5rem 0;
      color: #666;
    }
  `]
})
export class AuthDebugComponent {
  readonly authService = inject(AuthService);
  private readonly debugService = inject(AuthDebugService);
  private readonly api = inject(ApiService);
  
  readonly isProduction = environment.production;
  readonly apiUrl = environment.apiUrl;
  
  readonly diagnosticRunning = signal(false);
  readonly lastTestResult = signal<string>('');
  readonly lastTestError = signal(false);
  
  /**
   * Lance un diagnostic complet
   */
  async runFullDiagnostic(): Promise<void> {
    this.diagnosticRunning.set(true);
    this.lastTestResult.set('');
    
    try {
      console.clear();
      await this.debugService.runDiagnostic();
      this.lastTestResult.set('✅ Diagnostic terminé - Voir la console pour les détails');
      this.lastTestError.set(false);
    } catch (error) {
      this.lastTestResult.set(`❌ Erreur: ${error}`);
      this.lastTestError.set(true);
    } finally {
      this.diagnosticRunning.set(false);
    }
  }
  
  /**
   * Test de récupération du token
   */
  async testGetToken(): Promise<void> {
    try {
      const token = await this.authService.getIdToken();
      if (token) {
        this.lastTestResult.set(`Token récupéré:\n${token.substring(0, 100)}...`);
        this.lastTestError.set(false);
        console.log('Token complet:', token);
      } else {
        this.lastTestResult.set('❌ Aucun token récupéré');
        this.lastTestError.set(true);
      }
    } catch (error) {
      this.lastTestResult.set(`❌ Erreur: ${error}`);
      this.lastTestError.set(true);
    }
  }
  
  /**
   * Test d'appel API
   */
  async testApiCall(): Promise<void> {
    try {
      const response = await this.api.get('users/me').toPromise();
      this.lastTestResult.set(`✅ Réponse API:\n${JSON.stringify(response, null, 2)}`);
      this.lastTestError.set(false);
    } catch (error: any) {
      this.lastTestResult.set(
        `❌ Erreur API:\nStatus: ${error.status}\nMessage: ${error.message}\n` +
        `Error: ${JSON.stringify(error.error, null, 2)}`
      );
      this.lastTestError.set(true);
    }
  }
  
  /**
   * Test de création d'une room
   */
  async testRoomCreation(): Promise<void> {
    try {
      const testRoom = {
        name: `Test Room ${Date.now()}`,
        description: 'Room créée pour test debug',
        display_order: 999
      };
      
      const response = await this.api.post('rooms', testRoom).toPromise();
      this.lastTestResult.set(`✅ Room créée:\n${JSON.stringify(response, null, 2)}`);
      this.lastTestError.set(false);
    } catch (error: any) {
      this.lastTestResult.set(
        `❌ Erreur création room:\nStatus: ${error.status}\nMessage: ${error.message}\n` +
        `Error: ${JSON.stringify(error.error, null, 2)}`
      );
      this.lastTestError.set(true);
    }
  }
  
  /**
   * Force le refresh du token
   */
  async forceTokenRefresh(): Promise<void> {
    try {
      const newToken = await this.authService.refreshToken();
      if (newToken) {
        this.lastTestResult.set(`✅ Token rafraîchi:\n${newToken.substring(0, 100)}...`);
        this.lastTestError.set(false);
      } else {
        this.lastTestResult.set('❌ Échec du refresh');
        this.lastTestError.set(true);
      }
    } catch (error) {
      this.lastTestResult.set(`❌ Erreur: ${error}`);
      this.lastTestError.set(true);
    }
  }
  
  /**
   * Nettoie la console
   */
  clearConsole(): void {
    console.clear();
    console.log('🧹 Console nettoyée');
  }
}