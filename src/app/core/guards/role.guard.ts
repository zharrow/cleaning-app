import { CanActivateFn } from '@angular/router';
import { AppRole } from '../services/auth.service';

/**
 * Guards simplifiés: tout le monde a accès à tout
 */
export function roleGuard(_allowedRoles: Array<AppRole | 'admin' | 'manager'>): CanActivateFn {
  return () => true;
}

export const manageGuard: CanActivateFn = () => true;

export const adminGuard: CanActivateFn = () => true;

export const managerGuard: CanActivateFn = () => true;