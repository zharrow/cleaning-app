import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HaccpService } from '../../core/services/haccp.service';
import { CommunicationService } from '../../core/services/communication.service';

@Component({
  selector: 'app-haccp-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="haccp-dashboard">
      <h1 class="text-3xl font-bold mb-6">Dashboard HACCP</h1>

      <!-- Alertes critiques -->
      @if (criticalAlerts().length > 0) {
        <div class="alerts-section mb-6">
          @for (alert of criticalAlerts(); track alert.id) {
            <div class="alert alert-critical mb-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div class="flex items-center gap-2">
                <span class="text-2xl">⚠️</span>
                <div>
                  <h3 class="font-bold text-red-700">{{ alert.title }}</h3>
                  <p class="text-red-600">{{ alert.message }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- KPIs HACCP -->
      <div class="kpis grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="kpi-card bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500 mb-1">Repas du jour</div>
          <div class="text-3xl font-bold text-blue-600">{{ stats().mealsToday }}</div>
        </div>
        <div class="kpi-card bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500 mb-1">Contrôles température</div>
          <div class="text-3xl font-bold" [class.text-green-600]="stats().tempCompliant" [class.text-red-600]="!stats().tempCompliant">
            {{ stats().tempChecks }}
          </div>
        </div>
        <div class="kpi-card bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500 mb-1">Enfants actifs</div>
          <div class="text-3xl font-bold text-purple-600">{{ stats().activeChildren }}</div>
        </div>
        <div class="kpi-card bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500 mb-1">Non-conformités ouvertes</div>
          <div class="text-3xl font-bold text-orange-600">{{ stats().openNonCompliances }}</div>
        </div>
      </div>

      <!-- Accès rapides -->
      <h2 class="text-xl font-semibold mb-4">Accès rapides</h2>
      <div class="quick-access grid grid-cols-2 md:grid-cols-4 gap-4">
        <a routerLink="/haccp/meals" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">🍽️</div>
          <div class="font-semibold">Repas</div>
        </a>
        <a routerLink="/haccp/children" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">🧒</div>
          <div class="font-semibold">Enfants</div>
        </a>
        <a routerLink="/haccp/products" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">📦</div>
          <div class="font-semibold">Produits</div>
        </a>
        <a routerLink="/haccp/suppliers" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">🚚</div>
          <div class="font-semibold">Fournisseurs</div>
        </a>
        <a routerLink="/haccp/equipment" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">⚙️</div>
          <div class="font-semibold">Équipements</div>
        </a>
        <a routerLink="/haccp/non-compliances" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">⚠️</div>
          <div class="font-semibold">Non-conformités</div>
        </a>
        <a routerLink="/haccp/documents" class="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
          <div class="text-4xl mb-2">📁</div>
          <div class="font-semibold">Documents</div>
        </a>
      </div>
    </div>
  `
})
export class HaccpDashboardComponent implements OnInit {
  private haccpService = inject(HaccpService);
  private commService = inject(CommunicationService);

  stats = signal({
    mealsToday: 0,
    tempChecks: 0,
    tempCompliant: true,
    activeChildren: 0,
    openNonCompliances: 0
  });

  criticalAlerts = signal<Array<{id: string, title: string, message: string}>>([]);

  ngOnInit() {
    this.loadStats();
    this.checkCriticalAlerts();
  }

  private loadStats() {
    // Load today's meals
    this.haccpService.getMeals().subscribe(meals => {
      const today = new Date().toISOString().split('T')[0];
      const mealsToday = meals.filter(m => m.date === today);
      this.stats.update(s => ({ ...s, mealsToday: mealsToday.length }));
    });

    // Load active children
    this.haccpService.getChildren(true).subscribe(children => {
      this.stats.update(s => ({ ...s, activeChildren: children.length }));
    });

    // Load temperatures
    this.haccpService.getTemperatures().subscribe(temps => {
      const nonCompliant = temps.filter(t => !t.is_compliant).length;
      this.stats.update(s => ({
        ...s,
        tempChecks: temps.length,
        tempCompliant: nonCompliant === 0
      }));
    });

    // Load non-compliances
    this.haccpService.getNonCompliances().subscribe(nc => {
      const open = nc.filter(n => n.status === 'OPEN').length;
      this.stats.update(s => ({ ...s, openNonCompliances: open }));
    });
  }

  private checkCriticalAlerts() {
    const alerts: Array<{id: string, title: string, message: string}> = [];

    // Check expired products
    this.haccpService.getProducts().subscribe(products => {
      const today = new Date();
      const expired = products.filter(p => p.expiry_date && new Date(p.expiry_date) < today);
      if (expired.length > 0) {
        alerts.push({
          id: 'expired-products',
          title: 'Produits périmés',
          message: `${expired.length} produit(s) périmé(s) à retirer immédiatement`
        });
        this.criticalAlerts.set(alerts);
      }
    });

    // Check non-compliant temperatures
    this.haccpService.getTemperatures().subscribe(temps => {
      const nonCompliant = temps.filter(t => !t.is_compliant);
      if (nonCompliant.length > 0) {
        alerts.push({
          id: 'temp-alert',
          title: 'Températures hors norme',
          message: `${nonCompliant.length} contrôle(s) de température non conforme(s)`
        });
        this.criticalAlerts.set(alerts);
      }
    });
  }
}
