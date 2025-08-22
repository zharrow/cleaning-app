// ========================================
// src/app/core/guards/public.guard.ts
// ========================================
import { CanActivateFn } from '@angular/router';

/**
 * Guard simplifié: autorise l'accès aux pages publiques pour tout le monde
 */
export const publicGuard: CanActivateFn = () => {
  return true;
};