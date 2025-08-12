import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../session/session.service';
import { TaskService } from '../tasks/task.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { StatsCardComponent } from '../../shared/components/stats-card/stats-card.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    NavbarComponent, 
    StatsCardComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar></app-navbar>
      
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Bonjour {{ userName() }} 👋
          </h1>
          <p class="text-gray-600 mt-2">{{ todayDate }}</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <app-stats-card
            title="Session du jour"
            [value]="sessionStatus()"
            icon="calendar"
            [color]="getSessionColor()"
          ></app-stats-card>
          
          <app-stats-card
            title="Tâches complétées"
            [value]="completedTasksCount() + '/' + totalTasksCount()"
            icon="check-circle"
            color="success"
          ></app-stats-card>
          
          <app-stats-card
            title="Tâches en attente"
            [value]="pendingTasksCount().toString()"
            icon="clock"
            color="warning"
          ></app-stats-card>
          
          <app-stats-card
            title="Exécutants actifs"
            [value]="activePerformersCount().toString()"
            icon="users"
            color="primary"
          ></app-stats-card>
        </div>

        <!-- Actions rapides -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              routerLink="/session"
              class="flex items-center justify-center gap-3 p-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <lucide-icon name="calendar" [size]="24"></lucide-icon>
              <span class="font-medium">Session d'aujourd'hui</span>
            </a>
            
            <a
              routerLink="/tasks"
              class="flex items-center justify-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <lucide-icon name="check-circle" [size]="24"></lucide-icon>
              <span class="font-medium">Gérer les tâches</span>
            </a>
            
            <button
              (click)="generateReport()"
              class="flex items-center justify-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <lucide-icon name="file-text" [size]="24"></lucide-icon>
              <span class="font-medium">Générer un rapport</span>
            </button>
          </div>
        </div>

        <!-- Tâches récentes -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Activité récente</h2>
            <a routerLink="/session" class="text-sm text-primary-600 hover:text-primary-700">
              Voir tout →
            </a>
          </div>
          
          @if (isLoadingTasks()) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="h-16 bg-gray-100 rounded-lg skeleton"></div>
              }
            </div>
          } @else if (recentLogs().length > 0) {
            <div class="space-y-3">
              @for (log of recentLogs(); track log.id) {
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div [class]="getStatusClass(log.status)" class="w-2 h-2 rounded-full"></div>
                    <div>
                      <p class="font-medium text-gray-900">{{ log.taskName }}</p>
                      <p class="text-sm text-gray-600">{{ log.roomName }} - {{ log.performerName }}</p>
                    </div>
                  </div>
                  <span class="text-sm text-gray-500">{{ formatTime(log.timestamp) }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="text-gray-500 text-center py-8">Aucune activité récente</p>
          }
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private taskService = inject(TaskService);
  
  // Signals
  userName = signal('');
  sessionStatus = signal('Non démarrée');
  completedTasksCount = signal(0);
  totalTasksCount = signal(0);
  pendingTasksCount = signal(0);
  activePerformersCount = signal(3);
  recentLogs = signal<any[]>([]);
  isLoadingTasks = signal(true);
  
  todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  ngOnInit() {
    this.loadUserData();
    this.loadDashboardData();
  }
  
  private loadUserData() {
    const user = this.authService.appUser();
    if (user) {
      this.userName.set(user.full_name);
    }
  }
  
  private async loadDashboardData() {
    this.isLoadingTasks.set(true);
    
    try {
      // Charger la session du jour
      const session = await this.sessionService.getTodaySession();
      if (session) {
        this.sessionStatus.set(this.getSessionStatusText(session.status));
        
        // Charger les logs de la session
        const logs = await this.sessionService.getSessionLogs(session.id);
        this.updateTaskCounts(logs);
        this.recentLogs.set(logs.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      this.isLoadingTasks.set(false);
    }
  }
  
  private updateTaskCounts(logs: any[]) {
    const completed = logs.filter(l => l.status === 'fait').length;
    const total = logs.length;
    
    this.completedTasksCount.set(completed);
    this.totalTasksCount.set(total);
    this.pendingTasksCount.set(total - completed);
  }
  
  getSessionColor(): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    const status = this.sessionStatus();
    if (status === 'Complétée') return 'success';
    if (status === 'En cours') return 'warning';
    return 'default';
  }
  
  getSessionStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'en_cours': 'En cours',
      'completee': 'Complétée',
      'incomplete': 'Incomplète'
    };
    return statusMap[status] || 'Non démarrée';
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'fait': 'bg-green-500',
      'partiel': 'bg-yellow-500',
      'reporte': 'bg-orange-500',
      'impossible': 'bg-red-500'
    };
    return classes[status] || 'bg-gray-500';
  }
  
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  generateReport() {
    console.log('Génération du rapport...');
    // TODO: Implémenter la génération de rapport
  }
}