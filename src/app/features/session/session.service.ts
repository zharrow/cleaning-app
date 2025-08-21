// import { Injectable, inject, signal } from '@angular/core';
// import { ApiService } from '../../core/services/api.service';
// import { firstValueFrom } from 'rxjs';

// export interface CleaningSession {
//   id: string;
//   date: string;
//   status: 'en_cours' | 'completee' | 'incomplete';
//   notes?: string;
//   created_at: string;
//   updated_at: string;
// }

// export interface CleaningLog {
//   id: string;
//   session_id: string;
//   assigned_task_id: string;
//   performer_id: string;
//   status: 'fait' | 'partiel' | 'reporte' | 'impossible';
//   notes?: string;
//   photos?: string[];
//   timestamp: string;
//   taskName?: string;
//   roomName?: string;
//   performerName?: string;
// }

// @Injectable({ providedIn: 'root' })
// export class SessionService {
//   private api = inject(ApiService);
  
//   // Signals pour l'état
//   currentSession = signal<CleaningSession | null>(null);
//   sessionLogs = signal<CleaningLog[]>([]);
//   isLoading = signal(false);
  
//   async getTodaySession(): Promise<CleaningSession> {
//     this.isLoading.set(true);
//     try {
//       const session = await firstValueFrom(
//         this.api.get<CleaningSession>('sessions/today')
//       );
//       this.currentSession.set(session);
//       return session;
//     } finally {
//       this.isLoading.set(false);
//     }
//   }
  
//   async getSessionLogs(sessionId: string): Promise<CleaningLog[]> {
//     const logs = await firstValueFrom(
//       this.api.get<CleaningLog[]>(`cleaning-logs?session_id=${sessionId}`)
//     );
//     this.sessionLogs.set(logs);
//     return logs;
//   }
  
//   async updateSessionStatus(sessionId: string, status: CleaningSession['status']): Promise<void> {
//     await firstValueFrom(
//       this.api.patch(`sessions/${sessionId}/status`, { status })
//     );
    
//     // Mettre à jour le signal local
//     const current = this.currentSession();
//     if (current && current.id === sessionId) {
//       this.currentSession.set({ ...current, status });
//     }
//   }
  
//   async createLog(log: Partial<CleaningLog>): Promise<CleaningLog> {
//     const newLog = await firstValueFrom(
//       this.api.post<CleaningLog>('cleaning-logs', log)
//     );
    
//     // Ajouter au signal local
//     this.sessionLogs.update(logs => [...logs, newLog]);
//     return newLog;
//   }
  
//   async uploadPhoto(logId: string, file: File): Promise<string> {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     const response = await firstValueFrom(
//       this.api.post<{ filename: string }>(`cleaning-logs/${logId}/photos`, formData)
//     );
    
//     return response.filename;
//   }
// }

