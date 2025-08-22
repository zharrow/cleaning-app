// src/app/core/services/auth-debug.service.ts
import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Service de debug pour diagnostiquer les problèmes d'authentification
 * À utiliser uniquement en développement
 */
@Injectable({ providedIn: 'root' })
export class AuthDebugService {
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);
  
  /**
   * Effectue un diagnostic complet de l'authentification
   */
  async runDiagnostic(): Promise<void> {
    console.log('🔍 === DIAGNOSTIC D\'AUTHENTIFICATION ===');
    console.log('📅 Date/Heure:', new Date().toISOString());
    console.log('🌍 Environment:', environment.production ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('🔗 API URL:', environment.apiUrl);
    
    // 1. Vérifier l'utilisateur Firebase
    await this.checkFirebaseUser();
    
    // 2. Vérifier le token
    await this.checkToken();
    
    // 3. Tester la connexion à l'API
    await this.testApiConnection();
    
    // 4. Tester l'endpoint protégé
    await this.testProtectedEndpoint();
    
    console.log('🔍 === FIN DU DIAGNOSTIC ===');
  }
  
  /**
   * Vérifie l'état de l'utilisateur Firebase
   */
  private async checkFirebaseUser(): Promise<void> {
    console.log('\n📱 FIREBASE USER:');
    const user = this.auth.currentUser;
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:');
    console.log('  - UID:', user.uid);
    console.log('  - Email:', user.email);
    console.log('  - Email vérifié:', user.emailVerified);
    console.log('  - Créé le:', user.metadata.creationTime);
    console.log('  - Dernière connexion:', user.metadata.lastSignInTime);
  }
  
  /**
   * Vérifie le token JWT
   */
  private async checkToken(): Promise<void> {
    console.log('\n🔑 TOKEN JWT:');
    const user = this.auth.currentUser;
    
    if (!user) {
      console.error('❌ Pas d\'utilisateur pour récupérer le token');
      return;
    }
    
    try {
      // Récupérer le token
      const token = await user.getIdToken();
      console.log('✅ Token récupéré:');
      console.log('  - Longueur:', token.length);
      console.log('  - Début:', token.substring(0, 50) + '...');
      
      // Récupérer les infos du token
      const tokenResult = await user.getIdTokenResult();
      console.log('  - Émis à:', new Date(tokenResult.issuedAtTime).toISOString());
      console.log('  - Expire à:', new Date(tokenResult.expirationTime).toISOString());
      
      const now = new Date();
      const expiration = new Date(tokenResult.expirationTime);
      const timeLeft = expiration.getTime() - now.getTime();
      
      if (timeLeft < 0) {
        console.error('  ⚠️ TOKEN EXPIRÉ depuis', Math.abs(timeLeft / 1000 / 60), 'minutes');
      } else {
        console.log('  - Temps restant:', Math.round(timeLeft / 1000 / 60), 'minutes');
      }
      
      console.log('  - Claims:', tokenResult.claims);
      
      // Tenter de forcer le refresh
      console.log('\n🔄 Test de refresh du token...');
      const newToken = await user.getIdToken(true);
      const newTokenResult = await user.getIdTokenResult();
      console.log('✅ Token rafraîchi:');
      console.log('  - Nouvelle expiration:', new Date(newTokenResult.expirationTime).toISOString());
      
    } catch (error) {
      console.error('❌ Erreur avec le token:', error);
    }
  }
  
  /**
   * Teste la connexion basique à l'API
   */
  private async testApiConnection(): Promise<void> {
    console.log('\n🌐 TEST CONNEXION API:');
    
    try {
      // Test endpoint health (public)
      const healthUrl = `${environment.apiUrl}/health`;
      console.log('  - Test endpoint public:', healthUrl);
      
      const response = await firstValueFrom(
        this.http.get(healthUrl, { observe: 'response' })
      );
      
      console.log('✅ Connexion API réussie:');
      console.log('  - Status:', response.status);
      console.log('  - Headers:', response.headers.keys());
      console.log('  - Body:', response.body);
      
    } catch (error: any) {
      console.error('❌ Erreur connexion API:', error);
      console.error('  - Status:', error.status);
      console.error('  - Message:', error.message);
      console.error('  - URL:', error.url);
    }
  }
  
  /**
   * Teste un endpoint protégé
   */
  private async testProtectedEndpoint(): Promise<void> {
    console.log('\n🔒 TEST ENDPOINT PROTÉGÉ:');
    const user = this.auth.currentUser;
    
    if (!user) {
      console.error('❌ Pas d\'utilisateur pour tester');
      return;
    }
    
    try {
      // Récupérer un token frais
      const token = await user.getIdToken(true);
      console.log('  - Token utilisé (début):', token.substring(0, 50) + '...');
      
      // Test avec le token dans le header
      const meUrl = `${environment.apiUrl}/users/me`;
      console.log('  - Test endpoint:', meUrl);
      
      const response = await firstValueFrom(
        this.http.get(meUrl, { 
          observe: 'response',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      
      console.log('✅ Endpoint protégé accessible:');
      console.log('  - Status:', response.status);
      console.log('  - Body:', response.body);
      
    } catch (error: any) {
      console.error('❌ Erreur endpoint protégé:');
      console.error('  - Status:', error.status);
      console.error('  - Message:', error.message);
      console.error('  - Error:', error.error);
      
      if (error.status === 401) {
        console.error('  ⚠️ PROBLÈME D\'AUTHENTIFICATION DÉTECTÉ');
        console.error('  Vérifiez:');
        console.error('  1. Que Firebase Admin SDK est bien configuré côté backend');
        console.error('  2. Que le certificat Firebase est valide');
        console.error('  3. Que l\'utilisateur existe dans la base de données');
      }
    }
  }
  
  /**
   * Affiche les informations de debug dans la console
   */
  logDebugInfo(): void {
    const user = this.auth.currentUser;
    
    console.group('🔐 Auth Debug Info');
    console.log('User:', user);
    console.log('Environment:', environment);
    console.log('API URL:', environment.apiUrl);
    console.log('Firebase Config:', environment.firebase);
    console.groupEnd();
  }
}