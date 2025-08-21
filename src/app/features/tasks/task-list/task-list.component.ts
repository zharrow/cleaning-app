// ========================================
// Composant Liste des tâches - src/app/features/tasks/task-list/task-list.component.ts
// ========================================
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, type AssignedTask } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Composant de liste des tâches
 * Affiche toutes les tâches assignées avec possibilité de filtrage
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Mes tâches</h1>
            <p class="page-subtitle">
              Vue d'ensemble de toutes les tâches assignées
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <a routerLink="/session" class="btn btn-primary">
              <span class="text-lg">📋</span>
              Session du jour
            </a>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total des tâches</p>
                <p class="text-2xl font-bold text-gray-900">{{ allTasks().length }}</p>
              </div>
              <span class="text-3xl">📝</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Quotidiennes</p>
                <p class="text-2xl font-bold text-success-600">{{ dailyTasksCount() }}</p>
              </div>
              <span class="text-3xl">📅</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Hebdomadaires</p>
                <p class="text-2xl font-bold text-warning-600">{{ weeklyTasksCount() }}</p>
              </div>
              <span class="text-3xl">📆</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Durée totale/jour</p>
                <p class="text-2xl font-bold text-primary-600">{{ totalDailyDuration() }}min</p>
              </div>
              <span class="text-3xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="card mb-6">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="form-label text-sm">Pièce</label>
              <select class="form-input form-select" [(ngModel)]="filters.room">
                <option value="">Toutes les pièces</option>
                @for (room of availableRooms(); track room.id) {
                  <option [value]="room.id">{{ room.name }}</option>
                }
              </select>
            </div>
            
            <div>
              <label class="form-label text-sm">Fréquence</label>
              <select class="form-input form-select" [(ngModel)]="filters.frequency">
                <option value="">Toutes</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>
            
            <div>
              <label class="form-label text-sm">Catégorie</label>
              <select class="form-input form-select" [(ngModel)]="filters.category">
                <option value="">Toutes</option>
                @for (category of availableCategories(); track category) {
                  <option [value]="category">{{ category }}</option>
                }
              </select>
            </div>
            
            <div class="flex items-end">
              <button class="btn btn-secondary" (click)="resetFilters()">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue par pièces -->
      <div class="space-y-6">
        @for (roomGroup of groupedTasks(); track roomGroup.roomId) {
          <div class="card">
            <div class="card-header">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="card-title">{{ roomGroup.roomName }}</h3>
                  <p class="card-subtitle">
                    {{ roomGroup.tasks.length }} tâche(s) assignée(s)
                  </p>
                </div>
                
                <!-- Statistiques de la pièce -->
                <div class="text-right">
                  <p class="text-sm text-gray-600">Temps total/jour</p>
                  <p class="font-semibold text-primary-600">{{ roomGroup.dailyDuration }}min</p>
                </div>
              </div>
            </div>
            
            <div class="card-body">
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Tâche</th>
                      <th>Catégorie</th>
                      <th>Fréquence</th>
                      <th>Durée</th>
                      <th>Exécutant par défaut</th>
                      <th>Heure suggérée</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (task of roomGroup.tasks; track task.id) {
                      <tr>
                        <td>
                          <div>
                            <p class="font-medium text-gray-900">
                              {{ task.task_template.name }}
                            </p>
                            @if (task.task_template.description) {
                              <p class="text-sm text-gray-600">
                                {{ task.task_template.description }}
                              </p>
                            }
                          </div>
                        </td>
                        <td>
                          <span class="badge badge-primary">
                            {{ task.task_template.category }}
                          </span>
                        </td>
                        <td>
                          <span 
                            class="badge"
                            [class]="getFrequencyBadgeClass(task.frequency)"
                          >
                            {{ getFrequencyLabel(task.frequency) }}
                          </span>
                        </td>
                        <td>
                          <span class="font-medium text-gray-900">
                            {{ task.task_template.estimated_duration }}min
                          </span>
                        </td>
                        <td>
                          <span class="text-gray-600">
                            {{ task.default_performer || '-' }}
                          </span>
                        </td>
                        <td>
                          <span class="text-gray-600">
                            {{ task.suggested_time || '-' }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>

      @if (filteredTasks().length === 0) {
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">🔍</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune tâche trouvée
            </h3>
            <p class="text-gray-600 mb-4">
              Aucune tâche ne correspond à vos critères de recherche.
            </p>
            <button class="btn btn-secondary" (click)="resetFilters()">
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TaskListComponent {
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  // Filtres
  readonly filters = signal({
    room: '',
    frequency: '',
    category: ''
  });

  // Computed signals
  readonly allTasks = computed(() => this.apiService.assignedTasks.value() || []);
  readonly isLoading = computed(() => this.apiService.assignedTasks.isLoading());

  readonly dailyTasksCount = computed(() => 
    this.allTasks().filter(task => task.frequency === 'daily').length
  );

  readonly weeklyTasksCount = computed(() => 
    this.allTasks().filter(task => task.frequency === 'weekly').length
  );

  readonly totalDailyDuration = computed(() => 
    this.allTasks()
      .filter(task => task.frequency === 'daily')
      .reduce((total, task) => total + task.task_template.estimated_duration, 0)
  );

  readonly availableRooms = computed(() => {
    const rooms = new Map<string, { id: string, name: string }>();
    this.allTasks().forEach(task => {
      rooms.set(task.room_id, { id: task.room_id, name: task.room.name });
    });
    return Array.from(rooms.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly availableCategories = computed(() => {
    const categories = new Set<string>();
    this.allTasks().forEach(task => {
      categories.add(task.task_template.category);
    });
    return Array.from(categories).sort();
  });

  readonly filteredTasks = computed(() => {
    let tasks = this.allTasks();
    const currentFilters = this.filters();

    if (currentFilters.room) {
      tasks = tasks.filter(task => task.room_id === currentFilters.room);
    }

    if (currentFilters.frequency) {
      tasks = tasks.filter(task => task.frequency === currentFilters.frequency);
    }

    if (currentFilters.category) {
      tasks = tasks.filter(task => task.task_template.category === currentFilters.category);
    }

    return tasks;
  });

  readonly groupedTasks = computed(() => {
    const tasks = this.filteredTasks();
    const groups = new Map<string, AssignedTask[]>();

    tasks.forEach(task => {
      const roomId = task.room_id;
      if (!groups.has(roomId)) {
        groups.set(roomId, []);
      }
      groups.get(roomId)!.push(task);
    });

    return Array.from(groups.entries()).map(([roomId, tasks]) => ({
      roomId,
      roomName: tasks[0].room.name,
      tasks: tasks.sort((a, b) => a.task_template.name.localeCompare(b.task_template.name)),
      dailyDuration: tasks
        .filter(task => task.frequency === 'daily')
        .reduce((total, task) => total + task.task_template.estimated_duration, 0)
    })).sort((a, b) => a.roomName.localeCompare(b.roomName));
  });

  /**
   * Actions
   */
  resetFilters(): void {
    this.filters.set({
      room: '',
      frequency: '',
      category: ''
    });
  }

  getFrequencyLabel(frequency: string): string {
    const labels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  }

  getFrequencyBadgeClass(frequency: string): string {
    const classes = {
      daily: 'badge-success',
      weekly: 'badge-warning',
      monthly: 'badge-primary'
    };
    return classes[frequency as keyof typeof classes] || 'badge-gray';
  }
}