// ========================================
// Service API Angular 19 avec httpResource()
// src/app/core/services/api.service.ts
// ========================================
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { resource, ResourceRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/**
 * Types pour l'API
 */
export interface ApiResponse<T = any> {
  readonly data: T;
  readonly message?: string;
  readonly success: boolean;
}

export interface PaginatedResponse<T = any> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface TaskTemplate {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly category: string;
  readonly estimated_duration: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AssignedTask {
  readonly id: string;
  readonly room_id: string;
  readonly task_template_id: string;
  readonly frequency: 'daily' | 'weekly' | 'monthly';
  readonly suggested_time?: string;
  readonly default_performer?: string;
  readonly is_active: boolean;
  readonly room: Room;
  readonly task_template: TaskTemplate;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CleaningSession {
  readonly id: string;
  readonly date: string;
  readonly status: 'pending' | 'in_progress' | 'completed' | 'incomplete';
  readonly total_tasks: number;
  readonly completed_tasks: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CleaningLog {
  readonly id: string;
  readonly session_id: string;
  readonly assigned_task_id: string;
  readonly status: 'todo' | 'in_progress' | 'done' | 'partial' | 'skipped' | 'blocked';
  readonly performed_by?: string;
  readonly notes?: string;
  readonly photos?: string[];
  readonly started_at?: string;
  readonly completed_at?: string;
  readonly assigned_task: AssignedTask;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface DashboardStats {
  readonly todayProgress: {
    readonly total: number;
    readonly completed: number;
    readonly percentage: number;
  };
  readonly weeklyStats: {
    readonly tasksCompleted: number;
    readonly averageTimePerTask: number;
    readonly mostActivePerformer: string;
  };
  readonly recentSessions: CleaningSession[];
  readonly upcomingTasks: AssignedTask[];
}

/**
 * Service API moderne utilisant httpResource() et signals
 * Gère tous les appels vers l'API backend avec authentification automatique
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  // Signal pour forcer le refresh des ressources
  private readonly refreshTrigger = signal(0);
  
  // Configuration de base
  private readonly baseUrl = environment.apiUrl;
  
  /**
   * Resources pour les données principales
   */
  
  // Dashboard stats avec refresh automatique
  readonly dashboardStats: ResourceRef<DashboardStats | null> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return null;
      
      const response = await this.httpGet<DashboardStats>('/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });
  
  // Session du jour
  readonly todaySession: ResourceRef<CleaningSession | null> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return null;
      
      try {
        const response = await this.httpGet<CleaningSession>('/sessions/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error: any) {
        // Si pas de session aujourd'hui, retourner null au lieu d'erreur
        if (error.status === 404) return null;
        throw error;
      }
    }
  });
  
  // Logs de la session du jour
  readonly todayLogs: ResourceRef<CleaningLog[]> = resource({
    request: () => ({ 
      sessionId: this.todaySession.value()?.id,
      trigger: this.refreshTrigger() 
    }),
    loader: async ({ request }) => {
      if (!request.sessionId) return [];
      
      const token = await this.authService.getToken();
      if (!token) return [];
      
      const response = await this.httpGet<CleaningLog[]>(`/sessions/${request.sessionId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });
  
  // Pièces
  readonly rooms: ResourceRef<Room[]> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return [];
      
      const response = await this.httpGet<Room[]>('/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });
  
  // Tâches assignées
  readonly assignedTasks: ResourceRef<AssignedTask[]> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return [];
      
      const response = await this.httpGet<AssignedTask[]>('/tasks/assigned', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });
  
  // Templates de tâches
  readonly taskTemplates: ResourceRef<TaskTemplate[]> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return [];
      
      const response = await this.httpGet<TaskTemplate[]>('/tasks/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });
  
  /**
   * Computed signals pour des données dérivées
   */
  readonly isLoading = computed(() => 
    this.dashboardStats.isLoading() || 
    this.todaySession.isLoading() || 
    this.todayLogs.isLoading() ||
    this.rooms.isLoading() ||
    this.assignedTasks.isLoading()
  );
  
  readonly hasError = computed(() => 
    !!this.dashboardStats.error() || 
    !!this.todaySession.error() || 
    !!this.todayLogs.error() ||
    !!this.rooms.error() ||
    !!this.assignedTasks.error()
  );
  
  readonly todayProgress = computed(() => {
    const logs = this.todayLogs.value() || [];
    const completed = logs.filter(log => log.status === 'done').length;
    const total = logs.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  });
  
  /**
   * Méthodes pour les actions CRUD
   */
  
  /**
   * Démarre une nouvelle session de nettoyage
   */
  async startNewSession(): Promise<CleaningSession> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPost<CleaningSession>('/sessions', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Met à jour le statut d'un log de nettoyage
   */
  async updateCleaningLog(
    logId: string, 
    updates: Partial<Pick<CleaningLog, 'status' | 'performed_by' | 'notes' | 'photos'>>
  ): Promise<CleaningLog> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPut<CleaningLog>(`/logs/${logId}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Crée une nouvelle pièce
   */
  async createRoom(room: Pick<Room, 'name' | 'description' | 'order'>): Promise<Room> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPost<Room>('/rooms', room, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Met à jour une pièce
   */
  async updateRoom(id: string, updates: Partial<Pick<Room, 'name' | 'description' | 'order'>>): Promise<Room> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPut<Room>(`/rooms/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Supprime une pièce
   */
  async deleteRoom(id: string): Promise<void> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    await this.httpDelete(`/rooms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
  }
  
  /**
   * Crée un template de tâche
   */
  async createTaskTemplate(
    template: Pick<TaskTemplate, 'name' | 'description' | 'category' | 'estimated_duration'>
  ): Promise<TaskTemplate> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPost<TaskTemplate>('/tasks/templates', template, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Assigne une tâche à une pièce
   */
  async assignTask(assignment: {
    room_id: string;
    task_template_id: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    suggested_time?: string;
    default_performer?: string;
  }): Promise<AssignedTask> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPost<AssignedTask>('/tasks/assigned', assignment, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.refreshData();
    return response.data;
  }
  
  /**
   * Upload d'une photo
   */
  async uploadPhoto(file: File): Promise<string> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await this.httpPost<{ url: string }>('/uploads/photo', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.url;
  }
  
  /**
   * Génère et télécharge un rapport PDF
   */
  async downloadReport(sessionId: string): Promise<Blob> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await fetch(`${this.baseUrl}/exports/pdf/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement du rapport');
    }
    
    return response.blob();
  }
  
  /**
   * Force le refresh de toutes les données
   */
  refreshData(): void {
    this.refreshTrigger.update(n => n + 1);
  }
  
  /**
   * Méthodes HTTP privées avec gestion d'erreur
   */
  
  private async httpGet<T>(
    endpoint: string, 
    options: { headers?: HttpHeaders | { [header: string]: string } } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  private async httpPost<T>(
    endpoint: string, 
    body: any, 
    options: { headers?: HttpHeaders | { [header: string]: string } } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const isFormData = body instanceof FormData;
      const headers: any = { ...options.headers };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  private async httpPut<T>(
    endpoint: string, 
    body: any, 
    options: { headers?: HttpHeaders | { [header: string]: string } } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  private async httpDelete(
    endpoint: string, 
    options: { headers?: HttpHeaders | { [header: string]: string } } = {}
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}