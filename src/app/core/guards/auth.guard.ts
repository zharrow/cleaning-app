// ========================================
// src/app/core/guards/auth.guard.ts
// ========================================
import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes nécessitant une authentification
 * Attend que Firebase ait vérifié l'état avant de rediriger
 */
export const authGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('🛡️ Guard: Vérification pour', state.url);
  
  try {
    // Attendre que Firebase ait vérifié l'état d'authentification
    const isAuthenticated = await authService.waitForAuthCheck();
    
    if (isAuthenticated) {
      console.log('✅ Guard: Accès autorisé');
      return true;
    }
    
    console.log('❌ Guard: Non authentifié, redirection vers login');
    
    // Créer l'URL de redirection avec le returnUrl
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  } catch (error) {
    console.error('❌ Guard: Erreur lors de la vérification', error);
    
    // En cas d'erreur, rediriger vers login par sécurité
    return router.createUrlTree(['/login']);
  }
};