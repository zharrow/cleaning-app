// // ========================================
// // Intercepteurs HTTP Angular 19
// // src/app/core/interceptors/auth.interceptor.ts
// // ========================================
// import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { AuthService } from '../services/auth.service';
// import { environment } from '../../../environments/environment';
// import { switchMap, from, catchError, throwError } from 'rxjs';

// /**
//  * Intercepteur d'authentification fonctionnel
//  * Ajoute automatiquement le token Firebase aux requêtes vers l'API
//  */
// export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
//   const authService = inject(AuthService);
  
//   // Vérifier si la requête nécessite une authentification
//   if (!requiresAuth(req.url)) {
//     return next(req);
//   }

//   // Si l'utilisateur n'est pas connecté, passer la requête sans modification
//   if (!authService.isAuthenticated()) {
//     return next(req);
//   }

//   // Obtenir le token et l'ajouter à la requête
//   return from(authService.getToken()).pipe(
//     switchMap(token => {
//       if (token) {
//         const authReq = req.clone({
//           setHeaders: {
//             Authorization: `Bearer ${token}`
//           }
//         });
//         return next(authReq);
//       }
//       return next(req);
//     }),
//     catchError(error => {
//       console.error('Erreur lors de l\'ajout du token d\'authentification:', error);
//       return next(req); // Continuer sans token en cas d'erreur
//     })
//   );
// };

// /**
//  * Vérifie si une URL nécessite une authentification
//  */
// function requiresAuth(url: string): boolean {
//   // URLs qui nécessitent une authentification
//   const protectedUrls = [
//     environment.apiUrl,
//     '/api/'
//   ];
  
//   // URLs qui ne nécessitent pas d'authentification
//   const publicUrls = [
//     '/auth/login',
//     '/auth/register',
//     '/auth/forgot-password'
//   ];
  
//   // Vérifier si l'URL est publique
//   if (publicUrls.some(publicUrl => url.includes(publicUrl))) {
//     return false;
//   }
  
//   // Vérifier si l'URL est protégée
//   return protectedUrls.some(protectedUrl => url.includes(protectedUrl));
// }

// // ========================================
// // src/app/core/interceptors/error.interceptor.ts
// // ========================================
// import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { catchError, throwError } from 'rxjs';

// /**
//  * Service de notification (à créer si nécessaire)
//  */
// interface NotificationService {
//   showError(message: string): void;
//   showWarning(message: string): void;
// }

// /**
//  * Intercepteur de gestion d'erreurs fonctionnel
//  * Gère les erreurs HTTP de manière centralisée
//  */
// export const errorInterceptor: HttpInterceptorFn = (req, next) => {
//   const router = inject(Router);
//   // const notificationService = inject(NotificationService); // Si disponible
  
//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {
//       let errorMessage = 'Une erreur est survenue';
      
//       // Gestion spécifique selon le code d'erreur
//       switch (error.status) {
//         case 0:
//           // Erreur de réseau
//           errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
//           break;
          
//         case 400:
//           // Requête incorrecte
//           errorMessage = error.error?.message || 'Données de requête invalides';
//           break;
          
//         case 401:
//           // Non autorisé
//           errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
//           // Rediriger vers la page de connexion
//           router.navigate(['/login'], { 
//             queryParams: { error: 'session_expired' } 
//           });
//           break;
          
//         case 403:
//           // Accès interdit
//           errorMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.';
//           break;
          
//         case 404:
//           // Ressource non trouvée
//           errorMessage = 'Ressource non trouvée';
//           break;
          
//         case 422:
//           // Erreur de validation
//           errorMessage = error.error?.message || 'Données invalides';
//           if (error.error?.errors) {
//             // Combiner les erreurs de validation
//             const validationErrors = Object.values(error.error.errors).flat();
//             errorMessage = validationErrors.join(', ');
//           }
//           break;
          
//         case 429:
//           // Trop de requêtes
//           errorMessage = 'Trop de requêtes. Veuillez patienter avant de réessayer.';
//           break;
          
//         case 500:
//         case 502:
//         case 503:
//         case 504:
//           // Erreurs serveur
//           errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
//           break;
          
//         default:
//           // Autres erreurs
//           errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
//       }

//       // Logger l'erreur en développement
//       if (!environment.production) {
//         console.group('🚨 Erreur HTTP Interceptée');
//         console.error('Status:', error.status);
//         console.error('URL:', req.url);
//         console.error('Method:', req.method);
//         console.error('Error:', error);
//         console.groupEnd();
//       }

//       // Afficher la notification à l'utilisateur
//       // notificationService?.showError(errorMessage);

//       // Retourner l'erreur avec le message formaté
//       const formattedError = new HttpErrorResponse({
//         ...error,
//         error: {
//           ...error.error,
//           message: errorMessage,
//           originalError: error.error
//         }
//       });

//       return throwError(() => formattedError);
//     })
//   );
// };

// // ========================================
// // src/app/core/interceptors/loading.interceptor.ts
// // ========================================
// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { finalize } from 'rxjs';
// import { LoadingService } from '../services/loading.service';

