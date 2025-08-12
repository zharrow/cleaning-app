// ========================================
// src/app/core/guards/public.guard.ts
// ========================================
import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour les pages publiques (login)
 * Redirige vers dashboard si l'utilisateur est déjà connecté
 */
export const publicGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('🔓 Public Guard: Vérification pour', state.url);
  
  try {
    // Attendre que Firebase ait vérifié l'état
    const isAuthenticated = await authService.waitForAuthCheck();
    
    if (isAuthenticated) {
      console.log('➡️ Public Guard: Déjà connecté, redirection vers dashboard');
      
      // Si un returnUrl est présent, l'utiliser
      const returnUrl = route.queryParams['returnUrl'] || '/dashboard';
      return router.createUrlTree([returnUrl]);
    }
    
    console.log('✅ Public Guard: Accès à la page publique autorisé');
    return true;
  } catch (error) {
    console.error('⚠️ Public Guard: Erreur, autorisation de l\'accès', error);
    
    // En cas d'erreur, autoriser l'accès à la page publique
    return true;
  }
};