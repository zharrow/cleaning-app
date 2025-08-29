import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService, AssignedTask, Room } from '../../tasks/task.service';

interface RoomWithTasks extends Room {
  assignedTasks: AssignedTask[];
  totalTasks: number;
  estimatedDuration: number;
}

@Component({
  selector: 'app-rooms-with-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Pièces avec tâches assignées</h1>
          <p class="text-gray-600 mt-2">Session du jour - {{ currentDate }}</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500">Total des pièces</div>
          <div class="text-2xl font-bold text-blue-600">{{ roomsWithAssignedTasks().length }}</div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m1 0h1M9 11h1m1 0h1m1-4h1m1 0h1M9 15h1m1 0h1"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total des tâches</p>
              <p class="text-2xl font-semibold text-gray-900">{{ totalTasksCount() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Durée estimée</p>
              <p class="text-2xl font-semibold text-gray-900">{{ totalEstimatedTime() }}min</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Exécutants uniques</p>
              <p class="text-2xl font-semibold text-gray-900">{{ uniquePerformersCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rooms Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="roomsWithAssignedTasks().length > 0">
        <div 
          *ngFor="let room of roomsWithAssignedTasks()" 
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          
          <!-- Room Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-semibold text-gray-900">{{ room.name }}</h3>
                <p class="text-gray-600 text-sm mt-1" *ngIf="room.description">{{ room.description }}</p>
              </div>
              <div class="flex flex-col items-end">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {{ room.totalTasks }} tâche(s)
                </span>
                <span class="text-xs text-gray-500 mt-1" *ngIf="room.estimatedDuration > 0">
                  ~{{ room.estimatedDuration }}min
                </span>
              </div>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="p-6">
            <h4 class="text-sm font-medium text-gray-700 mb-4">Tâches assignées :</h4>
            <div class="space-y-3">
              <div 
                *ngFor="let task of room.assignedTasks" 
                class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                
                <div class="flex-shrink-0">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ task.task_template.title }}</p>
                      <p class="text-xs text-gray-500 mt-1" *ngIf="task.task_template.description">
                        {{ task.task_template.description }}
                      </p>
                    </div>
                    <div class="ml-2 flex-shrink-0 text-right">
                      <p class="text-xs text-gray-500">
                        {{ task.times_per_day }}x/jour
                      </p>
                      <p class="text-xs text-gray-400" *ngIf="task.suggested_time">
                        {{ task.suggested_time }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center space-x-1">
                      <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span class="text-xs text-gray-600">{{ task.default_performer.name }}</span>
                    </div>
                    
                    <div class="flex items-center space-x-1">
                      <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="text-xs text-gray-500">
                        {{ formatFrequency(task.frequency_days) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="roomsWithAssignedTasks().length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m1 0h1M9 11h1m1 0h1m1-4h1m1 0h1M9 15h1m1 0h1"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune pièce avec tâches assignées</h3>
        <p class="mt-1 text-sm text-gray-500">Assignez des tâches aux pièces pour les voir apparaître ici.</p>
        <div class="mt-6">
          <button 
            type="button" 
            routerLink="/manage/assigned-tasks"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Assigner des tâches
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="taskService.isLoading()" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Chargement...</span>
      </div>
    </div>
  `
})
export class RoomsWithTasksComponent implements OnInit {
  taskService = inject(TaskService);
  
  currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  roomsWithAssignedTasks = computed(() => {
    const tasksByRoom = this.taskService.tasksByRoom();
    return this.taskService.rooms()
      .filter(room => tasksByRoom.has(room.id))
      .map(room => {
        const tasks = tasksByRoom.get(room.id) || [];
        const estimatedDuration = tasks.reduce((total, task) => {
          const taskDuration = task.task_template.estimated_duration || task.task_template.default_duration || 0;
          return total + (taskDuration * task.times_per_day);
        }, 0);

        return {
          ...room,
          assignedTasks: tasks,
          totalTasks: tasks.length,
          estimatedDuration
        } as RoomWithTasks;
      })
      .sort((a, b) => a.display_order - b.display_order);
  });

  totalTasksCount = computed(() => {
    return this.roomsWithAssignedTasks().reduce((total, room) => total + room.totalTasks, 0);
  });

  totalEstimatedTime = computed(() => {
    return this.roomsWithAssignedTasks().reduce((total, room) => total + room.estimatedDuration, 0);
  });

  uniquePerformersCount = computed(() => {
    const performerIds = new Set();
    this.roomsWithAssignedTasks().forEach(room => {
      room.assignedTasks.forEach(task => {
        performerIds.add(task.default_performer.id);
      });
    });
    return performerIds.size;
  });

  ngOnInit() {
    this.taskService.loadAllData();
  }

  formatFrequency(frequency: any): string {
    switch (frequency?.type) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'occasional': return 'Occasionnel';
      default: return 'Non défini';
    }
  }
}