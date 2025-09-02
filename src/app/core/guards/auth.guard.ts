// ========================================
// Guards Angular 19 avec functional guards
// src/app/core/guards/auth.guard.ts
// ========================================
import { inject } from '@angular/core';
import { Router, type CanActivateFn, type CanMatchFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, type AppRole } from '../services/auth.service';
import { EnterpriseService } from '../services/enterprise.service';

/**
 * Guard d'authentification fonctionnel
 * Vérifie si l'utilisateur est connecté
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Si l'auth n'est pas encore initialisée, attendre
  if (!authService.authReady()) {
    return false;
  }
  
  // Si non connecté, rediriger vers login
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  return true;
};

/**
 * Guard pour les pages publiques (login, etc.)
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Si l'auth n'est pas encore initialisée, permettre l'accès
  if (!authService.authReady()) {
    return true;
  }
  
  // Si connecté, rediriger vers dashboard
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  
  return true;
};

/**
 * Factory pour créer des guards basés sur les rôles
 */
export const createRoleGuard = (requiredRole: AppRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Vérifier d'abord l'authentification
    if (!authService.authReady() || !authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    
    // Vérifier les permissions
    if (!authService.hasPermission(requiredRole)) {
      // Rediriger vers dashboard avec un message d'erreur
      return router.createUrlTree(['/dashboard'], {
        queryParams: { error: 'insufficient_permissions' }
      });
    }
    
    return true;
  };
};

/**
 * Guards spécifiques par rôle
 */
export const adminGuard: CanActivateFn = createRoleGuard('admin');
export const managerGuard: CanActivateFn = createRoleGuard('manager');
export const geranteGuard: CanActivateFn = createRoleGuard('gerante');

/**
 * Guard pour les fonctionnalités de gestion
 * Accessible aux admins et managers
 */
export const manageGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.authReady() || !authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  // Vérifier si l'utilisateur est au moins manager
  if (!authService.isManager()) {
    return router.createUrlTree(['/dashboard'], {
      queryParams: { error: 'manage_access_denied' }
    });
  }
  
  return true;
};

/**
 * Guard pour vérifier si l'utilisateur peut modifier des données
 * Empêche les modifications si l'utilisateur n'a que des droits de lecture
 */
export const canModifyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.authReady() || !authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  // Seuls les managers et admins peuvent modifier
  if (!authService.isManager()) {
    return router.createUrlTree(['/dashboard'], {
      queryParams: { error: 'readonly_access' }
    });
  }
  
  return true;
};

/**
 * Guard fonctionnel pour CanMatch (lazy loading)
 * Empêche le chargement du module si pas les bonnes permissions
 */
export const createCanMatchGuard = (requiredRole: AppRole): CanMatchFn => {
  return () => {
    const authService = inject(AuthService);
    
    // Si pas encore initialisé, permettre le chargement
    if (!authService.authReady()) {
      return true;
    }
    
    // Si pas connecté ou pas les bonnes permissions, empêcher le chargement
    return authService.isAuthenticated() && authService.hasPermission(requiredRole);
  };
};

/**
 * CanMatch guards spécifiques
 */
export const canMatchAdmin: CanMatchFn = createCanMatchGuard('admin');
export const canMatchManager: CanMatchFn = createCanMatchGuard('manager');

/**
 * Guard composé pour les pages nécessitant plusieurs conditions
 */
export const authenticatedAndRoleGuard = (requiredRole: AppRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Vérification étape par étape avec messages d'erreur appropriés
    
    if (!authService.authReady()) {
      return false; // Attendre l'initialisation
    }
    
    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    
    if (!authService.hasPermission(requiredRole)) {
      return router.createUrlTree(['/dashboard'], {
        queryParams: { 
          error: 'insufficient_permissions',
          required: requiredRole,
          current: authService.userRole() || 'none'
        }
      });
    }
    
    return true;
  };
};

/**
 * Guard pour les pages qui nécessitent des données utilisateur complètes
 */
export const requireUserDataGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.authReady()) {
    return false;
  }
  
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  // Vérifier que les données utilisateur sont chargées
  // if (!authService.appUser()) {
  //   // Rediriger vers une page de chargement ou dashboard
  //   return router.createUrlTree(['/dashboard'], {
  //     queryParams: { loading: 'user_data' }
  //   });
  // }
  
  return true;
};

/**
 * Guard pour les fonctionnalités en mode développement uniquement
 */
export const devOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // En production, bloquer l'accès
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return router.createUrlTree(['/dashboard']);
  }
  
  // En développement, vérifier l'auth normale
  return authService.authReady() && authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};

/**
 * Guard pour vérifier qu'une entreprise existe et est configurée
 * Redirige vers /setup-enterprise si pas d'entreprise
 */
export const enterpriseRequiredGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const enterpriseService = inject(EnterpriseService);
  
  // Vérifier d'abord l'authentification
  if (!authService.authReady() || !authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  try {
    const existsResponse = await enterpriseService.checkEnterpriseExists();
    
    // Si pas d'entreprise, rediriger vers setup
    if (!existsResponse.exists) {
      return router.createUrlTree(['/setup-enterprise']);
    }
    
    return true;
    
  } catch (error) {
    console.warn('Erreur lors de la vérification de l\'entreprise:', error);
    // En cas d'erreur, autoriser l'accès (fallback)
    return true;
  }
};