import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

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

export interface Performer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
  };
}

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
  
  // Signals locaux
  performers = signal<Performer[]>([]);
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
      // Use the ApiService resources directly - plus besoin de copier les données
      // Les computed properties vont utiliser directement l'ApiService
      
      // Charger les performers depuis l'API
      await this.loadPerformers();
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private async loadPerformers(): Promise<void> {
    try {
      const performers = await this.api.getPerformers(true); // Inclure les inactifs
      this.performers.set(performers);
    } catch (error) {
      console.error('Erreur lors du chargement des performers:', error);
      // Si aucun performer n'existe, créer des performers par défaut
      console.log('Aucun performer trouvé, création de performers par défaut...');
      await this.createDefaultPerformers();
    }
  }
  
  private async createDefaultPerformers(): Promise<void> {
    const defaultPerformers = [
      { name: 'Marie Dupont' },
      { name: 'Pierre Martin' },
      { name: 'Sophie Bernard' }
    ];
    
    try {
      for (const performerData of defaultPerformers) {
        await this.createPerformer(performerData);
      }
    } catch (error) {
      console.error('Erreur lors de la création des performers par défaut:', error);
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

  async createPerformer(performer: Partial<Performer>): Promise<Performer> {
    try {
      const newPerformer = await this.api.createPerformer({
        name: performer.name!
      });
      
      // Mettre à jour la liste locale
      const currentPerformers = this.performers();
      this.performers.set([...currentPerformers, newPerformer]);

      return newPerformer;
    } catch (error) {
      console.error('Erreur lors de la création du performer:', error);
      throw error;
    }
  }

  async updatePerformer(id: string, updates: { name: string }): Promise<Performer> {
    try {
      const updatedPerformer = await this.api.updatePerformer(id, updates);
      
      // Mettre à jour la liste locale
      const currentPerformers = this.performers();
      const updatedPerformers = currentPerformers.map(p => 
        p.id === id ? updatedPerformer : p
      );
      this.performers.set(updatedPerformers);
      
      return updatedPerformer;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du performer:', error);
      throw error;
    }
  }

  async togglePerformerStatus(id: string): Promise<Performer> {
    try {
      const updatedPerformer = await this.api.togglePerformerStatus(id);
      
      // Mettre à jour la liste locale
      const currentPerformers = this.performers();
      const updatedPerformers = currentPerformers.map(p => 
        p.id === id ? updatedPerformer : p
      );
      this.performers.set(updatedPerformers);
      
      return updatedPerformer;
    } catch (error) {
      console.error('Erreur lors du toggle du performer:', error);
      throw error;
    }
  }

  async deletePerformer(id: string): Promise<void> {
    try {
      await this.api.deletePerformer(id);
      
      // Retirer de la liste locale
      const currentPerformers = this.performers();
      const filteredPerformers = currentPerformers.filter(p => p.id !== id);
      this.performers.set(filteredPerformers);
    } catch (error) {
      console.error('Erreur lors de la suppression du performer:', error);
      throw error;
    }
  }
}