// /**
//  * Intercepteur de gestion du loading fonctionnel
//  * Affiche automatiquement un indicateur de chargement pour les requêtes HTTP
//  */
// export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
//   const loadingService = inject(LoadingService);
  
//   // URLs à exclure du loading automatique
//   const excludedUrls = [
//     '/auth/refresh-token',
//     '/api/health',
//     '/api/ping'
//   ];
  
//   // Vérifier si cette requête doit déclencher le loading
//   const shouldShowLoading = !excludedUrls.some(url => req.url.includes(url));
  
//   if (shouldShowLoading) {
//     loadingService.startLoading(req.url);
//   }
  
//   return next(req).pipe(
//     finalize(() => {
//       if (shouldShowLoading) {
//         loadingService.stopLoading(req.url);
//       }
//     })
//   );
// };

// // ========================================
// // src/app/core/services/loading.service.ts
// // ========================================
// import { Injectable, signal, computed } from '@angular/core';

// /**
//  * Service de gestion du loading global
//  * Utilise les signals Angular 19 pour un état réactif
//  */
// @Injectable({ providedIn: 'root' })
// export class LoadingService {
//   // Map des requêtes en cours avec leur URL comme clé
//   private readonly activeRequests = signal(new Map<string, number>());
  
//   // Signal computed pour savoir si au moins une requête est en cours
//   readonly isLoading = computed(() => {
//     const requests = this.activeRequests();
//     return Array.from(requests.values()).some(count => count > 0);
//   });
  
//   // Signal computed pour le nombre total de requêtes
//   readonly totalRequests = computed(() => {
//     const requests = this.activeRequests();
//     return Array.from(requests.values()).reduce((total, count) => total + count, 0);
//   });

//   /**
//    * Démarre le loading pour une URL spécifique
//    */
//   startLoading(url: string): void {
//     this.activeRequests.update(requests => {
//       const newRequests = new Map(requests);
//       const currentCount = newRequests.get(url) || 0;
//       newRequests.set(url, currentCount + 1);
//       return newRequests;
//     });
//   }

//   /**
//    * Arrête le loading pour une URL spécifique
//    */
//   stopLoading(url: string): void {
//     this.activeRequests.update(requests => {
//       const newRequests = new Map(requests);
//       const currentCount = newRequests.get(url) || 0;
      
//       if (currentCount <= 1) {
//         newRequests.delete(url);
//       } else {
//         newRequests.set(url, currentCount - 1);
//       }
      
//       return newRequests;
//     });
//   }

//   /**
//    * Force l'arrêt de toutes les requêtes en cours
//    */
//   clearAll(): void {
//     this.activeRequests.set(new Map());
//   }

//   /**
//    * Vérifie si une URL spécifique est en cours de chargement
//    */
//   isUrlLoading(url: string): boolean {
//     const requests = this.activeRequests();
//     return (requests.get(url) || 0) > 0;
//   }

//   /**
//    * Obtient la liste des URLs en cours de chargement
//    */
//   getLoadingUrls(): string[] {
//     const requests = this.activeRequests();
//     return Array.from(requests.keys()).filter(url => requests.get(url)! > 0);
//   }
// }

// // ========================================
// // src/app/core/interceptors/cache.interceptor.ts
// // ========================================
// import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { of, tap } from 'rxjs';

// /**
//  * Service de cache HTTP simple
//  */
// @Injectable({ providedIn: 'root' })
// export class HttpCacheService {
//   private cache = new Map<string, { response: HttpResponse<any>, timestamp: number }>();
//   private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

//   get(url: string): HttpResponse<any> | null {
//     const cached = this.cache.get(url);
//     if (!cached) return null;

//     // Vérifier si le cache est encore valide
//     if (Date.now() - cached.timestamp > this.defaultTtl) {
//       this.cache.delete(url);
//       return null;
//     }

//     return cached.response;
//   }

//   set(url: string, response: HttpResponse<any>): void {
//     this.cache.set(url, {
//       response: response.clone(),
//       timestamp: Date.now()
//     });
//   }

//   clear(): void {
//     this.cache.clear();
//   }

//   clearUrl(url: string): void {
//     this.cache.delete(url);
//   }
// }

// /**
//  * Intercepteur de cache fonctionnel
//  * Met en cache les réponses GET pour améliorer les performances
//  */
// export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
//   const cacheService = inject(HttpCacheService);
  
//   // Seules les requêtes GET sont mises en cache
//   if (req.method !== 'GET') {
//     return next(req);
//   }
  
//   // URLs à ne pas mettre en cache
//   const noCacheUrls = [
//     '/auth/',
//     '/api/logs',
//     '/api/sessions/today'
//   ];
  
//   if (noCacheUrls.some(url => req.url.includes(url))) {
//     return next(req);
//   }
  
//   // Vérifier si la réponse est en cache
//   const cachedResponse = cacheService.get(req.url);
//   if (cachedResponse) {
//     console.log('🎯 Cache hit:', req.url);
//     return of(cachedResponse);
//   }
  
//   // Exécuter la requête et mettre en cache
//   return next(req).pipe(
//     tap(event => {
//       if (event instanceof HttpResponse) {
//         cacheService.set(req.url, event);
//         console.log('💾 Cached response:', req.url);
//       }
//     })
//   );
// };