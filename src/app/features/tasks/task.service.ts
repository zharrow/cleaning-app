import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { EmployeeService, type User } from '../../core/services/employee.service';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimated_duration?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Legacy alias for backward compatibility
export type Performer = User;

export interface FrequencyConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'occasional';
  times_per_day: number;
  days: number[];
}

export interface AssignedTask {
  id: string;
  task_template: TaskTemplate;
  room: Room;
  default_performer?: {
    id: string;
    name: string;
  };
  frequency_days: FrequencyConfig;
  times_per_day: number;
  suggested_time?: string;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = inject(ApiService);
  private employeeService = inject(EmployeeService);

  // Signals locaux
  performers = computed(() => this.employeeService.employees() || []); // Use employees from EmployeeService
  isLoading = signal(false);

  // Computed properties qui utilisent directement l'ApiService
  taskTemplates = computed(() => this.api.taskTemplates.value() || []);
  assignedTasks = computed(() => this.api.assignedTasks.value() || []);
  rooms = computed(() => this.api.rooms.value() || []);
  
  // Computed
  activeTasksCount = computed(() => 
    this.assignedTasks().filter(t => t.is_active).length
  );
  
  tasksByRoom = computed(() => {
    const tasks = this.assignedTasks();
    const grouped = new Map<string, AssignedTask[]>();
   
    tasks.forEach(task => {
      const roomId = task.room.id;
      if (!grouped.has(roomId)) {
        grouped.set(roomId, []);
      }
      grouped.get(roomId)!.push(task);
    });
   
    return grouped;
  });
  
  async loadAllData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Charger les données depuis l'API
      this.api.taskTemplates.reload();
      this.api.assignedTasks.reload();
      this.api.rooms.reload();

      // Charger les employés (Users) depuis EmployeeService
      this.employeeService.refreshTrigger.update(v => v + 1);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async createTaskTemplate(task: Partial<TaskTemplate>): Promise<TaskTemplate> {
    if (!task.name) {
      throw new Error('Task name is required');
    }
    const taskData = {
      name: task.name,
      description: task.description,
      category: task.category || 'general',
      estimated_duration: task.estimated_duration || 15
    };
    const newTask = await this.api.createTaskTemplate(taskData);
    // Plus besoin d'update car taskTemplates utilise directement l'ApiService
    return newTask;
  }
  
  async assignTask(assignment: {
    task_template_id: string;
    room_id: string;
    default_performer_id: string;
    frequency_days?: FrequencyConfig;
    times_per_day?: number;
    suggested_time?: string;
    is_active?: boolean;
  }): Promise<AssignedTask> {
    const newAssignment = await this.api.createAssignedTask(assignment);
    // Plus besoin d'update car assignedTasks utilise directement l'ApiService
    return newAssignment;
  }
  
  async createRoom(room: Partial<Room>): Promise<Room> {
    if (!room.name) {
      throw new Error('Room name is required');
    }
    const roomData = {
      name: room.name,
      description: room.description,
      order: room.order || 0
    };
    const newRoom = await this.api.createRoom(roomData);
    // Plus besoin d'update car rooms utilise directement l'ApiService
    return newRoom;
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    const updated = await this.api.updateRoom(roomId, updates);
    // Plus besoin d'update car rooms utilise directement l'ApiService
    return updated;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.api.deleteRoom(roomId);
    // Plus besoin d'update car rooms utilise directement l'ApiService
  }

  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const updated = await this.api.updateTaskTemplate(id, updates);
    // Plus besoin d'update car taskTemplates utilise directement l'ApiService
    return updated;
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await this.api.deleteTaskTemplate(id);
    // Plus besoin d'update car taskTemplates utilise directement l'ApiService
  }

  async updateAssignedTask(id: string, updates: any): Promise<AssignedTask> {
    const updated = await this.api.updateAssignedTask(id, updates);
    // Plus besoin d'update car assignedTasks utilise directement l'ApiService
    return updated;
  }

  async deleteAssignedTask(id: string): Promise<void> {
    await this.api.deleteAssignedTask(id);
    // Plus besoin d'update car assignedTasks utilise directement l'ApiService
  }

  // Performer/Employee management methods removed - use EmployeeService directly
}