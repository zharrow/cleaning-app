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
 * Interface pour les formulaires de création/édition
 */
interface TaskTemplateForm {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly estimated_duration: number;
}

/**
 * Interface pour les modals
 */
interface TemplateModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly template: TaskTemplate | null;
}

/**
 * Interface pour les filtres
 */
interface TemplateFilters {
  category: string;
}

/**
 * Composant de gestion des modèles de tâches
 * Permet aux managers de créer et modifier les modèles de tâches réutilisables
 */
@Component({
  selector: 'app-manage-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './manage-tasks.component.html',
  styleUrl: './manage-tasks.component.css'
})
export class ManageTasksComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    // Force le chargement initial des données
    console.log('📋 ManageTasksComponent - Démarrage du composant');
    this.apiService.taskTemplates.reload();
    this.apiService.assignedTasks.reload();
    this.apiService.rooms.reload();
    this.taskService.loadAllData();
  }

  // Signals d'état
  readonly openMenuId = signal<string | null>(null);
  readonly savingTemplate = signal(false);
  readonly searchQuery = signal('');

  // Modales de confirmation
  readonly deleteTemplateModal = signal<{
    isOpen: boolean;
    template: TaskTemplate | null;
    isLoading: boolean;
  }>({ isOpen: false, template: null, isLoading: false });


  // Filtres
  readonly templateFilters = signal<TemplateFilters>({ category: '' });

  // Modals
  readonly templateModal = signal<TemplateModal>({
    isOpen: false,
    mode: 'create',
    template: null
  });


  // Formulaires
  readonly templateForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    category: ['', [Validators.required]],
    estimated_duration: [15, [Validators.required, Validators.min(1), Validators.max(120)]]
  });


  // Computed signals depuis l'API
  readonly taskTemplates = computed(() => this.apiService.taskTemplates.value() || []);
  readonly assignedTasks = computed(() => this.apiService.assignedTasks.value() || []);
  readonly isLoading = computed(() => this.apiService.taskTemplates.isLoading());

  // Computed pour les statistiques
  readonly categoriesCount = computed(() => {
    const categories = new Set(this.taskTemplates().map(t => t.category));
    return categories.size;
  });

  readonly usedTemplatesCount = computed(() => {
    const usedTemplateIds = new Set(this.assignedTasks().map(a => a.task_template_id));
    return usedTemplateIds.size;
  });

  readonly averageDuration = computed(() => {
    const templates = this.taskTemplates();
    if (templates.length === 0) return 0;
    const total = templates.reduce((sum, t) => sum + t.estimated_duration, 0);
    return Math.round(total / templates.length);
  });

  // Computed pour les options de filtres
  readonly availableCategories = computed(() => {
    const categories = new Set(this.taskTemplates().map(t => t.category));
    return Array.from(categories).sort();
  });


  // Données filtrées
  readonly filteredTemplates = computed(() => {
    let templates = this.taskTemplates();
    const filters = this.templateFilters();
    const search = this.searchQuery().toLowerCase();

    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (search) {
      templates = templates.filter(t => 
        (t.name || '').toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        (t.category || '').toLowerCase().includes(search)
      );
    }

    return templates.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });


  // Configuration des modales de confirmation
  readonly deleteTemplateConfig = computed(() => {
    const modal = this.deleteTemplateModal();
    const template = modal.template;
    const usageCount = template ? this.getTemplateUsageCount(template.id) : 0;
    
    return {
      title: 'Supprimer le modèle de tâche',
      message: `Êtes-vous sûr de vouloir supprimer le modèle "${template?.name || ''}" ?\n\nCette action est irréversible.${
        usageCount > 0 ? ` ⚠️ Ce modèle est actuellement utilisé dans ${usageCount} assignation(s).` : ''
      }`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger' as const,
      icon: '🗑️'
    };
  });



  /**
   * Gestion des menus
   */
  toggleTemplateMenu(templateId: string): void {
    this.openMenuId.update(id => id === templateId ? null : templateId);
  }

  /**
   * Gestion des filtres - Méthodes corrigées
   */
  updateTemplateFilter(field: keyof TemplateFilters, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    this.templateFilters.update(filters => ({
      ...filters,
      [field]: value
    }));
  }


  updateSearchQuery(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  resetTemplateFilters(): void {
    this.templateFilters.set({ category: '' });
    this.searchQuery.set('');
  }


  /**
   * Actions sur les modèles
   */
  openTemplateModal(mode: 'create' | 'edit', template?: TaskTemplate): void {
    this.templateModal.set({
      isOpen: true,
      mode,
      template: template || null
    });

    if (mode === 'edit' && template) {
      this.templateForm.patchValue({
        name: template.name,
        description: template.description || '',
        category: template.category,
        estimated_duration: template.estimated_duration
      });
    } else {
      this.templateForm.reset();
    }
  }

  closeTemplateModal(): void {
    this.templateModal.set({
      isOpen: false,
      mode: 'create',
      template: null
    });
    this.templateForm.reset();
  }

  async saveTemplate(): Promise<void> {
    if (this.templateForm.invalid || this.savingTemplate()) return;

    this.savingTemplate.set(true);
    try {
      const formValue = this.templateForm.getRawValue();
      const templateData: TaskTemplateForm = {
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        estimated_duration: formValue.estimated_duration
      };

      if (this.templateModal().mode === 'create') {
        await this.apiService.createTaskTemplate(templateData);
      } else {
        const templateId = this.templateModal().template?.id;
        if (templateId) {
          await this.apiService.updateTaskTemplate(templateId, templateData);
        }
      }

      this.closeTemplateModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.savingTemplate.set(false);
    }
  }

  editTemplate(template: TaskTemplate): void {
    this.openTemplateModal('edit', template);
    this.openMenuId.set(null);
  }

  duplicateTemplate(template: TaskTemplate): void {
    // Ouvrir d'abord le modal en mode create
    this.templateModal.set({
      isOpen: true,
      mode: 'create',
      template: null
    });

    // Puis pré-remplir le formulaire avec les données de la tâche à dupliquer
    this.templateForm.patchValue({
      name: `${template.name} (copie)`,
      description: template.description || '',
      category: template.category,
      estimated_duration: template.estimated_duration
    });

    this.openMenuId.set(null);
  }

  openDeleteTemplateModal(template: TaskTemplate): void {
    const usageCount = this.getTemplateUsageCount(template.id);
    
    this.deleteTemplateModal.set({
      isOpen: true,
      template,
      isLoading: false
    });
    this.openMenuId.set(null);
  }

  closeDeleteTemplateModal(): void {
    this.deleteTemplateModal.set({
      isOpen: false,
      template: null,
      isLoading: false
    });
  }

  async confirmDeleteTemplate(): Promise<void> {
    const modal = this.deleteTemplateModal();
    if (!modal.template) return;

    this.deleteTemplateModal.update(m => ({ ...m, isLoading: true }));

    try {
      console.log('🗑️ Suppression du modèle de tâche:', modal.template.id);
      await this.apiService.deleteTaskTemplate(modal.template.id);
      console.log('✅ Modèle de tâche supprimé avec succès');
      this.closeDeleteTemplateModal();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du modèle:', error);
      this.deleteTemplateModal.update(m => ({ ...m, isLoading: false }));
      alert('Erreur lors de la suppression du modèle de tâche');
    }
  }

  getTemplateUsageCount(templateId: string): number {
    return this.assignedTasks().filter(a => a.task_template_id === templateId).length;
  }


}