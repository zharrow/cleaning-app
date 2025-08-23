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

/**
 * Interface pour les formulaires de création/édition
 */
interface TaskTemplateForm {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly estimated_duration: number;
}

interface TaskAssignmentForm {
  room_id: string;
  task_template_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  suggested_time?: string;
  default_performer?: string;
}

/**
 * Interface pour les modals
 */
interface TemplateModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly template: TaskTemplate | null;
}

interface AssignmentModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly assignment: AssignedTask | null;
}

/**
 * Interface pour les filtres
 */
interface TaskFilters {
  category: string;
  room: string;
  frequency: string;
  status: 'all' | 'active' | 'inactive';
}

interface TemplateFilters {
  category: string;
}

/**
 * Composant de gestion des tâches
 * Permet aux managers de créer, modifier et assigner des tâches
 */
@Component({
  selector: 'app-manage-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Gestion des tâches</h1>
            <p class="page-subtitle">
              Créez et organisez les tâches de nettoyage
            </p>
          </div>
          
          <!-- Actions principales -->
          <div class="flex items-center gap-3">
            <button 
              class="btn btn-secondary"
              (click)="openTemplateModal('create')"
            >
              <span class="text-lg">📝</span>
              Nouveau modèle
            </button>
            <button 
              class="btn btn-primary"
              (click)="openAssignmentModal('create')"
            >
              <span class="text-lg">📌</span>
              Assigner une tâche
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
                <p class="text-sm text-gray-600">Modèles de tâches</p>
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
                <p class="text-sm text-gray-600">Tâches assignées</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignedTasks().length }}</p>
              </div>
              <span class="text-3xl">📌</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Tâches quotidiennes</p>
                <p class="text-2xl font-bold text-gray-900">{{ dailyTasksCount() }}</p>
              </div>
              <span class="text-3xl">📅</span>
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
      </div>

      <!-- Onglets -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex gap-8">
            <button 
              class="px-1 py-4 border-b-2 font-medium text-sm transition-colors"
              [class]="currentTab() === 'templates' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              (click)="setCurrentTab('templates')"
            >
              Modèles de tâches
            </button>
            <button 
              class="px-1 py-4 border-b-2 font-medium text-sm transition-colors"
              [class]="currentTab() === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              (click)="setCurrentTab('assignments')"
            >
              Assignations
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenu des onglets -->
      
      <!-- Onglet Modèles de tâches -->
      @if (currentTab() === 'templates') {
        
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
              <div class="card hover-lift animate-fade-in">
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
                        <span class="badge badge-primary">{{ template.category }}</span>
                        <span>⏱️ {{ template.estimated_duration }}min</span>
                      </div>
                    </div>
                    
                    <!-- Menu actions -->
                    <div class="relative">
                      <button 
                        class="btn btn-ghost btn-icon btn-sm"
                        (click)="toggleTemplateMenu(template.id)"
                      >
                        ⋮
                      </button>
                      
                      @if (openMenuId() === template.id) {
                        <div class="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <div class="py-2">
                            <button 
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              (click)="editTemplate(template)"
                            >
                              ✏️ Modifier
                            </button>
                            <button 
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              (click)="duplicateTemplate(template)"
                            >
                              📋 Dupliquer
                            </button>
                            <button 
                              class="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
                              (click)="deleteTemplate(template.id)"
                            >
                              🗑️ Supprimer
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
      }

      <!-- Onglet Assignations -->
      @if (currentTab() === 'assignments') {
        
        <!-- Filtres pour assignations -->
        <div class="card mb-6">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="form-label text-sm">Pièce</label>
                <select 
                  class="form-input form-select"
                  [value]="assignmentFilters().room"
                  (change)="updateAssignmentFilter('room', $event)"
                >
                  <option value="">Toutes les pièces</option>
                  @for (room of rooms(); track room.id) {
                    <option [value]="room.id">{{ room.name }}</option>
                  }
                </select>
              </div>
              
              <div>
                <label class="form-label text-sm">Fréquence</label>
                <select 
                  class="form-input form-select"
                  [value]="assignmentFilters().frequency"
                  (change)="updateAssignmentFilter('frequency', $event)"
                >
                  <option value="">Toutes les fréquences</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </div>
              
              <div>
                <label class="form-label text-sm">Statut</label>
                <select 
                  class="form-input form-select"
                  [value]="assignmentFilters().status"
                  (change)="updateAssignmentFilter('status', $event)"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              
              <div class="flex items-end">
                <button 
                  class="btn btn-secondary"
                  (click)="resetAssignmentFilters()"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau des assignations -->
        @if (isLoading()) {
          <div class="card">
            <div class="card-body">
              <div class="space-y-4">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="skeleton skeleton-text"></div>
                }
              </div>
            </div>
          </div>
        } @else if (filteredAssignments().length > 0) {
          <div class="card">
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Tâche</th>
                    <th>Pièce</th>
                    <th>Fréquence</th>
                    <th>Durée</th>
                    <th>Exécutant par défaut</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (assignment of filteredAssignments(); track assignment.id) {
                    <tr>
                      <td>
                        <div>
                          <p class="font-medium text-gray-900">
                            {{ assignment.task_template.name }}
                          </p>
                          <p class="text-sm text-gray-600">
                            {{ assignment.task_template.category }}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span class="font-medium text-gray-900">
                          {{ assignment.room.name }}
                        </span>
                      </td>
                      <td>
                        <span 
                          class="badge"
                          [class]="getFrequencyBadgeClass(assignment.frequency)"
                        >
                          {{ getFrequencyLabel(assignment.frequency) }}
                        </span>
                      </td>
                      <td>
                        <span class="text-gray-600">
                          {{ assignment.task_template.estimated_duration }}min
                        </span>
                      </td>
                      <td>
                        <span class="text-gray-600">
                          {{ assignment.default_performer || '-' }}
                        </span>
                      </td>
                      <td>
                        <span 
                          class="badge"
                          [class]="assignment.is_active ? 'badge-success' : 'badge-gray'"
                        >
                          {{ assignment.is_active ? 'Actif' : 'Inactif' }}
                        </span>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <button 
                            class="btn btn-ghost btn-sm"
                            (click)="editAssignment(assignment)"
                          >
                            ✏️
                          </button>
                          <button 
                            class="btn btn-ghost btn-sm"
                            (click)="toggleAssignmentStatus(assignment)"
                            [disabled]="togglingStatus().has(assignment.id)"
                          >
                            @if (togglingStatus().has(assignment.id)) {
                              <div class="spinner spinner-sm"></div>
                            } @else {
                              {{ assignment.is_active ? '⏸️' : '▶️' }}
                            }
                          </button>
                          <button 
                            class="btn btn-ghost btn-sm text-danger-600"
                            (click)="deleteAssignment(assignment.id)"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <div class="card">
            <div class="card-body text-center py-12">
              <span class="text-6xl mb-4 block">📌</span>
              <h3 class="text-xl font-medium text-gray-900 mb-2">
                Aucune assignation trouvée
              </h3>
              <p class="text-gray-600 mb-4">
                Assignez des tâches aux pièces pour organiser le nettoyage.
              </p>
              <button 
                class="btn btn-primary"
                (click)="openAssignmentModal('create')"
              >
                Assigner une tâche
              </button>
            </div>
          </div>
        }
      }
    </div>

    <!-- Modal Modèle de tâche -->
    @if (templateModal().isOpen) {
      <div class="modal-overlay" (click)="closeTemplateModal()">
        <div class="modal-content max-w-lg" (click)="$event.stopPropagation()">
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

    <!-- Modal Assignation -->
    @if (assignmentModal().isOpen) {
      <div class="modal-overlay" (click)="closeAssignmentModal()">
        <div class="modal-content max-w-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ assignmentModal().mode === 'create' ? 'Assigner une tâche' : 'Modifier l\'assignation' }}
            </h3>
            <button class="modal-close" (click)="closeAssignmentModal()">✕</button>
          </div>
          
          <form [formGroup]="assignmentForm" (ngSubmit)="saveAssignment()">
            <div class="modal-body">
              <div class="space-y-4">
                
                <div class="form-group">
                  <label class="form-label required">Pièce</label>
                  <select class="form-input form-select" formControlName="room_id">
                    <option value="">Sélectionner une pièce</option>
                    @for (room of rooms(); track room.id) {
                      <option [value]="room.id">{{ room.name }}</option>
                    }
                  </select>
                  @if (assignmentForm.get('room_id')?.invalid && assignmentForm.get('room_id')?.touched) {
                    <div class="form-error">Veuillez sélectionner une pièce</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Tâche</label>
                  <select class="form-input form-select" formControlName="task_template_id">
                    <option value="">Sélectionner une tâche</option>
                    @for (template of taskTemplates(); track template.id) {
                      <option [value]="template.id">
                        {{ template.name }} ({{ template.category }})
                      </option>
                    }
                  </select>
                  @if (assignmentForm.get('task_template_id')?.invalid && assignmentForm.get('task_template_id')?.touched) {
                    <div class="form-error">Veuillez sélectionner une tâche</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Fréquence</label>
                  <select class="form-input form-select" formControlName="frequency">
                    <option value="">Sélectionner la fréquence</option>
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                  @if (assignmentForm.get('frequency')?.invalid && assignmentForm.get('frequency')?.touched) {
                    <div class="form-error">Veuillez sélectionner une fréquence</div>
                  }
                </div>
                
                <div class="form-group">
                  <label class="form-label">Heure suggérée</label>
                  <input 
                    type="time"
                    class="form-input"
                    formControlName="suggested_time"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Exécutant par défaut</label>
                  <input 
                    type="text"
                    class="form-input"
                    formControlName="default_performer"
                    placeholder="Nom de l'exécutant habituel"
                    list="performers-list"
                  />
                  <datalist id="performers-list">
                    @for (performer of availablePerformers(); track performer) {
                      <option [value]="performer">{{ performer }}</option>
                    }
                  </datalist>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button 
                type="button"
                class="btn btn-secondary"
                (click)="closeAssignmentModal()"
                [disabled]="savingAssignment()"
              >
                Annuler
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                [disabled]="assignmentForm.invalid || savingAssignment()"
              >
                @if (savingAssignment()) {
                  <div class="spinner spinner-sm"></div>
                }
                {{ assignmentModal().mode === 'create' ? 'Assigner' : 'Sauvegarder' }}
              </button>
            </div>
          </form>
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
  `]
})
export class ManageTasksComponent {
  // Services injectés
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Signals d'état
  readonly currentTab = signal<'templates' | 'assignments'>('templates');
  readonly openMenuId = signal<string | null>(null);
  readonly savingTemplate = signal(false);
  readonly savingAssignment = signal(false);
  readonly togglingStatus = signal(new Set<string>());
  readonly searchQuery = signal('');

  // Filtres - correction avec interfaces dédiées
  readonly templateFilters = signal<TemplateFilters>({ category: '' });
  readonly assignmentFilters = signal<TaskFilters>({
    category: '',
    room: '',
    frequency: '',
    status: 'all'
  });

  // Modals
  readonly templateModal = signal<TemplateModal>({
    isOpen: false,
    mode: 'create',
    template: null
  });

  readonly assignmentModal = signal<AssignmentModal>({
    isOpen: false,
    mode: 'create',
    assignment: null
  });

  // Formulaires
  readonly templateForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    category: ['', [Validators.required]],
    estimated_duration: [15, [Validators.required, Validators.min(1), Validators.max(120)]]
  });

  readonly assignmentForm = this.fb.nonNullable.group({
    room_id: ['', [Validators.required]],
    task_template_id: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    suggested_time: [''],
    default_performer: ['']
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
    this.assignedTasks().filter(task => task.frequency === 'daily').length
  );

  readonly categoriesCount = computed(() => {
    const categories = new Set(this.taskTemplates().map(t => t.category));
    return categories.size;
  });

  // Computed pour les options de filtres
  readonly availableCategories = computed(() => {
    const categories = new Set(this.taskTemplates().map(t => t.category));
    return Array.from(categories).sort();
  });

  readonly availablePerformers = computed(() => {
    const performers = new Set<string>();
    this.assignedTasks().forEach(task => {
      if (task.default_performer) {
        performers.add(task.default_performer);
      }
    });
    // Ajouter quelques performers par défaut
    performers.add('Marie Dupont');
    performers.add('Pierre Martin');
    performers.add('Sophie Bernard');
    return Array.from(performers).sort();
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
        t.name.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filteredAssignments = computed(() => {
    let assignments = this.assignedTasks();
    const filters = this.assignmentFilters();

    if (filters.room) {
      assignments = assignments.filter(a => a.room_id === filters.room);
    }

    if (filters.frequency) {
      assignments = assignments.filter(a => a.frequency === filters.frequency);
    }

    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      assignments = assignments.filter(a => a.is_active === isActive);
    }

    return assignments.sort((a, b) => a.room.name.localeCompare(b.room.name));
  });

  /**
   * Gestion des onglets
   */
  setCurrentTab(tab: 'templates' | 'assignments'): void {
    this.currentTab.set(tab);
    this.openMenuId.set(null);
  }

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

  updateAssignmentFilter(field: keyof TaskFilters, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    this.assignmentFilters.update(filters => ({
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

  resetAssignmentFilters(): void {
    this.assignmentFilters.set({
      category: '',
      room: '',
      frequency: '',
      status: 'all'
    });
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
        // TODO: Implémenter la mise à jour
        console.log('Update template:', templateData);
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

  async deleteTemplate(templateId: string): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      // TODO: Implémenter la suppression
      console.log('Delete template:', templateId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
    this.openMenuId.set(null);
  }

  getTemplateUsageCount(templateId: string): number {
    return this.assignedTasks().filter(a => a.task_template_id === templateId).length;
  }

  /**
   * Actions sur les assignations
   */
  openAssignmentModal(mode: 'create' | 'edit', assignment?: AssignedTask): void {
    this.assignmentModal.set({
      isOpen: true,
      mode,
      assignment: assignment || null
    });

    if (mode === 'edit' && assignment) {
      this.assignmentForm.patchValue({
        room_id: assignment.room_id,
        task_template_id: assignment.task_template_id,
        frequency: assignment.frequency,
        suggested_time: assignment.suggested_time || '',
        default_performer: assignment.default_performer || ''
      });
    } else {
      this.assignmentForm.reset();
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
      // Correction du type de fréquence
      const assignmentData: TaskAssignmentForm = {
        room_id: formValue.room_id,
        task_template_id: formValue.task_template_id,
        frequency: formValue.frequency as 'daily' | 'weekly' | 'monthly',
        suggested_time: formValue.suggested_time || undefined,
        default_performer: formValue.default_performer || undefined
      };

      if (this.assignmentModal().mode === 'create') {
        await this.apiService.assignTask(assignmentData);
      } else {
        // TODO: Implémenter la mise à jour
        console.log('Update assignment:', assignmentData);
      }

      this.closeAssignmentModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.savingAssignment.set(false);
    }
  }

  editAssignment(assignment: AssignedTask): void {
    this.openAssignmentModal('edit', assignment);
  }

  async toggleAssignmentStatus(assignment: AssignedTask): Promise<void> {
    const currentToggling = this.togglingStatus();
    if (currentToggling.has(assignment.id)) return;

    this.togglingStatus.update(set => new Set([...set, assignment.id]));
    try {
      // TODO: Implémenter le toggle du statut
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

  async deleteAssignment(assignmentId: string): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) return;

    try {
      // TODO: Implémenter la suppression
      console.log('Delete assignment:', assignmentId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
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
}