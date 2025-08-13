// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { from, switchMap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Intercepteur HTTP pour l'authentification Firebase
 * Gère automatiquement le refresh des tokens expirés
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Liste des endpoints publics qui ne nécessitent pas d'authentification
  const publicEndpoints = ['/auth/login', '/auth/register', '/health'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  // Ne pas ajouter le token pour les endpoints publics
  if (isPublicEndpoint) {
    console.log('🔓 Requête publique:', req.url);
    return next(req);
  }
  
  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    console.warn('⚠️ Utilisateur non authentifié, redirection vers login');
    router.navigate(['/login']);
    return throwError(() => new Error('User not authenticated'));
  }
  
  // Obtenir le token avec force refresh pour éviter les tokens expirés
  return from(authService.getIdToken(true)).pipe(
    switchMap(token => {
      if (!token) {
        console.error('❌ Impossible de récupérer le token');
        router.navigate(['/login']);
        return throwError(() => new Error('No token available'));
      }
      
      // Cloner la requête avec le token
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔑 Token ajouté pour:', req.url);
      
      // Envoyer la requête et gérer les erreurs 401
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.error('🚫 Erreur 401 - Token invalide ou expiré');
            
            // Tenter un refresh forcé du token une fois
            return from(authService.getIdToken(true)).pipe(
              switchMap(newToken => {
                if (!newToken) {
                  console.error('❌ Impossible de rafraîchir le token');
                  router.navigate(['/login']);
                  return throwError(() => error);
                }
                
                console.log('🔄 Token rafraîchi, nouvelle tentative...');
                
                // Réessayer avec le nouveau token
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                return next(retryReq);
              }),
              catchError(retryError => {
                console.error('❌ Échec après refresh du token');
                router.navigate(['/login']);
                return throwError(() => retryError);
              })
            );
          }
          
          // Autres erreurs, les propager
          return throwError(() => error);
        })
      );
    }),
    catchError(error => {
      console.error('❌ Erreur dans l\'intercepteur:', error);
      return throwError(() => error);
    })
  );
};