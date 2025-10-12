// ========================================
// Configuration des routes Angular 19
// src/app/app.routes.ts
// ========================================
import { Routes } from '@angular/router';
import { authGuard, publicGuard, manageGuard, requireUserDataGuard, enterpriseRequiredGuard } from './core/guards/auth.guard';

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
  {
    path: 'login/pin',
    loadComponent: () => import('./features/auth/pin-login/pin-login.component')
      .then(m => m.PinLoginComponent),
    canActivate: [publicGuard],
    title: 'Connexion PIN - Employé'
  },
  {
    path: 'auth-diagnostic',
    loadComponent: () => import('./features/auth/auth-diagnostic/auth-diagnostic.component')
      .then(m => m.AuthDiagnosticComponent),
    title: 'Diagnostic Auth'
  },

  // ===================
  // Route de configuration entreprise
  // ===================
  {
    path: 'setup-enterprise',
    loadComponent: () => import('./features/setup-enterprise/setup-enterprise.component')
      .then(m => m.SetupEnterpriseComponent),
    canActivate: [authGuard],
    title: 'Configuration entreprise - Micro-Crèche'
  },

  // ===================
  // Routes Tablet (Employés uniquement)
  // ===================
  {
    path: 'tablet',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tablet/tablet-home/tablet-home.component')
          .then(m => m.TabletHomeComponent),
        title: 'Accueil Tablet - Micro-Crèche'
      },
      {
        path: 'room/:roomId',
        loadComponent: () => import('./features/tablet/tablet-room/tablet-room.component')
          .then(m => m.TabletRoomComponent),
        title: 'Salle - Micro-Crèche'
      },
      {
        path: 'haccp',
        loadComponent: () => import('./features/tablet/tablet-haccp/tablet-haccp.component')
          .then(m => m.TabletHaccpComponent),
        title: 'HACCP - Tablet'
      }
    ]
  },

  // ===================
  // Routes protégées avec entreprise requise
  // ===================
  {
    path: '',
    canActivate: [authGuard, enterpriseRequiredGuard],
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
      // Routes Analytics (Developer uniquement)
      // ===================
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/developer-analytics.component')
          .then(m => m.DeveloperAnalyticsComponent),
        title: 'Analytics - Developer'
      },

      // ===================
      // Routes HACCP (Admin uniquement)
      // ===================
      {
        path: 'haccp',
        canActivate: [manageGuard],
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/haccp/haccp-dashboard.component')
              .then(m => m.HaccpDashboardComponent),
            title: 'Dashboard HACCP - Micro-Crèche'
          },
          {
            path: 'children',
            loadComponent: () => import('./features/haccp/children.component')
              .then(m => m.ChildrenComponent),
            title: 'Enfants - HACCP'
          },
          {
            path: 'meals',
            loadComponent: () => import('./features/haccp/meals.component')
              .then(m => m.MealsComponent),
            title: 'Repas - HACCP'
          },
          {
            path: 'products',
            loadComponent: () => import('./features/haccp/products.component')
              .then(m => m.ProductsComponent),
            title: 'Produits - HACCP'
          },
          {
            path: 'suppliers',
            loadComponent: () => import('./features/haccp/suppliers.component')
              .then(m => m.SuppliersComponent),
            title: 'Fournisseurs - HACCP'
          },
          {
            path: 'equipment',
            loadComponent: () => import('./features/haccp/equipment.component')
              .then(m => m.EquipmentComponent),
            title: 'Équipements - HACCP'
          },
          {
            path: 'non-compliances',
            loadComponent: () => import('./features/haccp/non-compliances.component')
              .then(m => m.NonCompliancesComponent),
            title: 'Non-conformités - HACCP'
          },
          {
            path: 'documents',
            loadComponent: () => import('./features/haccp/documents.component')
              .then(m => m.DocumentsComponent),
            title: 'Documents - HACCP'
          }
        ]
      },

      // ===================
      // Routes Communication (Admin uniquement)
      // ===================
      {
        path: 'communication',
        canActivate: [manageGuard],
        children: [
          {
            path: '',
            redirectTo: 'messages',
            pathMatch: 'full'
          },
          {
            path: 'messages',
            loadComponent: () => import('./features/communication/messages.component')
              .then(m => m.MessagesComponent),
            title: 'Messages - Micro-Crèche'
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/communication/notifications.component')
              .then(m => m.NotificationsComponent),
            title: 'Notifications - Micro-Crèche'
          }
        ]
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

          // Gestion des modèles de tâches (admin)
          {
            path: 'tasks',
            loadComponent: () => import('./features/manage/manage-tasks/manage-tasks.component')
              .then(m => m.ManageTasksComponent),
            title: 'Tâches - Micro-Crèche'
          },

          // Assignation des tâches (admin)
          {
            path: 'assign-tasks',
            loadComponent: () => import('./features/manage/task-assignment/task-assignment.component')
              .then(m => m.TaskAssignmentComponent),
            title: 'Assignation des tâches - Micro-Crèche'
          },

          // Gestion des pièces
          {
            path: 'rooms',
            loadComponent: () => import('./features/manage/manage-rooms/manage-rooms.component')
              .then(m => m.ManageRoomsComponent),
            title: 'Pièces - Micro-Crèche'
          },

          // Gestion des employés (remplace performers)
          {
            path: 'employees',
            loadComponent: () => import('./features/manage/manage-employees/manage-employees.component')
              .then(m => m.ManageEmployeesComponent),
            title: 'Employés - Micro-Crèche'
          },

          // Legacy route (redirect to employees)
          {
            path: 'performers',
            redirectTo: 'employees',
            pathMatch: 'full'
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