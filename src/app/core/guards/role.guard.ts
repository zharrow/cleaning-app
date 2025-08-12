import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based guard. Usage:
 *  canActivate: [roleGuard(['admin','manager'])]
 */
export function roleGuard(allowed: Array<'admin' | 'manager'>): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Ensure auth check finished
    await auth.waitForAuthCheck();
    if (!auth.isAuthenticated()) {
      await router.navigate(['/login']);
      return false;
    }

    // Check role
  // Debug (dev only): log normalized role
  try { console.debug('[roleGuard] normalizedRole=', auth['normalizedRole']?.()); } catch {}
    if (auth.hasAnyRole(allowed)) {
      return true;
    }

    // Fallback: redirect to dashboard
    await router.navigate(['/dashboard']);
    return false;
  };
}

// Pre-configured guard for management (admin or manager)
export const manageGuard: CanActivateFn = roleGuard(['admin', 'manager']);
