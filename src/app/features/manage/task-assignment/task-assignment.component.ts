import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ApiService,
  type TaskTemplate,
  type AssignedTask,
  type Room
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService, Performer } from '../../tasks/task.service';
import { ConfirmationModalComponent, type ConfirmationConfig } from '../../../shared/components/confirmation-modal.component';

/**
 * Interface pour le formulaire d'assignation
 */
interface TaskAssignmentForm {
  room_id: string;
  task_template_id: string;
  default_performer_id: string;
  frequency_days: {
    type: 'daily' | 'weekly' | 'monthly';
    times_per_day: number;
    days: number[];
  };
  times_per_day: number;
  suggested_time?: string;
}

/**
 * Interface pour les filtres
 */
interface AssignmentFilters {
  room: string;
  category: string;
  frequency: string;
  status: 'all' | 'active' | 'inactive';
  performer: string;
}

/**
 * Interface pour les modals
 */
interface AssignmentModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly assignment: AssignedTask | null;
}

/**
 * Composant dédié à l'assignation des tâches
 * Séparé de la gestion des modèles de tâches
 */
@Component({
  selector: 'app-task-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './task-assignment.component.html',
  styleUrl: './task-assignment.component.css'
})
export class TaskAssignmentComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    // Force le chargement initial des données
    console.log('📌 TaskAssignmentComponent - Démarrage du composant');
    this.apiService.taskTemplates.reload();
    this.apiService.assignedTasks.reload();
    this.apiService.rooms.reload();
    this.taskService.loadAllData();
  }

  // Signals d'état
  readonly savingAssignment = signal(false);
  readonly togglingStatus = signal(new Set<string>());

  // Filtres
  readonly filters = signal<AssignmentFilters>({
    room: '',
    category: '',
    frequency: '',
    status: 'all',
    performer: ''
  });

  // Modal d'assignation
  readonly assignmentModal = signal<AssignmentModal>({
    isOpen: false,
    mode: 'create',
    assignment: null
  });

  // Modal de suppression
  readonly deleteModal = signal<{
    isOpen: boolean;
    assignment: AssignedTask | null;
    isLoading: boolean;
  }>({ isOpen: false, assignment: null, isLoading: false });

  // Formulaire d'assignation
  readonly assignmentForm = this.fb.nonNullable.group({
    room_id: ['', [Validators.required]],
    task_template_id: ['', [Validators.required]],
    default_performer_id: [''], // Optionnel
    frequency_type: ['daily', [Validators.required]],
    times_per_day: [1, [Validators.required, Validators.min(1)]],
    suggested_time: ['']
  });

  // Computed signals depuis l'API
  readonly taskTemplates = computed(() => this.apiService.taskTemplates.value() || []);
  readonly assignedTasks = computed(() => this.apiService.assignedTasks.value() || []);
  readonly rooms = computed(() => this.apiService.rooms.value() || []);
  readonly isLoading = computed(() =>
    this.apiService.taskTemplates.isLoading() ||
    this.apiService.assignedTasks.isLoading()
  );

  // Computed pour les statistiques
  readonly dailyTasksCount = computed(() =>
    this.assignedTasks().filter(task => task.frequency_days.type === 'daily').length
  );

  readonly coveredRoomsCount = computed(() => {
    const roomsWithTasks = new Set(this.assignedTasks().map(a => a.room_id));
    return roomsWithTasks.size;
  });

  readonly unassignedTasksCount = computed(() =>
    this.assignedTasks().filter(task => !task.default_performer).length
  );

  // Computed pour les options de filtres
  readonly availableCategories = computed(() => {
    const categories = new Set(this.taskTemplates().map(t => t.category));
    return Array.from(categories).sort();
  });

  readonly availablePerformers = computed(() => {
    return this.taskService.performers().filter(p => p.is_active);
  });

  // Données filtrées
  readonly filteredAssignments = computed(() => {
    let assignments = this.assignedTasks();
    const currentFilters = this.filters();

    if (currentFilters.room) {
      assignments = assignments.filter(a => a.room_id === currentFilters.room);
    }

    if (currentFilters.category) {
      assignments = assignments.filter(a => a.task_template.category === currentFilters.category);
    }

    if (currentFilters.frequency) {
      assignments = assignments.filter(a => a.frequency_days.type === currentFilters.frequency);
    }

    if (currentFilters.status !== 'all') {
      const isActive = currentFilters.status === 'active';
      assignments = assignments.filter(a => a.is_active === isActive);
    }

    if (currentFilters.performer) {
      if (currentFilters.performer === 'unassigned') {
        assignments = assignments.filter(a => !a.default_performer);
      } else {
        assignments = assignments.filter(a => a.default_performer?.id === currentFilters.performer);
      }
    }

    return assignments.sort((a, b) => (a.room?.name || '').localeCompare(b.room?.name || ''));
  });

  // Configuration du modal de confirmation
  readonly deleteConfig = computed(() => {
    const modal = this.deleteModal();
    const assignment = modal.assignment;

    return {
      title: 'Supprimer l\'assignation',
      message: `Êtes-vous sûr de vouloir supprimer l'assignation de la tâche "${assignment?.task_template?.name || ''}" dans la pièce "${assignment?.room?.name || ''}" ?\n\nCette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger' as const,
      icon: '🗑️'
    };
  });

  /**
   * Vérification des filtres actifs
   */
  hasActiveFilters(): boolean {
    const f = this.filters();
    return !!(f.room || f.category || f.frequency || f.status !== 'all' || f.performer);
  }

  /**
   * Gestion des filtres
   */
  updateFilter(field: keyof AssignmentFilters, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    this.filters.update(filters => ({
      ...filters,
      [field]: value
    }));
  }

  resetFilters(): void {
    this.filters.set({
      room: '',
      category: '',
      frequency: '',
      status: 'all',
      performer: ''
    });
  }

  /**
   * Gestion du modal d'assignation
   */
  openAssignmentModal(mode: 'create' | 'edit', assignment?: AssignedTask): void {
    this.assignmentModal.set({
      isOpen: true,
      mode,
      assignment: assignment || null
    });

    if (mode === 'edit' && assignment) {
      this.assignmentForm.patchValue({
        room_id: assignment.room_id || assignment.room.id,
        task_template_id: assignment.task_template_id || assignment.task_template.id,
        default_performer_id: assignment.default_performer_id || assignment.default_performer?.id || '',
        frequency_type: assignment.frequency_days.type,
        times_per_day: assignment.times_per_day,
        suggested_time: assignment.suggested_time || ''
      });
    } else {
      this.assignmentForm.reset({
        frequency_type: 'daily',
        times_per_day: 1
      });
    }
  }

  closeAssignmentModal(): void {
    this.assignmentModal.set({
      isOpen: false,
      mode: 'create',
      assignment: null
    });
    this.assignmentForm.reset();
  }

  async saveAssignment(): Promise<void> {
    if (this.assignmentForm.invalid || this.savingAssignment()) return;

    this.savingAssignment.set(true);
    try {
      const formValue = this.assignmentForm.getRawValue();

      const timesPerDay = formValue.times_per_day || 1;

      const assignmentData = {
        task_template_id: formValue.task_template_id,
        room_id: formValue.room_id,
        default_performer_id: formValue.default_performer_id || '',
        frequency_days: {
          type: formValue.frequency_type as 'daily' | 'weekly' | 'monthly',
          times_per_day: timesPerDay,
          days: this.getFrequencyDays(formValue.frequency_type)
        },
        times_per_day: timesPerDay,
        suggested_time: formValue.suggested_time ? this.parseTimeString(formValue.suggested_time) : undefined
      };

      console.log('Données à envoyer:', assignmentData);

      if (this.assignmentModal().mode === 'create') {
        await this.apiService.assignTask(assignmentData);
      } else {
        const assignmentId = this.assignmentModal().assignment?.id;
        if (assignmentId) {
          await this.apiService.updateAssignedTask(assignmentId, assignmentData);
        }
      }

      this.closeAssignmentModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (error instanceof Error) {
        console.error('Détails de l\'erreur:', error.message);
      }
    } finally {
      this.savingAssignment.set(false);
    }
  }

  /**
   * Actions sur les assignations
   */
  editAssignment(assignment: AssignedTask): void {
    this.openAssignmentModal('edit', assignment);
  }

  async toggleAssignmentStatus(assignment: AssignedTask): Promise<void> {
    const currentToggling = this.togglingStatus();
    if (currentToggling.has(assignment.id)) return;

    this.togglingStatus.update(set => new Set([...set, assignment.id]));
    try {
      // TODO: Implémenter le toggle du statut dans l'API
      console.log('Toggle status for:', assignment.id);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      this.togglingStatus.update(set => {
        const newSet = new Set(set);
        newSet.delete(assignment.id);
        return newSet;
      });
    }
  }

  openDeleteModal(assignment: AssignedTask): void {
    this.deleteModal.set({
      isOpen: true,
      assignment,
      isLoading: false
    });
  }

  closeDeleteModal(): void {
    this.deleteModal.set({
      isOpen: false,
      assignment: null,
      isLoading: false
    });
  }

  async confirmDelete(): Promise<void> {
    const modal = this.deleteModal();
    if (!modal.assignment) return;

    this.deleteModal.update(m => ({ ...m, isLoading: true }));

    try {
      console.log('🗑️ Suppression de la tâche assignée:', modal.assignment.id);
      await this.apiService.deleteAssignedTask(modal.assignment.id);
      console.log('✅ Tâche assignée supprimée avec succès');
      this.closeDeleteModal();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la tâche assignée:', error);
      this.deleteModal.update(m => ({ ...m, isLoading: false }));
      alert('Erreur lors de la suppression de la tâche assignée');
    }
  }

  /**
   * Utilitaires d'affichage
   */
  getFrequencyLabel(frequency: string): string {
    const labels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  }

  getFrequencyBadgeClass(frequency: string): string {
    const classes = {
      daily: 'badge-success',
      weekly: 'badge-warning',
      monthly: 'badge-primary'
    };
    return classes[frequency as keyof typeof classes] || 'badge-gray';
  }

  /**
   * Génère le tableau des jours selon la fréquence
   */
  getFrequencyDays(frequencyType: string): number[] {
    switch (frequencyType) {
      case 'daily':
        return [0, 1, 2, 3, 4, 5, 6]; // Tous les jours
      case 'weekly':
        return [1]; // Lundi par défaut
      case 'monthly':
        return [1]; // Premier jour du mois
      default:
        return [1];
    }
  }

  /**
   * Convertit une string de time HTML en format attendu par l'API
   */
  parseTimeString(timeString: string): string {
    return timeString; // Format "HH:mm" déjà correct
  }
}