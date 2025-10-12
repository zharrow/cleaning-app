/**
 * Guards for protecting routes by user type
 * Developer, Admin, Employee
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthMultiTierService, UserType } from '../services/auth-multi-tier.service';

/**
 * Guard for Developer-only routes
 */
export const developerGuard: CanActivateFn = () => {
  const authService = inject(AuthMultiTierService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isDeveloper()) {
    return true;
  }

  console.warn('Access denied: Developer role required');
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard for Admin-only routes (includes developer)
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthMultiTierService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAdmin() || authService.isDeveloper()) {
    return true;
  }

  console.warn('Access denied: Admin role required');
  router.navigate(['/tablet']);
  return false;
};

/**
 * Guard for Employee-only routes (tablet interface)
 */
export const employeeGuard: CanActivateFn = () => {
  const authService = inject(AuthMultiTierService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login/pin']);
    return false;
  }

  if (authService.isEmployee()) {
    return true;
  }

  console.warn('Access denied: Employee role required');
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard for Admin/Manager routes (management interface)
 * Allows Developer and Admin, but not Employee
 */
export const manageGuardMultiTier: CanActivateFn = () => {
  const authService = inject(AuthMultiTierService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Allow Developer and Admin
  if (authService.isDeveloper() || authService.isAdmin()) {
    return true;
  }

  // Deny Employee access to management routes
  console.warn('Access denied: Management access required');
  router.navigate(['/tablet']);
  return false;
};

/**
 * Redirect based on user type
 */
export const redirectByUserType = (): boolean => {
  const authService = inject(AuthMultiTierService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userType = authService.userType();

  switch (userType) {
    case 'developer':
      router.navigate(['/dashboard']); // Or /analytics if exists
      break;
    case 'admin':
      router.navigate(['/dashboard']);
      break;
    case 'employee':
      router.navigate(['/tablet']);
      break;
    default:
      router.navigate(['/login']);
      return false;
  }

  return true;
};
