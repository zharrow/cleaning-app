import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface EnterpriseStats {
  id: string;
  name: string;
  admin_name: string;
  admin_email: string;
  employee_count: number;
  sessions_this_month: number;
  last_admin_login: string;
}

@Component({
  selector: 'app-developer-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-page p-6">
      <h1 class="text-4xl font-bold mb-8">Tableau de bord Développeur</h1>

      <!-- KPIs globaux -->
      <div class="kpis grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="kpi-card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div class="text-sm opacity-90 mb-1">Crèches totales</div>
          <div class="text-4xl font-bold">{{ globalStats().total_enterprises }}</div>
        </div>
        <div class="kpi-card bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div class="text-sm opacity-90 mb-1">Admins actifs</div>
          <div class="text-4xl font-bold">{{ globalStats().active_admins }}</div>
        </div>
        <div class="kpi-card bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div class="text-sm opacity-90 mb-1">Employés totaux</div>
          <div class="text-4xl font-bold">{{ globalStats().total_employees }}</div>
        </div>
        <div class="kpi-card bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div class="text-sm opacity-90 mb-1">Sessions ce mois</div>
          <div class="text-4xl font-bold">{{ globalStats().sessions_this_month }}</div>
        </div>
      </div>

      <!-- Graphiques placeholder -->
      <div class="charts grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="chart-card bg-white p-6 rounded-lg shadow">
          <h3 class="text-xl font-semibold mb-4">Activité par crèche</h3>
          <div class="h-64 flex items-center justify-center text-gray-400">
            <div>📊 Graphique à implémenter (Chart.js ou ApexCharts)</div>
          </div>
        </div>
        <div class="chart-card bg-white p-6 rounded-lg shadow">
          <h3 class="text-xl font-semibold mb-4">Évolution utilisateurs</h3>
          <div class="h-64 flex items-center justify-center text-gray-400">
            <div>📈 Graphique à implémenter (Chart.js ou ApexCharts)</div>
          </div>
        </div>
      </div>

      <!-- Liste des crèches -->
      <div class="enterprises-section">
        <h2 class="text-2xl font-bold mb-4">Crèches enregistrées</h2>
        <div class="enterprises-table bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold">Crèche</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Admin</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Employés</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Sessions (mois)</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Dernier login</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (enterprise of enterprises(); track enterprise.id) {
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 font-semibold">{{ enterprise.name }}</td>
                  <td class="px-4 py-3">{{ enterprise.admin_name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ enterprise.admin_email }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded">
                      {{ enterprise.employee_count }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                      {{ enterprise.sessions_this_month }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ enterprise.last_admin_login | date:'short' }}
                  </td>
                  <td class="px-4 py-3">
                    <button class="text-sm text-blue-600 hover:underline">Voir détails</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                    Aucune crèche enregistrée
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Note sécurité -->
      <div class="security-note mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
        <div class="flex items-start gap-2">
          <span class="text-2xl">🔒</span>
          <div>
            <h3 class="font-bold text-yellow-700">Accès limité aux métadonnées</h3>
            <p class="text-yellow-600 text-sm">
              En tant que développeur, vous avez accès uniquement aux statistiques d'utilisation globales.
              Aucune donnée métier (enfants, repas, tâches) n'est accessible pour respecter la confidentialité.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeveloperAnalyticsComponent implements OnInit {
  private api = inject(ApiService);

  globalStats = signal({
    total_enterprises: 0,
    active_admins: 0,
    total_employees: 0,
    sessions_this_month: 0
  });

  enterprises = signal<EnterpriseStats[]>([]);

  ngOnInit() {
    this.loadGlobalStats();
    this.loadEnterprises();
  }

  loadGlobalStats() {
    // TODO: Create /api/analytics/global endpoint
    this.api.get<any>('/analytics/global').subscribe({
      next: (stats) => this.globalStats.set(stats),
      error: () => {
        // Mock data for demo
        this.globalStats.set({
          total_enterprises: 5,
          active_admins: 5,
          total_employees: 23,
          sessions_this_month: 142
        });
      }
    });
  }

  loadEnterprises() {
    // TODO: Create /api/analytics/enterprises endpoint
    this.api.get<EnterpriseStats[]>('/analytics/enterprises').subscribe({
      next: (data) => this.enterprises.set(data),
      error: () => {
        // Mock data for demo
        this.enterprises.set([
          {
            id: '1',
            name: 'Les Petits Lutins',
            admin_name: 'Marie Dupont',
            admin_email: 'marie@petits-lutins.fr',
            employee_count: 5,
            sessions_this_month: 30,
            last_admin_login: new Date().toISOString()
          },
          {
            id: '2',
            name: 'La Maison des Bambins',
            admin_name: 'Pierre Martin',
            admin_email: 'pierre@bambins.fr',
            employee_count: 8,
            sessions_this_month: 56,
            last_admin_login: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }
    });
  }
}
