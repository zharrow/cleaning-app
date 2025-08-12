// ========================================
// src/app/features/tasks/task-list/task-list.component.ts
// ========================================
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TaskService } from '../task.service';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Filter } from 'lucide-angular';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar></app-navbar>
      
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestion des tâches</h1>
            <p class="text-gray-600 mt-1">{{ taskService.activeTasksCount() }} tâches actives</p>
          </div>
          <button
            (click)="openAddTaskModal()"
            class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <lucide-icon name="plus" [size]="20"></lucide-icon>
            <span>Nouvelle tâche</span>
          </button>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon name="search" [size]="20" class="text-gray-400"></lucide-icon>
              </div>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Rechercher une tâche..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              [(ngModel)]="filterRoom"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Toutes les pièces</option>
              @for (room of taskService.rooms(); track room.id) {
                <option [value]="room.id">{{ room.name }}</option>
              }
            </select>
            <select
              [(ngModel)]="filterPerformer"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous les exécutants</option>
              @for (performer of taskService.performers(); track performer.id) {
                <option [value]="performer.id">{{ performer.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Liste des tâches -->
        @if (taskService.isLoading()) {
          <div class="space-y-4">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="h-6 bg-gray-200 rounded w-1/3 mb-3 skeleton"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 skeleton"></div>
              </div>
            }
          </div>
        } @else {
          <div class="grid gap-4">
            @for (task of getFilteredTasks(); track task.id) {
              <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ task.task_template.name }}
                    </h3>
                    @if (task.task_template.description) {
                      <p class="text-gray-600 mt-1">{{ task.task_template.description }}</p>
                    }
                    
                    <div class="flex flex-wrap gap-4 mt-3">
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-500">Pièce:</span>
                        <span class="text-sm font-medium text-gray-900">{{ task.room.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-500">Exécutant:</span>
                        <span class="text-sm font-medium text-gray-900">{{ task.default_performer.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-500">Fréquence:</span>
                        <span class="text-sm font-medium text-gray-900">
                          {{ task.frequency_days === 1 ? 'Quotidien' : 'Tous les ' + task.frequency_days + ' jours' }}
                        </span>
                      </div>
                      @if (task.suggested_time) {
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-gray-500">Heure:</span>
                          <span class="text-sm font-medium text-gray-900">{{ task.suggested_time }}</span>
                        </div>
                      }
                    </div>
                    
                    <div class="flex items-center gap-2 mt-3">
                      @if (task.is_active) {
                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Active
                        </span>
                      } @else {
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          Inactive
                        </span>
                      }
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex items-center gap-2 ml-4">
                    <button
                      (click)="editTask(task)"
                      class="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <lucide-icon name="edit" [size]="18"></lucide-icon>
                    </button>
                    <button
                      (click)="deleteTask(task)"
                      class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <lucide-icon name="trash-2" [size]="18"></lucide-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
        
        @if (!taskService.isLoading() && getFilteredTasks().length === 0) {
          <div class="bg-white rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Aucune tâche trouvée</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: []
})
export class TaskListComponent implements OnInit {
  taskService = inject(TaskService);
  
  searchQuery = '';
  filterRoom = '';
  filterPerformer = '';
  
  ngOnInit() {
    this.loadTasks();
  }
  
  private async loadTasks() {
    await this.taskService.loadAllData();
  }
  
  getFilteredTasks() {
    let tasks = this.taskService.assignedTasks();
    
    // Filtre par recherche
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.task_template.name.toLowerCase().includes(query) ||
        t.task_template.description?.toLowerCase().includes(query)
      );
    }
    
    // Filtre par pièce
    if (this.filterRoom) {
      tasks = tasks.filter(t => t.room.id === this.filterRoom);
    }
    
    // Filtre par exécutant
    if (this.filterPerformer) {
      tasks = tasks.filter(t => t.default_performer.id === this.filterPerformer);
    }
    
    return tasks;
  }
  
  openAddTaskModal() {
    console.log('Ouvrir modal ajout tâche');
    // TODO: Implémenter le modal d'ajout
  }
  
  editTask(task: any) {
    console.log('Éditer tâche:', task);
    // TODO: Implémenter l'édition
  }
  
  deleteTask(task: any) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.task_template.name}" ?`)) {
      console.log('Supprimer tâche:', task);
      // TODO: Implémenter la suppression
    }
  }
}