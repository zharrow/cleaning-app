import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Accès non autorisé');
      } else if (error.status === 500) {
        console.error('Erreur serveur');
      }
      
      return throwError(() => error);
    })
  );
};