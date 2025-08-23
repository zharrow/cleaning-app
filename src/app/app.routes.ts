// ========================================
// Configuration des routes Angular 19
// src/app/app.routes.ts
// ========================================
import { Routes } from '@angular/router';
import { authGuard, publicGuard, manageGuard, requireUserDataGuard } from './core/guards/auth.guard';

/**
 * Configuration des routes de l'application
 * Utilise les nouveaux functional guards d'Angular 19
 */
export const routes: Routes = [
  // ===================
  // Routes publiques
  // ===================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [publicGuard],
    title: 'Connexion - Micro-Crèche'
  },

  // ===================
  // Routes protégées
  // ===================
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Redirection par défaut
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },

      // Dashboard principal
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [requireUserDataGuard],
        title: 'Tableau de bord - Micro-Crèche'
      },

      // Session du jour
      {
        path: 'session',
        loadComponent: () => import('./features/session/session-today/session-today.component')
          .then(m => m.SessionTodayComponent),
        canActivate: [requireUserDataGuard],
        title: 'Session du jour - Micro-Crèche'
      },

      // Gestion des tâches (utilisateurs normaux)
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list/task-list.component')
          .then(m => m.TaskListComponent),
        canActivate: [requireUserDataGuard],
        title: 'Mes tâches - Micro-Crèche'
      },

      // Historique des sessions
      {
        path: 'history',
        loadComponent: () => import('./features/history/session-history/session-history.component')
          .then(m => m.SessionHistoryComponent),
        canActivate: [requireUserDataGuard],
        title: 'Historique - Micro-Crèche'
      },

      // Détail d'une session
      {
        path: 'history/:sessionId',
        loadComponent: () => import('./features/history/session-detail/session-detail.component')
          .then(m => m.SessionDetailComponent),
        canActivate: [requireUserDataGuard],
        title: 'Détail session - Micro-Crèche'
      },

      // Profil utilisateur
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component')
          .then(m => m.ProfileComponent),
        canActivate: [requireUserDataGuard],
        title: 'Mon profil - Micro-Crèche'
      },

      // ===================
      // Routes de gestion (Admin/Manager uniquement)
      // ===================
      {
        path: 'manage',
        canActivate: [manageGuard],
        children: [
          // Redirection par défaut vers les tâches
          {
            path: '',
            redirectTo: 'tasks',
            pathMatch: 'full'
          },

          // Gestion des tâches (admin)
          {
            path: 'tasks',
            loadComponent: () => import('./features/manage/manage-tasks/manage-tasks.component')
              .then(m => m.ManageTasksComponent),
            title: 'Gestion des tâches - Micro-Crèche'
          },

          // Gestion des pièces
          {
            path: 'rooms',
            loadComponent: () => import('./features/manage/manage-rooms/manage-rooms.component')
              .then(m => m.ManageRoomsComponent),
            title: 'Gestion des pièces - Micro-Crèche'
          },

          // Gestion des utilisateurs (admin seulement)
          // {
          //   path: 'users',
          //   loadComponent: () => import('./features/manage/manage-users/manage-users.component')
          //     .then(m => m.ManageUsersComponent),
          //   canActivate: [() => {
          //     // Guard inline pour admin seulement
          //     const authService = inject(AuthService);
          //     return authService.isAdmin();
          //   }],
          //   title: 'Gestion des utilisateurs - Micro-Crèche'
          // },

          // Paramètres généraux
          // {
          //   path: 'settings',
          //   loadComponent: () => import('./features/manage/settings/settings.component')
          //     .then(m => m.SettingsComponent),
          //   title: 'Paramètres - Micro-Crèche'
          // },

          // Rapports et exports
          // {
          //   path: 'reports',
          //   loadComponent: () => import('./features/manage/reports/reports.component')
          //     .then(m => m.ReportsComponent),
          //   title: 'Rapports - Micro-Crèche'
          // }
        ]
      },

      // ===================
      // Routes utilitaires
      // ===================
      
      // Mode hors ligne
      {
        path: 'offline',
        loadComponent: () => import('./features/offline/offline.component')
          .then(m => m.OfflineComponent),
        title: 'Mode hors ligne - Micro-Crèche'
      },

      // Aide et documentation
      // {
      //   path: 'help',
      //   loadComponent: () => import('./features/help/help.component')
      //     .then(m => m.HelpComponent),
      //   title: 'Aide - Micro-Crèche'
      // },

      // ===================
      // Routes de développement (uniquement en dev)
      // ===================
      ...(typeof window !== 'undefined' && window.location.hostname === 'localhost' ? [
        {
          path: 'dev',
          children: [
            // {
            //   path: 'components',
            //   loadComponent: () => import('./dev/component-showcase/component-showcase.component')
            //     .then(m => m.ComponentShowcaseComponent),
            //   title: 'Showcase Components - Dev'
            // },
            // {
            //   path: 'test-data',
            //   loadComponent: () => import('./dev/test-data/test-data.component')
            //     .then(m => m.TestDataComponent),
            //   title: 'Test Data - Dev'
            // }
          ]
        }
      ] : [])
    ]
  },

  // ===================
  // Routes d'erreur
  // ===================
  {
    path: 'error',
    loadComponent: () => import('./features/error/error.component')
      .then(m => m.ErrorComponent),
    title: 'Erreur - Micro-Crèche'
  },

  // Page non trouvée - doit être en dernier
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component')
      .then(m => m.NotFoundComponent),
    title: 'Page non trouvée - Micro-Crèche'
  }
];

// Import nécessaire pour le guard inline
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';