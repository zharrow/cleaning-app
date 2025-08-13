// ========================================
// src/app/app.routes.ts
// ========================================
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { manageGuard } from './core/guards/role.guard';

/**
 * Configuration des routes de l'application
 * - Routes publiques : protégées par publicGuard (redirige si déjà connecté)
 * - Routes privées : protégées par authGuard (nécessite authentification)
 */
export const routes: Routes = [
  // Route publique - Login
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard] // Empêche l'accès si déjà connecté
  },
  
  // Routes protégées
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'session',
    loadComponent: () => import('./features/session/session-today/session-today.component').then(m => m.SessionTodayComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
    canActivate: [authGuard]
  },
  // Management routes (admin/manager)
  {
  path: 'manage/tasks',
  loadComponent: () => import('./features/manage/manage-tasks/manage-tasks.component').then(m => m.ManageTasksComponent),
  canActivate: [manageGuard]
  },
  {
    path: 'manage/rooms',
    loadComponent: () => import('./features/manage/manage-rooms/manage-rooms.component').then(m => m.ManageRoomsComponent),
    canActivate: [manageGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth-diagnostic',
    loadComponent: () => import('./features/auth/auth-diagnostic/auth-diagnostic.component').then(m => m.AuthDiagnosticComponent),
    canActivate: [authGuard] // Nécessite juste d'être connecté
  },
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/auth-debug.component').then(m => m.AuthDebugComponent)
  },
  
  // Routes de redirection
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];