import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, Performer } from '../../tasks/task.service';

/**
 * Interface pour les formulaires
 */
interface PerformerForm {
  readonly name: string;
}

/**
 * Interface pour les modals
 */
interface PerformerModal {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly performer: Performer | null;
}

@Component({
  selector: 'app-manage-performers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      
      <!-- En-tête -->
      <div class="page-header">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="page-title">Gestion des intervenants</h1>
            <p class="page-subtitle">
              Gérez les personnes qui effectuent les tâches de nettoyage
            </p>
          </div>
          
          <!-- Actions principales -->
          <div class="flex items-center gap-3">
            <button 
              class="btn btn-primary"
              (click)="openPerformerModal('create')"
            >
              <span class="text-lg">👤</span>
              Nouvel intervenant
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total intervenants</p>
                <p class="text-2xl font-bold text-gray-900">{{ taskService.performers().length }}</p>
              </div>
              <span class="text-3xl">👤</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Actifs</p>
                <p class="text-2xl font-bold text-gray-900">{{ activePerformersCount() }}</p>
              </div>
              <span class="text-3xl">✅</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Inactifs</p>
                <p class="text-2xl font-bold text-gray-900">{{ inactivePerformersCount() }}</p>
              </div>
              <span class="text-3xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des intervenants -->
      @if (taskService.isLoading()) {
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
      } @else if (taskService.performers().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (performer of taskService.performers(); track performer.id) {
            <div class="card hover-lift animate-fade-in">
              <div class="card-body">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span class="text-lg">👤</span>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900">{{ performer.name }}</h3>
                        <div class="flex items-center gap-2">
                          @if (performer.is_active) {
                            <span class="badge badge-success">
                              <span class="badge-dot"></span>
                              Actif
                            </span>
                          } @else {
                            <span class="badge badge-gray">
                              <span class="badge-dot"></span>
                              Inactif
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                    
                    <!-- Informations supplémentaires -->
                    <div class="space-y-2 text-sm text-gray-600">
                      @if (performer.created_at) {
                        <div class="flex items-center justify-between">
                          <span>Créé le</span>
                          <span class="font-medium">{{ formatDate(performer.created_at) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <!-- Menu actions -->
                  <div class="relative dropdown-container">
                    <button 
                      class="btn btn-ghost btn-icon btn-sm"
                      (click)="togglePerformerMenu(performer.id)"
                    >
                      ⋮
                    </button>
                    
                    @if (openMenuId() === performer.id) {
                      <div class="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50 dropdown-menu">
                        <div class="py-2">
                          <button 
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            (click)="editPerformer(performer)"
                          >
                            <span class="text-base">✏️</span>
                            <div class="text-left">
                              <div class="font-medium">Modifier</div>
                              <div class="text-xs text-gray-500">Changer le nom</div>
                            </div>
                          </button>
                          
                          <button 
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 transition-colors"
                            [class.text-red-700]="performer.is_active"
                            [class.text-green-700]="!performer.is_active"
                            (click)="togglePerformerStatus(performer)"
                          >
                            <span class="text-base">{{ performer.is_active ? '❌' : '✅' }}</span>
                            <div class="text-left">
                              <div class="font-medium">{{ performer.is_active ? 'Désactiver' : 'Activer' }}</div>
                              <div class="text-xs text-gray-500">
                                {{ performer.is_active ? 'Rendre indisponible' : 'Rendre disponible' }}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Aucun intervenant -->
        <div class="card">
          <div class="card-body text-center py-12">
            <span class="text-6xl mb-4 block">👤</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Aucun intervenant configuré
            </h3>
            <p class="text-gray-600 mb-6">
              Commencez par ajouter les personnes qui effectueront les tâches de nettoyage.
            </p>
            <button 
              class="btn btn-primary"
              (click)="openPerformerModal('create')"
            >
              Créer mon premier intervenant
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Modal Intervenant -->
    @if (performerModal().isOpen) {
      <div class="modal-overlay" (click)="closePerformerModal()">
        <div class="modal-content max-w-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ performerModal().mode === 'create' ? 'Créer un intervenant' : 'Modifier l\'intervenant' }}
            </h3>
            <button class="modal-close" (click)="closePerformerModal()">✕</button>
          </div>
          
          <form [formGroup]="performerForm" (ngSubmit)="savePerformer()">
            <div class="modal-body">
              <div class="space-y-4">
                
                <div class="form-group">
                  <label class="form-label required">Nom de l'intervenant</label>
                  <input 
                    type="text"
                    class="form-input"
                    formControlName="name"
                    placeholder="ex: Marie Dupont"
                  />
                  @if (performerForm.get('name')?.invalid && performerForm.get('name')?.touched) {
                    <div class="form-error">Le nom est requis (minimum 2 caractères)</div>
                  }
                </div>
                
              </div>
            </div>
            
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closePerformerModal()"
                [disabled]="isSubmitting()"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!performerForm.valid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <div class="spinner spinner-sm"></div>
                }
                {{ performerModal().mode === 'create' ? 'Créer' : 'Modifier' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal de confirmation -->
    @if (confirmModal().isOpen) {
      <div class="modal-overlay" (click)="closeConfirmModal()">
        <div class="modal-content max-w-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Confirmation</h3>
            <button class="modal-close" (click)="closeConfirmModal()">✕</button>
          </div>
          
          <div class="modal-body text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-warning-100 mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <p class="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir <strong>{{ confirmAction() }}</strong> l'intervenant 
              <strong>"{{ confirmTarget()!.name }}"</strong> ?
            </p>
            @if (confirmAction() === 'désactiver') {
              <div class="alert alert-warning text-left">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                  <div class="alert-message">
                    Cet intervenant ne pourra plus être assigné à de nouvelles tâches.
                  </div>
                </div>
              </div>
            }
          </div>
          
          <div class="modal-footer">
            <button 
              class="btn btn-secondary"
              (click)="closeConfirmModal()"
              [disabled]="isSubmitting()"
            >
              Annuler
            </button>
            <button 
              class="btn btn-primary"
              (click)="executeConfirm()"
              [disabled]="isSubmitting()"
            >
              @if (isSubmitting()) {
                <div class="spinner spinner-sm"></div>
              }
              Confirmer
            </button>
          </div>
        </div>
      </div>
    }
  `
})
/**
 * Composant de gestion des intervenants
 * Permet de créer, modifier et gérer les personnes qui effectuent les tâches
 */
export class ManagePerformersComponent implements OnInit {
  readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);
  
  // État des signaux
  readonly isSubmitting = signal(false);
  readonly openMenuId = signal<string | null>(null);
  
  // Modaux
  readonly performerModal = signal<PerformerModal>({
    isOpen: false,
    mode: 'create',
    performer: null
  });
  
  readonly confirmModal = signal<{
    isOpen: boolean;
    performer: Performer | null;
    action: string;
  }>({
    isOpen: false,
    performer: null,
    action: ''
  });
  
  // Formulaire
  readonly performerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  // Propriétés calculées
  readonly activePerformersCount = computed(() => 
    this.taskService.performers().filter(p => p.is_active).length
  );
  
  readonly inactivePerformersCount = computed(() => 
    this.taskService.performers().filter(p => !p.is_active).length
  );

  // Propriétés pour la modale de confirmation
  readonly confirmTarget = computed(() => this.confirmModal().performer);
  readonly confirmAction = computed(() => this.confirmModal().action);

  ngOnInit() {
    this.taskService.loadAllData();
  }

  // ===================
  // Utilitaires
  // ===================

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  }

  // ===================
  // Gestion des menus
  // ===================

  togglePerformerMenu(performerId: string) {
    const currentId = this.openMenuId();
    this.openMenuId.set(currentId === performerId ? null : performerId);
  }

  closeAllMenus() {
    this.openMenuId.set(null);
  }

  // ===================
  // Gestion du modal principal
  // ===================

  openPerformerModal(mode: 'create' | 'edit', performer?: Performer) {
    this.closeAllMenus();
    
    if (mode === 'edit' && performer) {
      this.performerForm.patchValue({
        name: performer.name
      });
    } else {
      this.performerForm.reset();
    }
    
    this.performerModal.set({
      isOpen: true,
      mode,
      performer: performer || null
    });
  }

  closePerformerModal() {
    this.performerModal.set({
      isOpen: false,
      mode: 'create',
      performer: null
    });
    this.performerForm.reset();
  }

  // ===================
  // Gestion du modal de confirmation
  // ===================

  openConfirmModal(performer: Performer, action: string) {
    this.closeAllMenus();
    this.confirmModal.set({
      isOpen: true,
      performer,
      action
    });
  }

  closeConfirmModal() {
    this.confirmModal.set({
      isOpen: false,
      performer: null,
      action: ''
    });
  }

  // ===================
  // Actions des intervenants
  // ===================

  editPerformer(performer: Performer) {
    this.openPerformerModal('edit', performer);
  }

  togglePerformerStatus(performer: Performer) {
    const action = performer.is_active ? 'désactiver' : 'activer';
    this.openConfirmModal(performer, action);
  }

  async executeConfirm() {
    const modal = this.confirmModal();
    if (!modal.performer) return;
    
    this.isSubmitting.set(true);
    
    try {
      await this.taskService.updatePerformer(modal.performer.id, {
        is_active: !modal.performer.is_active
      });
      
      this.closeConfirmModal();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      // Ici vous pourriez afficher un toast d'erreur
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ===================
  // Sauvegarde du formulaire
  // ===================

  async savePerformer() {
    if (!this.performerForm.valid || this.isSubmitting()) return;
    
    this.isSubmitting.set(true);
    
    try {
      const formData = this.performerForm.value as PerformerForm;
      const modal = this.performerModal();
      
      if (modal.mode === 'edit' && modal.performer) {
        await this.taskService.updatePerformer(modal.performer.id, formData);
      } else {
        await this.taskService.createPerformer(formData);
      }
      
      this.closePerformerModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Ici vous pourriez afficher un toast d'erreur
    } finally {
      this.isSubmitting.set(false);
    }
  }
}