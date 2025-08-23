// ========================================
// Composant Mode hors ligne - src/app/features/offline/offline.component.ts
// ========================================
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Composant pour le mode hors ligne
 * Affiche les fonctionnalités disponibles sans connexion
 */
@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div class="max-w-4xl mx-auto">
        
        <!-- En-tête -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <span class="text-4xl">📡</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Mode hors ligne</h1>
          <p class="text-gray-600">
            Vous êtes actuellement hors ligne. Voici ce que vous pouvez faire :
          </p>
        </div>
        
        <!-- Statut de connexion -->
        <div class="card mb-8">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div 
                  class="w-3 h-3 rounded-full"
                  [class]="isOnline() ? 'bg-success-500 animate-pulse' : 'bg-danger-500'"
                ></div>
                <span class="font-medium">
                  {{ isOnline() ? 'Connexion rétablie' : 'Hors ligne' }}
                </span>
              </div>
              
              <button 
                class="btn btn-secondary btn-sm"
                (click)="checkConnection()"
                [disabled]="checkingConnection()"
              >
                @if (checkingConnection()) {
                  <div class="spinner spinner-sm"></div>
                } @else {
                  <span class="text-lg">🔄</span>
                }
                Vérifier
              </button>
            </div>
            
            @if (lastOnline()) {
              <p class="text-sm text-gray-500 mt-2">
                Dernière connexion : {{ formatLastOnline() }}
              </p>
            }
          </div>
        </div>
        
        <!-- Fonctionnalités disponibles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <!-- Données en cache -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📦 Données en cache</h3>
              <p class="card-subtitle">Accédez aux données synchronisées</p>
            </div>
            <div class="card-body">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm">Sessions récentes</span>
                  <span class="badge badge-success">{{ cachedData().sessions }} disponibles</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm">Tâches</span>
                  <span class="badge badge-success">{{ cachedData().tasks }} en cache</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm">Photos</span>
                  <span class="badge badge-success">{{ cachedData().photos }} sauvées</span>
                </div>
              </div>
              
              <a routerLink="/dashboard" class="btn btn-primary btn-sm w-full mt-4">
                Accéder aux données
              </a>
            </div>
          </div>
          
          <!-- Actions disponibles -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚡ Actions possibles</h3>
              <p class="card-subtitle">Ce que vous pouvez faire hors ligne</p>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <span class="text-xl">✅</span>
                  <div>
                    <p class="font-medium text-sm">Consulter les tâches</p>
                    <p class="text-xs text-gray-600">Voir les tâches du jour mises en cache</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-3">
                  <span class="text-xl">📝</span>
                  <div>
                    <p class="font-medium text-sm">Saisir des validations</p>
                    <p class="text-xs text-gray-600">Les données seront synchronisées plus tard</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-3">
                  <span class="text-xl">📸</span>
                  <div>
                    <p class="font-medium text-sm">Prendre des photos</p>
                    <p class="text-xs text-gray-600">Stockées localement en attendant la sync</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-3">
                  <span class="text-xl">📊</span>
                  <div>
                    <p class="font-medium text-sm">Voir les statistiques</p>
                    <p class="text-xs text-gray-600">Basées sur les données en cache</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Données en attente de synchronisation -->
        @if (pendingSync().length > 0) {
          <div class="card mb-8">
            <div class="card-header">
              <h3 class="card-title">⏳ En attente de synchronisation</h3>
              <p class="card-subtitle">
                {{ pendingSync().length }} élément(s) seront envoyés lors de la reconnexion
              </p>
            </div>
            <div class="card-body">
              <div class="space-y-2">
                @for (item of pendingSync(); track item.id) {
                  <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div class="flex items-center gap-2">
                      <span>{{ getItemTypeIcon(item.type) }}</span>
                      <span class="text-sm">{{ item.description }}</span>
                    </div>
                    <span class="text-xs text-gray-500">{{ formatTimestamp(item.timestamp) }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
        
        <!-- Conseils -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💡 Conseils pour le mode hors ligne</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Optimiser l'utilisation</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Consultez les données en cache régulièrement</li>
                  <li>• Prenez des photos pour documenter les tâches</li>
                  <li>• Validez les tâches terminées</li>
                  <li>• Économisez la batterie si possible</li>
                </ul>
              </div>
              
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Lors de la reconnexion</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Les données seront automatiquement synchronisées</li>
                  <li>• Les photos seront uploadées</li>
                  <li>• Vous recevrez une confirmation</li>
                  <li>• Les nouvelles données seront téléchargées</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OfflineComponent implements OnInit, OnDestroy {
  // Signals d'état
  readonly isOnline = signal(navigator.onLine);
  readonly checkingConnection = signal(false);
  readonly lastOnline = signal<Date | null>(null);
  readonly cachedData = signal({
    sessions: 5,
    tasks: 23,
    photos: 12
  });
  readonly pendingSync = signal([
    {
      id: '1',
      type: 'task_validation',
      description: 'Validation nettoyage salle d\'activités',
      timestamp: new Date(Date.now() - 30000)
    },
    {
      id: '2',
      type: 'photo',
      description: 'Photo avant/après sanitaires',
      timestamp: new Date(Date.now() - 120000)
    }
  ]);
  
  private onlineListener?: () => void;
  private offlineListener?: () => void;
  
  ngOnInit(): void {
    this.setupConnectionListeners();
    
    // Initialiser la dernière connexion si en ligne
    if (navigator.onLine) {
      this.lastOnline.set(new Date());
    }
  }
  
  ngOnDestroy(): void {
    // Nettoyer les listeners
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }
  }
  
  private setupConnectionListeners(): void {
    this.onlineListener = () => {
      this.isOnline.set(true);
      this.lastOnline.set(new Date());
    };
    
    this.offlineListener = () => {
      this.isOnline.set(false);
    };
    
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }
  
  async checkConnection(): Promise<void> {
    this.checkingConnection.set(true);
    
    try {
      // Essayer une requête vers notre API
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        this.isOnline.set(true);
        this.lastOnline.set(new Date());
      } else {
        this.isOnline.set(false);
      }
    } catch {
      this.isOnline.set(false);
    } finally {
      this.checkingConnection.set(false);
    }
  }
  
  formatLastOnline(): string {
    const date = this.lastOnline();
    if (!date) return 'Inconnue';
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  }
  
  getItemTypeIcon(type: string): string {
    const icons = {
      'task_validation': '✅',
      'photo': '📸',
      'note': '📝',
      'session': '📋'
    };
    return icons[type as keyof typeof icons] || '📄';
  }
}