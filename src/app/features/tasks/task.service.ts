import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Performer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AssignedTask {
  id: string;
  task_template: TaskTemplate;
  room: Room;
  default_performer: Performer;
  frequency_days: number;
  times_per_day: number;
  suggested_time?: string;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = inject(ApiService);
  
  // Signals
  taskTemplates = signal<TaskTemplate[]>([]);
  assignedTasks = signal<AssignedTask[]>([]);
  rooms = signal<Room[]>([]);
  performers = signal<Performer[]>([]);
  isLoading = signal(false);
  
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
      const [templates, assigned, rooms, performers] = await Promise.all([
        firstValueFrom(this.api.get<TaskTemplate[]>('task-templates')),
        firstValueFrom(this.api.get<AssignedTask[]>('assigned-tasks')),
        firstValueFrom(this.api.get<Room[]>('rooms')),
        firstValueFrom(this.api.get<Performer[]>('performers'))
      ]);
      
      this.taskTemplates.set(templates);
      this.assignedTasks.set(assigned);
      this.rooms.set(rooms);
      this.performers.set(performers);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async createTaskTemplate(task: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const newTask = await firstValueFrom(
      this.api.post<TaskTemplate>('task-templates', task)
    );
    
    this.taskTemplates.update(tasks => [...tasks, newTask]);
    return newTask;
  }
  
  // Create an assigned task by linking an existing template to a room/performer
  async assignTask(assignment: {
    task_template_id: string;
    room_id: string;
    default_performer_id: string;
    frequency_days?: number;
    times_per_day?: number;
    suggested_time?: string;
    is_active?: boolean;
  }): Promise<AssignedTask> {
    const newAssignment = await firstValueFrom(
      this.api.post<AssignedTask>('assigned-tasks', assignment)
    );
    
    this.assignedTasks.update(tasks => [...tasks, newAssignment]);
    return newAssignment;
  }
  
  async createRoom(room: Partial<Room>): Promise<Room> {
    const newRoom = await firstValueFrom(
      this.api.post<Room>('rooms', room)
    );
    
    this.rooms.update(rooms => [...rooms, newRoom]);
    return newRoom;
  }
  
  async createPerformer(performer: Partial<Performer>): Promise<Performer> {
    const newPerformer = await firstValueFrom(
      this.api.post<Performer>('performers', performer)
    );
    
    this.performers.update(performers => [...performers, newPerformer]);
    return newPerformer;
  }

  // Update methods
  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    const updated = await firstValueFrom(
      this.api.put<Room>(`rooms/${roomId}`, updates)
    );
    this.rooms.update(list => list.map(r => (r.id === updated.id ? updated : r)));
    return updated;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`rooms/${roomId}`));
    this.rooms.update(list => list.filter(r => r.id !== roomId));
    // Optionally refresh assigned tasks if backend cascades; keeping it simple here
  }

  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const updated = await firstValueFrom(
      this.api.put<TaskTemplate>(`task-templates/${id}`, updates)
    );
    this.taskTemplates.update(list => list.map(t => (t.id === updated.id ? updated : t)));
    return updated;
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`task-templates/${id}`));
    this.taskTemplates.update(list => list.filter(t => t.id !== id));
  }

  async updateAssignedTask(id: string, updates: Partial<AssignedTask> & {
    // Allow id-based updates too
    task_template_id?: string;
    room_id?: string;
    default_performer_id?: string;
  }): Promise<AssignedTask> {
    const updated = await firstValueFrom(
      this.api.put<AssignedTask>(`assigned-tasks/${id}`, updates)
    );
    this.assignedTasks.update(list => list.map(a => (a.id === updated.id ? updated : a)));
    return updated;
  }

  async deleteAssignedTask(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`assigned-tasks/${id}`));
    this.assignedTasks.update(list => list.filter(a => a.id !== id));
  }
}
