// ========================================
// src/app/core/guards/auth.guard.ts
// ========================================
import { CanActivateFn } from '@angular/router';

/**
 * Guard simplifié: autorise tout le monde à accéder à toutes les routes
 */
export const authGuard: CanActivateFn = () => {
  return true;
};