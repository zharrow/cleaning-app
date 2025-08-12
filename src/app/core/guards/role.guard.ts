// ========================================
// src/app/core/guards/role.guard.ts
// ========================================
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, AppRole } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Role-based guard avec support complet des rôles
 * Usage: canActivate: [roleGuard(['admin','manager','gerante'])]
 */
export function roleGuard(allowedRoles: Array<AppRole | 'admin' | 'manager'>): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    console.log('🛡️ Role Guard: Checking access for roles:', allowedRoles);
    
    // Attendre que l'auth soit prête
    await auth.waitForAuthCheck();
    
    // Vérifier l'authentification
    if (!auth.isAuthenticated()) {
      console.log('❌ Role Guard: User not authenticated');
      await router.navigate(['/login']);
      return false;
    }

    const currentRole = auth.userRole();
    const normalizedRole = auth.normalizedRole();
    
    // Debug info en dev
    if (!environment.production) {
      console.log('🎭 Role Guard Debug:', {
        currentRole,
        normalizedRole,
        canManage: auth.canManage(),
        allowedRoles,
        checkResults: allowedRoles.map(r => ({ 
          role: r, 
          hasRole: auth.hasRole(r),
          directMatch: currentRole === r,
          normalizedMatch: (r === 'manager' && normalizedRole === 'manager') || 
                          (r === 'admin' && normalizedRole === 'admin')
        }))
      });
    }
    
    // Vérification explicite pour chaque rôle autorisé
    for (const role of allowedRoles) {
      // Vérification directe
      if (currentRole === role) {
        console.log('✅ Role Guard: Direct match for role:', role);
        return true;
      }
      
      // Vérification avec normalisation
      // Si on demande 'manager' et que l'utilisateur est 'gerante' (normalisé en 'manager')
      if (role === 'manager' && (currentRole === 'gerante' || normalizedRole === 'manager')) {
        console.log('✅ Role Guard: Normalized match for manager role');
        return true;
      }
      
      // Si on demande 'admin' et que l'utilisateur est admin
      if (role === 'admin' && normalizedRole === 'admin') {
        console.log('✅ Role Guard: Admin access granted');
        return true;
      }
    }

    // Pas de permission - rediriger vers dashboard
    console.log('❌ Role Guard: Access denied for role:', currentRole);
    console.log('❌ Allowed roles were:', allowedRoles);
    await router.navigate(['/dashboard']);
    return false;
  };
}

/**
 * Guard pré-configuré pour la gestion
 * Accepte admin, manager ET gerante
 */
export const manageGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  console.log('🛡️ Manage Guard: Checking management access');
  
  // Attendre que l'auth soit prête
  await auth.waitForAuthCheck();
  
  // Vérifier l'authentification
  if (!auth.isAuthenticated()) {
    console.log('❌ Manage Guard: User not authenticated');
    await router.navigate(['/login']);
    return false;
  }
  
  // Utiliser canManage() qui gère déjà la logique gerante -> manager
  const canManage = auth.canManage();
  const currentRole = auth.userRole();
  
  console.log('🎭 Manage Guard:', {
    currentRole,
    canManage,
    normalizedRole: auth.normalizedRole()
  });
  
  if (canManage) {
    console.log('✅ Manage Guard: Access granted');
    return true;
  }
  
  console.log('❌ Manage Guard: Access denied');
  await router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard pour admin uniquement
 */
export const adminGuard: CanActivateFn = roleGuard(['admin']);

/**
 * Guard pour manager et gerante
 */
export const managerGuard: CanActivateFn = roleGuard(['manager', 'gerante']);