// ========================================
// Composant Gestion des pièces Angular 19
// src/app/features/manage/manage-rooms/manage-rooms.component.ts
// ========================================
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, type Room } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour les formulaires
 */
interface RoomForm {
  readonly name: string;
  readonly description: string;
  readonly order: number;
}

/**
 * Interface pour les modals
 */
interface RoomModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly room: Room | null;
}

/**
 * Interface pour les statistiques de pièce
 */
interface RoomStats {
  readonly id: string;
  readonly name: string;
  readonly assignedTasksCount: number;
  readonly dailyTasksCount: number;
  readonly averageDuration: number;
  readonly lastActivity?: string;
}

/**
 * Composant de gestion des pièces
 * Permet de créer, modifier et organiser les pièces de la crèche
 */
@Component({
  selector: 'app-manage-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Gestion des pièces</h1>
            <p class="page-subtitle">
              Organisez les espaces de nettoyage de votre établissement
            </p>
          </div>
          
          <!-- Actions principales -->
          <div class="flex items-center gap-3">
            <button 
              class="btn btn-secondary"
              (click)="reorderRooms()"
              [disabled]="rooms().length < 2"
            >
              <span class="text-lg">🔄</span>
              Réorganiser
            </button>
            <button 
              class="btn btn-primary"
              (click)="openRoomModal('create')"
            >
              <span class="text-lg">🏠</span>
              Nouvelle pièce
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total des pièces</p>
                <p class="text-2xl font-bold text-gray-900">{{ rooms().length }}</p>
              </div>
              <span class="text-3xl">🏠</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Tâches assignées</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalAssignedTasks() }}</p>
              </div>
              <span class="text-3xl">📋</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Durée totale/jour</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalDailyDuration() }}min</p>
              </div>
              <span class="text-3xl">⏱️</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Moyenne/pièce</p>
                <p class="text-2xl font-bold text-gray-900">{{ averageTasksPerRoom() }}</p>
              </div>
              <span class="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des pièces -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-text mb-2"></div>
                <div class="skeleton skeleton-text w-3/4 mb-4"></div>
                <div class="skeleton skeleton-button"></div>
              </div>
            </div>
          }
        </div>
      } @else if (sortedRooms().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (roomStat of sortedRooms(); track roomStat.id) {
            <div 
              class="card hover-lift animate-fade-in"
              [attr.data-room-id]="roomStat.id"
            >
              <div class="card-body">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="font-semibold text-gray-900">{{ roomStat.name }}</h3>
                      <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        #{{ getRoomOrder(roomStat.id) }}
                      </span>
                    </div>
                    
                    @if (getRoomDescription(roomStat.id)) {
                      <p class="text-sm text-gray-600 mb-3">
                        {{ getRoomDescription(roomStat.id) }}
                      </p>
                    }
                    
                    <!-- Statistiques de la pièce -->
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Tâches assignées</span>
                        <span class="font-medium text-gray-900">{{ roomStat.assignedTasksCount }}</span>
                      </div>
                      
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Tâches quotidiennes</span>
                        <span class="font-medium text-gray-900">{{ roomStat.dailyTasksCount }}</span>
                      </div>
                      
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Durée estimée/jour</span>
                        <span class="font-medium text-gray-900">{{ roomStat.averageDuration }}min</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Menu actions -->
                  <div class="relative">
                    <button 
                      class="btn btn-ghost btn-icon btn-sm"
                      (click)="toggleRoomMenu(roomStat.id)"
                    >
                      ⋮
                    </button>
                    
                    @if (openMenuId() === roomStat.id) {
                      <div class="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                        <div class="py-2">
                          <button 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            (click)="editRoom(roomStat.id)"
                          >
                            ✏️ Modifier
                          </button>
                          <button 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            (click)="viewRoomTasks(roomStat.id)"
                          >
                            📋 Voir les tâches
                          </button>
                          <button 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            (click)="duplicateRoom(roomStat.id)"
                          >
                            📋 Dupliquer
                          </button>
                          <hr class="my-1" />
                          <button 
                            class="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
                            (click)="deleteRoom(roomStat.id)"
                            [disabled]="roomStat.assignedTasksCount > 0"
                          >
                            🗑️ Supprimer
                          </button>
                          @if (roomStat.assignedTasksCount > 0) {
                            <p class="px-4 py-1 text-xs text-gray-500">
                              Supprimez d'abord les tâches assignées
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
                
                <!-- Indicateur de charge de travail -->
                <div class="border-t border-gray-200 pt-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">Charge de travail</span>
                    <span class="text-sm font-medium" [class]="getWorkloadColor(roomStat.averageDuration)">
                      {{ getWorkloadLabel(roomStat.averageDuration) }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all"
                      [class]="getWorkloadBarColor(roomStat.averageDuration)"
                      [style.width.%]="getWorkloadPercentage(roomStat.averageDuration)"
                    ></div>
                  </div>
                </div>
                
                <!-- Actions rapides -->
                <div class="flex gap-2 mt-4">
                  <button 
                    class="btn btn-secondary btn-sm flex-1"
                    (click)="editRoom(roomStat.id)"
                  >
                    ✏️ Modifier
                  </button>
                  <button 
                    class="btn btn-primary btn-sm flex-1"
                    (click)="viewRoomTasks(roomStat.id)"
                  >
                    📋 Tâches
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Aucune pièce -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">🏠</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucune pièce configurée
            </h3>
            <p class="text-gray-600 mb-6">
              Commencez par créer les différents espaces de votre établissement.
            </p>
            <button 
              class="btn btn-primary"
              (click)="openRoomModal('create')"
            >
              Créer ma première pièce
            </button>
          </div>
        </div>
      }

      <!-- Guide de configuration -->
      @if (rooms().length > 0 && rooms().length < 3) {
        <div class="mt-8">
          <div class="card border-primary-200 bg-primary-50">
            <div class="card-body">
              <div class="flex items-start gap-4">
                <span class="text-3xl">💡</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-primary-900 mb-2">
                    Conseil pour une organisation optimale
                  </h3>
                  <p class="text-primary-700 mb-4">
                    Pour une micro-crèche, nous recommandons de créer au minimum ces espaces :
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    @for (suggestion of roomSuggestions(); track suggestion.name) {
                      <div class="bg-white p-3 rounded-lg">
                        <div class="flex items-center gap-2 mb-1">
                          <span>{{ suggestion.icon }}</span>
                          <span class="font-medium text-gray-900">{{ suggestion.name }}</span>
                        </div>
                        <p class="text-sm text-gray-600">{{ suggestion.description }}</p>
                      </div>
                    }
                  </div>
                  <button 
                    class="btn btn-primary btn-sm mt-4"
                    (click)="createSuggestedRooms()"
                    [disabled]="creatingSuggested()"
                  >
                    @if (creatingSuggested()) {
                      <div class="spinner spinner-sm"></div>
                    }
                    Créer ces pièces automatiquement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal Pièce -->
    @if (roomModal().isOpen) {
      <div class="modal-overlay" (click)="closeRoomModal()">
        <div class="modal-content max-w-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ roomModal().mode === 'create' ? 'Créer une pièce' : 'Modifier la pièce' }}
            </h3>
            <button class="modal-close" (click)="closeRoomModal()">✕</button>
          </div>
          
          <form [formGroup]="roomForm" (ngSubmit)="saveRoom()">
            <div class="modal-body">
              <div class="space-y-4">
                
                <div class="form-group">
                  <label class="form-label required">Nom de la pièce</label>
                  <input 
                    type="text"
                    class="form-input"
                    formControlName="name"
                    placeholder="ex: Salle d'activités"
                  />
                  @if (roomForm.get('name')?.invalid && roomForm.get('name')?.touched) {
                    <div class="form-error">Le nom est requis</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea 
                    class="form-input form-textarea"
                    formControlName="description"
                    placeholder="Description de la pièce et de ses spécificités..."
                    rows="3"
                  ></textarea>
                  <div class="form-help">
                    Décrivez les équipements spéciaux ou consignes particulières
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Ordre d'affichage</label>
                  <input 
                    type="number"
                    class="form-input"
                    formControlName="order"
                    min="1"
                    placeholder="1"
                  />
                  <div class="form-help">
                    Définit l'ordre dans lequel les pièces apparaissent dans l'application
                  </div>
                  @if (roomForm.get('order')?.invalid && roomForm.get('order')?.touched) {
                    <div class="form-error">L'ordre doit être un nombre positif</div>
                  }
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button 
                type="button"
                class="btn btn-secondary"
                (click)="closeRoomModal()"
                [disabled]="savingRoom()"
              >
                Annuler
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                [disabled]="roomForm.invalid || savingRoom()"
              >
                @if (savingRoom()) {
                  <div class="spinner spinner-sm"></div>
                }
                {{ roomModal().mode === 'create' ? 'Créer' : 'Sauvegarder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal de réorganisation -->
    @if (showReorderModal()) {
      <div class="modal-overlay" (click)="closeReorderModal()">
        <div class="modal-content max-w-2xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Réorganiser les pièces</h3>
            <button class="modal-close" (click)="closeReorderModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <p class="text-gray-600 mb-4">
              Faites glisser les pièces pour modifier leur ordre d'affichage.
            </p>
            
            <div class="space-y-2" id="sortable-rooms">
              @for (room of rooms(); track room.id) {
                <div 
                  class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move"
                  [attr.data-room-id]="room.id"
                >
                  <span class="text-gray-400">⋮⋮</span>
                  <span class="font-medium text-gray-900">{{ room.name }}</span>
                  <span class="text-sm text-gray-500 ml-auto">Ordre: {{ room.order }}</span>
                </div>
              }
            </div>
          </div>
          
          <div class="modal-footer">
            <button 
              class="btn btn-secondary"
              (click)="closeReorderModal()"
            >
              Annuler
            </button>
            <button 
              class="btn btn-primary"
              (click)="saveRoomOrder()"
              [disabled]="savingOrder()"
            >
              @if (savingOrder()) {
                <div class="spinner spinner-sm"></div>
              }
              Sauvegarder l'ordre
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .hover-lift {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .cursor-move {
      cursor: move;
    }

    #sortable-rooms .drag-over {
      border: 2px dashed #3B82F6;
      background-color: rgba(59, 130, 246, 0.1);
    }
  `]
})
export class ManageRoomsComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Signals d'état
  private readonly openMenuId = signal<string | null>(null);
  private readonly savingRoom = signal(false);
  private readonly savingOrder = signal(false);
  private readonly creatingSuggested = signal(false);
  private readonly showReorderModal = signal(false);

  // Modal
  readonly roomModal = signal<RoomModal>({
    isOpen: false,
    mode: 'create',
    room: null
  });

  // Formulaire
  readonly roomForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    order: [1, [Validators.required, Validators.min(1)]]
  });

  // Computed signals depuis l'API
  readonly rooms = computed(() => this.apiService.rooms.value() || []);
  readonly assignedTasks = computed(() => this.apiService.assignedTasks.value() || []);
  readonly isLoading = computed(() => this.apiService.rooms.isLoading());

  // Statistiques
  readonly totalAssignedTasks = computed(() => this.assignedTasks().length);

  readonly totalDailyDuration = computed(() => {
    return this.assignedTasks()
      .filter(task => task.frequency === 'daily')
      .reduce((total, task) => total + task.task_template.estimated_duration, 0);
  });

  readonly averageTasksPerRoom = computed(() => {
    const roomCount = this.rooms().length;
    return roomCount > 0 ? Math.round(this.totalAssignedTasks() / roomCount * 10) / 10 : 0;
  });

  // Données enrichies pour l'affichage
  readonly sortedRooms = computed((): RoomStats[] => {
    return this.rooms()
      .map(room => {
        const roomTasks = this.assignedTasks().filter(task => task.room_id === room.id);
        const dailyTasks = roomTasks.filter(task => task.frequency === 'daily');
        
        return {
          id: room.id,
          name: room.name,
          assignedTasksCount: roomTasks.length,
          dailyTasksCount: dailyTasks.length,
          averageDuration: dailyTasks.reduce((total, task) => 
            total + task.task_template.estimated_duration, 0
          ),
          lastActivity: room.updated_at
        };
      })
      .sort((a, b) => this.getRoomOrder(a.id) - this.getRoomOrder(b.id));
  });

  // Suggestions de pièces
  readonly roomSuggestions = signal([
    {
      name: 'Salle d\'activités',
      description: 'Espace principal de jeu et d\'éveil',
      icon: '🎨',
      order: 1
    },
    {
      name: 'Salle de repos',
      description: 'Zone de sieste et de calme',
      icon: '😴',
      order: 2
    },
    {
      name: 'Espace repas',
      description: 'Cuisine et salle à manger',
      icon: '🍽️',
      order: 3
    },
    {
      name: 'Sanitaires',
      description: 'Toilettes et espace de change',
      icon: '🚿',
      order: 4
    },
    {
      name: 'Entrée/Couloir',
      description: 'Hall d\'accueil et circulation',
      icon: '🚪',
      order: 5
    }
  ]);

  /**
   * Gestion des menus
   */
  toggleRoomMenu(roomId: string): void {
    this.openMenuId.update(id => id === roomId ? null : roomId);
  }

  /**
   * Actions sur les pièces
   */
  openRoomModal(mode: 'create' | 'edit', roomId?: string): void {
    const room = roomId ? this.rooms().find(r => r.id === roomId) : null;
    
    this.roomModal.set({
      isOpen: true,
      mode,
      room
    });

    if (mode === 'edit' && room) {
      this.roomForm.patchValue({
        name: room.name,
        description: room.description || '',
        order: room.order
      });
    } else {
      // Pour une nouvelle pièce, suggérer le prochain ordre
      const maxOrder = Math.max(...this.rooms().map(r => r.order), 0);
      this.roomForm.patchValue({
        name: '',
        description: '',
        order: maxOrder + 1
      });
    }
  }

  closeRoomModal(): void {
    this.roomModal.set({
      isOpen: false,
      mode: 'create',
      room: null
    });
    this.roomForm.reset();
  }

  async saveRoom(): Promise<void> {
    if (this.roomForm.invalid || this.savingRoom()) return;

    this.savingRoom.set(true);
    try {
      const formValue = this.roomForm.getRawValue();
      const roomData: RoomForm = {
        name: formValue.name,
        description: formValue.description,
        order: formValue.order
      };

      if (this.roomModal().mode === 'create') {
        await this.apiService.createRoom(roomData);
      } else {
        const roomId = this.roomModal().room?.id;
        if (roomId) {
          await this.apiService.updateRoom(roomId, roomData);
        }
      }

      this.closeRoomModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.savingRoom.set(false);
    }
  }

  editRoom(roomId: string): void {
    this.openRoomModal('edit', roomId);
    this.openMenuId.set(null);
  }

  duplicateRoom(roomId: string): void {
    const room = this.rooms().find(r => r.id === roomId);
    if (!room) return;

    const maxOrder = Math.max(...this.rooms().map(r => r.order), 0);
    this.roomForm.patchValue({
      name: `${room.name} (copie)`,
      description: room.description || '',
      order: maxOrder + 1
    });
    this.openRoomModal('create');
    this.openMenuId.set(null);
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = this.rooms().find(r => r.id === roomId);
    if (!room) return;

    const assignedTasksCount = this.assignedTasks().filter(t => t.room_id === roomId).length;
    if (assignedTasksCount > 0) {
      alert('Impossible de supprimer cette pièce car elle a des tâches assignées. Supprimez d\'abord les tâches.');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la pièce "${room.name}" ?`)) return;

    try {
      await this.apiService.deleteRoom(roomId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
    this.openMenuId.set(null);
  }

  viewRoomTasks(roomId: string): void {
    // TODO: Naviguer vers la vue des tâches de cette pièce
    console.log('View tasks for room:', roomId);
    this.openMenuId.set(null);
  }

  /**
   * Gestion de l'ordre des pièces
   */
  reorderRooms(): void {
    this.showReorderModal.set(true);
  }

  closeReorderModal(): void {
    this.showReorderModal.set(false);
  }

  async saveRoomOrder(): Promise<void> {
    if (this.savingOrder()) return;

    this.savingOrder.set(true);
    try {
      // TODO: Implémenter la sauvegarde de l'ordre
      console.log('Save room order');
      this.closeReorderModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ordre:', error);
    } finally {
      this.savingOrder.set(false);
    }
  }

  /**
   * Création automatique des pièces suggérées
   */
  async createSuggestedRooms(): Promise<void> {
    if (this.creatingSuggested()) return;

    this.creatingSuggested.set(true);
    try {
      const suggestions = this.roomSuggestions();
      const existingNames = new Set(this.rooms().map(r => r.name.toLowerCase()));

      for (const suggestion of suggestions) {
        // Éviter de créer des doublons
        if (!existingNames.has(suggestion.name.toLowerCase())) {
          await this.apiService.createRoom({
            name: suggestion.name,
            description: suggestion.description,
            order: suggestion.order
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création automatique:', error);
    } finally {
      this.creatingSuggested.set(false);
    }
  }

  /**
   * Utilitaires
   */
  getRoomOrder(roomId: string): number {
    const room = this.rooms().find(r => r.id === roomId);
    return room?.order || 0;
  }

  getRoomDescription(roomId: string): string {
    const room = this.rooms().find(r => r.id === roomId);
    return room?.description || '';
  }

  getWorkloadLabel(duration: number): string {
    if (duration === 0) return 'Aucune tâche';
    if (duration <= 15) return 'Légère';
    if (duration <= 30) return 'Modérée';
    if (duration <= 60) return 'Importante';
    return 'Très importante';
  }

  getWorkloadColor(duration: number): string {
    if (duration === 0) return 'text-gray-500';
    if (duration <= 15) return 'text-success-600';
    if (duration <= 30) return 'text-warning-600';
    if (duration <= 60) return 'text-orange-600';
    return 'text-danger-600';
  }

  getWorkloadBarColor(duration: number): string {
    if (duration === 0) return 'bg-gray-300';
    if (duration <= 15) return 'bg-success-500';
    if (duration <= 30) return 'bg-warning-500';
    if (duration <= 60) return 'bg-orange-500';
    return 'bg-danger-500';
  }

  getWorkloadPercentage(duration: number): number {
    const maxDuration = 90; // 1h30 considéré comme 100%
    return Math.min((duration / maxDuration) * 100, 100);
  }
}