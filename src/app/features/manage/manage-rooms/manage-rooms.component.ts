import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService, type Room } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationModalComponent, type ConfirmationConfig } from '../../../shared/components/confirmation-modal.component';

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
  readonly room: Room | null | undefined;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './manage-rooms.component.html',
  styleUrl: './manage-rooms.component.css'
})
export class ManageRoomsComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    // Force le chargement initial des rooms
    console.log('🏠 ManageRoomsComponent - Démarrage du composant');
    this.apiService.rooms.reload();
    this.apiService.assignedTasks.reload();
  }

  // Signals d'état
  readonly openMenuId = signal<string | null>(null);
  readonly savingRoom = signal(false);
  readonly savingOrder = signal(false);
  readonly creatingSuggested = signal(false);
  readonly showReorderModal = signal(false);

  // Modal
  readonly roomModal = signal<RoomModal>({
    isOpen: false,
    mode: 'create',
    room: null
  });

  // Modale de confirmation de suppression
  readonly deleteRoomModal = signal<{
    isOpen: boolean;
    room: Room | null;
    isLoading: boolean;
  }>({ isOpen: false, room: null, isLoading: false });

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
      .filter(task => task.frequency_days.type === 'daily')
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
        const roomTasks = this.assignedTasks().filter(task => task.room.id === room.id);
        const dailyTasks = roomTasks.filter(task => task.frequency_days.type === 'daily');
        
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

  // Configuration de la modale de suppression
  readonly deleteRoomConfig = computed(() => {
    const modal = this.deleteRoomModal();
    const room = modal.room;
    const taskCount = room ? this.getRoomAssignedTasksCount(room.id) : 0;
    
    return {
      title: 'Supprimer la pièce',
      message: `Êtes-vous sûr de vouloir supprimer la pièce "${room?.name || ''}" ?\n\nCette action est irréversible.${
        taskCount > 0 ? `\n\n⚠️ Cette pièce a ${taskCount} tâche(s) assignée(s). Supprimez-les d'abord.` : ''
      }`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger' as const,
      icon: '🗑️'
    };
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

  openDeleteRoomModal(room: Room): void {
    this.deleteRoomModal.set({
      isOpen: true,
      room,
      isLoading: false
    });
    this.openMenuId.set(null);
  }

  openDeleteRoomModalById(roomId: string): void {
    const room = this.rooms().find(r => r.id === roomId);
    if (room) {
      this.openDeleteRoomModal(room);
    }
  }

  closeDeleteRoomModal(): void {
    this.deleteRoomModal.set({
      isOpen: false,
      room: null,
      isLoading: false
    });
  }

  async confirmDeleteRoom(): Promise<void> {
    const modal = this.deleteRoomModal();
    if (!modal.room) return;

    const assignedTasksCount = this.assignedTasks().filter(t => t.room_id === modal.room!.id).length;
    if (assignedTasksCount > 0) {
      alert('Impossible de supprimer cette pièce car elle a des tâches assignées. Supprimez d\'abord les tâches.');
      this.closeDeleteRoomModal();
      return;
    }

    this.deleteRoomModal.update(m => ({ ...m, isLoading: true }));

    try {
      console.log('🗑️ Suppression de la pièce:', modal.room.id);
      await this.apiService.deleteRoom(modal.room.id);
      console.log('✅ Pièce supprimée avec succès');
      this.closeDeleteRoomModal();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la pièce:', error);
      this.deleteRoomModal.update(m => ({ ...m, isLoading: false }));
      alert('Erreur lors de la suppression de la pièce');
    }
  }

  getRoomAssignedTasksCount(roomId: string): number {
    return this.assignedTasks().filter(t => t.room_id === roomId).length;
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