// ========================================
// src/app/core/interceptors/error.interceptor.ts
// ========================================
import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, timer, switchMap, Observable } from 'rxjs';

/**
 * Intercepteur de gestion des erreurs HTTP
 * Gère intelligemment les erreurs d'authentification et autres erreurs
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🚨 Error Interceptor: Gestion de l\'erreur', {
        url: req.url,
        status: error.status,
        message: error.message,
        currentPath: window.location.pathname
      });
      
      switch (error.status) {
        case 401:
          return handle401Error(error, router, authService);
        
        case 403:
          console.error('🚫 Accès non autorisé:', error.message);
          // Ne pas rediriger pour 403, laisser le composant gérer
          break;
        
        case 404:
          console.warn('🔍 Ressource non trouvée:', req.url);
          break;
        
        case 500:
        case 502:
        case 503:
          console.error('🔧 Erreur serveur:', error.message);
          break;
        
        case 0:
          console.error('🌐 Erreur réseau ou CORS:', error.message);
          break;
        
        default:
          console.error('❓ Erreur inconnue:', error);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Gère intelligemment les erreurs 401
 * Maintenant moins agressif car l'auth interceptor gère déjà le retry
 */
function handle401Error(
  error: HttpErrorResponse, 
  router: Router, 
  authService: AuthService
): Observable<HttpEvent<any>> {
  console.log('🔐 Error Interceptor: Gestion erreur 401');
  
  // Si on est déjà sur la page de login, ne pas rediriger
  if (window.location.pathname === '/login') {
    console.log('⚠️ Error Interceptor: Déjà sur login, pas de redirection');
    return throwError(() => error);
  }
  
  // Vérifier si l'utilisateur est encore authentifié côté Firebase
  if (!authService.isAuthenticated()) {
    console.log('❌ Error Interceptor: Utilisateur non authentifié, redirection vers login');
    
    // Délai pour éviter les redirections immédiates multiples
    return timer(1000).pipe(
      switchMap(() => {
        router.navigate(['/login'], {
          queryParams: { returnUrl: window.location.pathname }
        });
        return throwError(() => error);
      })
    );
  }
  
  // Si l'utilisateur est encore authentifié côté Firebase mais l'API retourne 401,
  // l'auth interceptor a déjà tenté un retry, donc c'est un vrai problème
  console.log('⚠️ Error Interceptor: 401 persistant malgré retry, possiblement un problème serveur');
  
  // Log détaillé pour debug
  console.log('🔍 Error Interceptor: Détails de l\'erreur 401:', {
    url: error.url,
    userAuthenticated: authService.isAuthenticated(),
    currentUser: authService.currentUser()?.email,
    timestamp: new Date().toISOString(),
    note: 'Auth interceptor a déjà tenté un retry'
  });
  
  // Ne pas rediriger automatiquement, laisser le composant gérer
  // Le problème pourrait être temporaire ou lié au serveur
  return throwError(() => error);
}