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
  readonly room_id?: string;
  readonly task_template_id?: string;
  readonly frequency_days: {
    type: 'daily' | 'weekly' | 'monthly';
    times_per_day: number;
    days: number[];
  };
  readonly times_per_day: number;
  readonly suggested_time?: string;
  readonly default_performer_id?: string;
  readonly is_active: boolean;
  readonly room: Room;
  readonly task_template: TaskTemplate;
  readonly default_performer?: {
    id: string;
    name: string;
  };
  readonly created_at: string;
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
  readonly dashboardStats: ResourceRef<DashboardStats | null | undefined> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return null;
      
      const response = await this.httpGet<DashboardStats>('/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    }
  });
  
  // Session du jour
  readonly todaySession: ResourceRef<CleaningSession | null | undefined> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return null;
      
      try {
        // Essayer de récupérer la session existante
        const response = await this.httpGet<CleaningSession>('/sessions/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response;
      } catch (error: any) {
        // Si pas de session aujourd'hui (404), la créer automatiquement
        if (error.status === 404) {
          try {
            console.log('🔄 Aucune session trouvée, création automatique...');
            
            const newSession = await this.httpPost<CleaningSession>('/sessions/today', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Session créée:', newSession.id);
            return newSession;
          } catch (createError: any) {
            console.error('❌ Erreur lors de la création de session:', createError);
            throw createError;
          }
        }
        throw error;
      }
    }
  });
  
  // Logs de la session du jour
  readonly todayLogs: ResourceRef<CleaningLog[] | null | undefined> = resource({
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
      return response;
    }
  });
  
  // Pièces
  readonly rooms: ResourceRef<Room[] | null | undefined> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      console.log('🔄 Rechargement des rooms...');
      const token = await this.authService.getToken();
      if (!token) {
        console.log('❌ Pas de token pour charger les rooms');
        return [];
      }
      
      const response = await this.httpGet<Room[]>('/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Rooms chargées:', response);
      return response;
    }
  });
  
  // Tâches assignées
  readonly assignedTasks: ResourceRef<AssignedTask[] | null | undefined> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      const token = await this.authService.getToken();
      if (!token) return [];
      
      const response = await this.httpGet<AssignedTask[]>('/assigned-tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    }
  });
  
  // Templates de tâches
  readonly taskTemplates: ResourceRef<TaskTemplate[] | null | undefined> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      console.log('🔄 Rechargement des taskTemplates...');
      const token = await this.authService.getToken();
      if (!token) {
        console.log('❌ Pas de token pour charger les taskTemplates');
        return [];
      }
      
      const response = await this.httpGet<TaskTemplate[]>('/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ TaskTemplates chargés:', response);
      return response;
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
    return response;
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
    
    // Rafraîchir seulement les rooms, pas les sessions
    console.log('🏠 Room créée, rechargement des rooms...', response);
    this.rooms.reload();
    return response;
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
    
    // Rafraîchir seulement les rooms
    this.rooms.reload();
    return response;
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
    
    // Rafraîchir seulement les rooms
    this.rooms.reload();
  }
  
  /**
   * Crée un template de tâche
   */
  async createTaskTemplate(
    template: Pick<TaskTemplate, 'name' | 'description' | 'category' | 'estimated_duration'>
  ): Promise<TaskTemplate> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPost<TaskTemplate>('/tasks', template, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Rafraîchir seulement les templates de tâches, pas les sessions
    console.log('📋 TaskTemplate créé, rechargement des templates...', response);
    this.taskTemplates.reload();
    
    return response;
  }
  
  /**
   * Assigne une tâche à une pièce
   */
  async assignTask(assignment: {
    room_id: string;
    task_template_id: string;
    default_performer_id: string;
    frequency_days?: {
      type: 'daily' | 'weekly' | 'monthly' | 'occasional';
      times_per_day?: number;
      days?: number[];
    };
    times_per_day?: number;
    suggested_time?: string;
  }): Promise<AssignedTask> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    // Préparer les données au bon format pour l'API
    const apiData = {
      task_template_id: assignment.task_template_id,
      room_id: assignment.room_id,
      // Gérer le cas où default_performer_id est vide
      default_performer_id: assignment.default_performer_id && assignment.default_performer_id.trim() 
        ? assignment.default_performer_id 
        : null,
      frequency_days: {
        type: assignment.frequency_days?.type || 'daily',
        times_per_day: assignment.frequency_days?.times_per_day || assignment.times_per_day || 1,
        days: assignment.frequency_days?.days || []
      },
      times_per_day: assignment.times_per_day || 1,
      // Gérer le suggested_time - l'envoyer comme string, l'API le convertira
      suggested_time: assignment.suggested_time && assignment.suggested_time.trim() 
        ? assignment.suggested_time 
        : null
    };
    
    console.log('🔄 Envoi données assignation:', apiData);
    
    const response = await this.httpPost<AssignedTask>('/assigned-tasks', apiData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Rafraîchir seulement les tâches assignées, pas les sessions
    this.assignedTasks.reload();
    return response;
  }

  /**
   * Alias pour assignTask (compatibilité TaskService)
   */
  async createAssignedTask(assignment: any): Promise<AssignedTask> {
    return this.assignTask(assignment);
  }

  /**
   * Récupère tous les performers
   */
  async getPerformers(): Promise<any[]> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    return this.httpGet<any[]>('/performers', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Crée un nouveau performer
   */
  async createPerformer(performer: { name: string; is_active?: boolean }): Promise<any> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    return this.httpPost<any>('/performers', performer, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Met à jour un performer
   */
  async updatePerformer(id: string, updates: any): Promise<any> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    return this.httpPut<any>(`/performers/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Met à jour un modèle de tâche
   */
  async updateTaskTemplate(id: string, updates: any): Promise<TaskTemplate> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPut<TaskTemplate>(`/tasks/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 TaskTemplate modifié, rechargement des templates...', response);
    this.taskTemplates.reload();
    
    return response;
  }

  /**
   * Supprime un modèle de tâche
   */
  async deleteTaskTemplate(id: string): Promise<void> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    await this.httpDelete(`/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.taskTemplates.reload();
  }

  /**
   * Met à jour une tâche assignée
   */
  async updateAssignedTask(id: string, updates: any): Promise<AssignedTask> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const response = await this.httpPatch<AssignedTask>(`/assigned-tasks/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.assignedTasks.reload();
    return response;
  }

  /**
   * Supprime une tâche assignée
   */
  async deleteAssignedTask(id: string): Promise<void> {
    console.log('🗑️ ApiService.deleteAssignedTask - ID:', id);
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    console.log('🔑 Token obtenu pour suppression');
    
    try {
      await this.httpDelete(`/assigned-tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ DELETE /assigned-tasks/' + id + ' réussi');
      this.assignedTasks.reload();
      console.log('🔄 assignedTasks.reload() appelé');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la tâche assignée:', error);
      throw error;
    }
  }
  
  /**
   * Créer manuellement la session du jour
   */
  async createTodaySession(forceRecreate: boolean = false): Promise<CleaningSession> {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Non authentifié');
    
    const params = forceRecreate ? '?force_recreate=true' : '';
    
    console.log('🔄 Création manuelle de session...');
    
    const response = await this.httpPost<CleaningSession>(`/sessions/today${params}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Session créée:', response);
    
    // Rafraîchir les données après création
    this.refreshData();
    return response;
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
    
    return response.url;
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
  ): Promise<T> {
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
  ): Promise<T> {
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
        // Pour les erreurs 422, essayer de récupérer les détails de validation
        if (response.status === 422) {
          try {
            const errorDetails = await response.json();
            console.error('Erreur de validation 422:', errorDetails);
            throw new Error(`HTTP 422: ${JSON.stringify(errorDetails)}`);
          } catch (parseError) {
            // Si on ne peut pas parser la réponse, retourner l'erreur générique
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
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
  ): Promise<T> {
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
  
  private async httpPatch<T>(
    endpoint: string, 
    data: any, 
    options: { headers?: HttpHeaders | { [header: string]: string } } = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`PATCH ${endpoint} failed:`, error);
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