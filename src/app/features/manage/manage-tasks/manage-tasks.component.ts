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
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Modèles de tâches</h1>
            <p class="page-subtitle">
              Créez et organisez les modèles de tâches réutilisables
            </p>
          </div>

          <!-- Actions principales -->
          <div class="flex items-center gap-3">
            <button
              class="btn btn-primary"
              (click)="openTemplateModal('create')"
            >
              <span class="text-lg">📝</span>
              Nouveau modèle
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total modèles</p>
                <p class="text-2xl font-bold text-gray-900">{{ taskTemplates().length }}</p>
              </div>
              <span class="text-3xl">📋</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Catégories</p>
                <p class="text-2xl font-bold text-gray-900">{{ categoriesCount() }}</p>
              </div>
              <span class="text-3xl">🏷️</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Utilisés</p>
                <p class="text-2xl font-bold text-gray-900">{{ usedTemplatesCount() }}</p>
              </div>
              <span class="text-3xl">✅</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Durée moyenne</p>
                <p class="text-2xl font-bold text-gray-900">{{ averageDuration() }}min</p>
              </div>
              <span class="text-3xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres pour modèles -->
      <div class="card mb-6">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label text-sm">Catégorie</label>
              <select
                class="form-input form-select"
                [value]="templateFilters().category"
                (change)="updateTemplateFilter('category', $event)"
              >
                <option value="">Toutes les catégories</option>
                @for (category of availableCategories(); track category) {
                  <option [value]="category">{{ category }}</option>
                }
              </select>
            </div>

            <div>
              <label class="form-label text-sm">Recherche</label>
              <input
                type="text"
                class="form-input"
                [value]="searchQuery()"
                (input)="updateSearchQuery($event)"
                placeholder="Rechercher un modèle..."
              />
            </div>

            <div class="flex items-end">
              <button
                class="btn btn-secondary"
                (click)="resetTemplateFilters()"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des modèles -->
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
      } @else if (filteredTemplates().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (template of filteredTemplates(); track template.id) {
            <div class="card hover-lift animate-fade-in" [class.overflow-visible]="openMenuId() === template.id">
              <div class="card-body">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 mb-2">
                      {{ template.name }}
                    </h3>
                    @if (template.description) {
                      <p class="text-sm text-gray-600 mb-3">
                        {{ template.description }}
                      </p>
                    }

                    <div class="flex items-center gap-4 text-sm text-gray-500">
                      <span class="rounded badge-primary">{{ template.category }}</span>
                      <span>⏱️ {{ template.estimated_duration }}min</span>
                    </div>
                  </div>

                  <!-- Menu actions -->
                  <div class="relative dropdown-container">
                    <button
                      class="btn btn-ghost btn-icon btn-sm"
                      (click)="toggleTemplateMenu(template.id)"
                    >
                      ⋮
                    </button>

                    @if (openMenuId() === template.id) {
                      <div class="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 dropdown-menu">
                        <div class="py-2">
                          <button
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            (click)="editTemplate(template)"
                          >
                            <span class="text-lg">✏️</span>
                            <span>Modifier</span>
                          </button>
                          <button
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            (click)="duplicateTemplate(template)"
                          >
                            <span class="text-lg">📋</span>
                            <span>Dupliquer</span>
                          </button>
                          <button
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                            (click)="openDeleteTemplateModal(template)"
                          >
                            <span class="text-lg">🗑️</span>
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Statistiques d'utilisation -->
                <div class="border-t border-gray-200 pt-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Utilisé dans :</span>
                    <span class="font-medium text-gray-900">
                      {{ getTemplateUsageCount(template.id) }} pièce(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">📝</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucun modèle trouvé
            </h3>
            <p class="text-gray-600 mb-4">
              Créez votre premier modèle de tâche pour commencer.
            </p>
            <button
              class="btn btn-primary"
              (click)="openTemplateModal('create')"
            >
              Créer un modèle
            </button>
          </div>
        </div>
      }

    </div>

    <!-- Modal Modèle de tâche -->
    @if (templateModal().isOpen) {
      <div class="modal-overlay" (click)="closeTemplateModal()">
        <div class="modal-content" style="width: 800px; max-width: 90vw;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ templateModal().mode === 'create' ? 'Créer un modèle' : 'Modifier le modèle' }}
            </h3>
            <button class="modal-close" (click)="closeTemplateModal()">✕</button>
          </div>
          
          <form [formGroup]="templateForm" (ngSubmit)="saveTemplate()">
            <div class="modal-body">
              <div class="space-y-4">
                
                <div class="form-group">
                  <label class="form-label required">Nom de la tâche</label>
                  <input 
                    type="text"
                    class="form-input"
                    formControlName="name"
                    placeholder="ex: Nettoyer les vitres"
                  />
                  @if (templateForm.get('name')?.invalid && templateForm.get('name')?.touched) {
                    <div class="form-error">Le nom est requis</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea 
                    class="form-input form-textarea"
                    formControlName="description"
                    placeholder="Description détaillée de la tâche..."
                    rows="3"
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Catégorie</label>
                  <input 
                    type="text"
                    class="form-input"
                    formControlName="category"
                    placeholder="ex: Surfaces, Sol, Mobilier"
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    @for (category of availableCategories(); track category) {
                      <option [value]="category">{{ category }}</option>
                    }
                  </datalist>
                  @if (templateForm.get('category')?.invalid && templateForm.get('category')?.touched) {
                    <div class="form-error">La catégorie est requise</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Durée estimée (minutes)</label>
                  <input 
                    type="number"
                    class="form-input"
                    formControlName="estimated_duration"
                    min="1"
                    max="120"
                    placeholder="15"
                  />
                  @if (templateForm.get('estimated_duration')?.invalid && templateForm.get('estimated_duration')?.touched) {
                    <div class="form-error">
                      La durée doit être entre 1 et 120 minutes
                    </div>
                  }
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button 
                type="button"
                class="btn btn-secondary"
                (click)="closeTemplateModal()"
                [disabled]="savingTemplate()"
              >
                Annuler
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                [disabled]="templateForm.invalid || savingTemplate()"
              >
                @if (savingTemplate()) {
                  <div class="spinner spinner-sm"></div>
                }
                {{ templateModal().mode === 'create' ? 'Créer' : 'Sauvegarder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }


    <!-- Modales de confirmation -->
    <app-confirmation-modal
      [isOpen]="deleteTemplateModal().isOpen"
      [isLoading]="deleteTemplateModal().isLoading"
      [config]="deleteTemplateConfig()"
      (confirm)="confirmDeleteTemplate()"
      (cancel)="closeDeleteTemplateModal()"
    />

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

    /* Fix pour les dropdowns qui sont coupés */
    .card {
      overflow: hidden;
    }
    
    .card.overflow-visible {
      overflow: visible !important;
      z-index: 10;
      position: relative;
    }
    
    .dropdown-container {
      z-index: 20;
      position: relative;
    }
    
    .dropdown-menu {
      z-index: 1000 !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      animation: dropdown-appear 0.15s ease-out;
    }

    @keyframes dropdown-appear {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* S'assurer que les grids ne coupent pas les dropdowns */
    .grid {
      overflow: visible;
    }
  `]
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
    this.templateForm.patchValue({
      name: `${template.name} (copie)`,
      description: template.description || '',
      category: template.category,
      estimated_duration: template.estimated_duration
    });
    this.openTemplateModal('create');
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