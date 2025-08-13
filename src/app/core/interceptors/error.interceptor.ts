import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Ne pas rediriger automatiquement vers /login
        // Laisser l'application gérer l'état, surtout en dev sans API
        console.warn('HTTP 401 reçu (non redirigé):', req.url);
      } else if (error.status === 403) {
        console.error('Accès non autorisé');
      } else if (error.status === 500) {
        console.error('Erreur serveur');
      }
      
      return throwError(() => error);
    })
  );
};