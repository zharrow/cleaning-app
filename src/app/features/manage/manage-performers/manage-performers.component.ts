import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, Performer } from '../../tasks/task.service';
import { ConfirmationModalComponent, type ConfirmationConfig } from '../../../shared/components/confirmation-modal.component';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationModalComponent],
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
          @for (performer of sortedPerformers(); track performer.id) {
            <div 
              class="card hover-lift animate-fade-in"
              [class.overflow-visible]="openMenuId() === performer.id"
              [class.card-inactive]="!performer.is_active"
            >
              <div class="card-body">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-primary-100 rounded flex items-center justify-center">
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
                          
                          <div class="border-t my-1"></div>
                          
                          <button 
                            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                            (click)="openDeletePerformerModal(performer)"
                          >
                            <span class="text-base">🗑️</span>
                            <div class="text-left">
                              <div class="font-medium">Supprimer définitivement</div>
                              <div class="text-xs text-red-500">
                                Action irréversible
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


    <!-- Modales de confirmation -->
    <app-confirmation-modal
      [isOpen]="deletePerformerModal().isOpen"
      [isLoading]="deletePerformerModal().isLoading"
      [config]="deletePerformerConfig()"
      (confirm)="confirmDeletePerformer()"
      (cancel)="closeDeletePerformerModal()"
    />

    <app-confirmation-modal
      [isOpen]="deactivatePerformerModal().isOpen"
      [isLoading]="deactivatePerformerModal().isLoading"
      [config]="deactivatePerformerConfig()"
      (confirm)="confirmDeactivatePerformer()"
      (cancel)="closeDeactivatePerformerModal()"
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

    /* Style pour les performers inactifs */
    .card-inactive {
      opacity: 0.6;
      background-color: #f8f9fa;
      border-color: #dee2e6;
      transform: none !important;
    }

    .card-inactive:hover {
      transform: none !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }

    .card-inactive .text-gray-900 {
      color: #6c757d !important;
    }
  `]
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
  
  // Modales de confirmation
  readonly deletePerformerModal = signal<{
    isOpen: boolean;
    performer: Performer | null;
    isLoading: boolean;
  }>({ isOpen: false, performer: null, isLoading: false });

  readonly deactivatePerformerModal = signal<{
    isOpen: boolean;
    performer: Performer | null;
    isLoading: boolean;
  }>({ isOpen: false, performer: null, isLoading: false });
  
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

  // Performers triés : actifs d'abord, inactifs à la fin
  readonly sortedPerformers = computed(() => 
    this.taskService.performers().sort((a, b) => {
      // Actifs en premier (is_active === true)
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      // Même statut : tri par nom
      return a.name.localeCompare(b.name);
    })
  );

  // Configuration des modales de confirmation
  readonly deletePerformerConfig = computed(() => {
    const modal = this.deletePerformerModal();
    const performer = modal.performer;
    
    return {
      title: 'Supprimer l\'intervenant',
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'intervenant "${performer?.name || ''}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`,
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler',
      type: 'danger' as const,
      icon: '🗑️'
    };
  });

  readonly deactivatePerformerConfig = computed(() => {
    const modal = this.deactivatePerformerModal();
    const performer = modal.performer;
    const isActive = performer?.is_active;
    
    return {
      title: `${isActive ? 'Désactiver' : 'Activer'} l'intervenant`,
      message: `Êtes-vous sûr de vouloir ${isActive ? 'désactiver' : 'activer'} l'intervenant "${performer?.name || ''}" ?\n\n${
        isActive 
          ? 'L\'intervenant ne pourra plus être assigné à de nouvelles tâches.'
          : 'L\'intervenant pourra à nouveau être assigné à des tâches.'
      }`,
      confirmText: isActive ? 'Désactiver' : 'Activer',
      cancelText: 'Annuler',
      type: isActive ? 'warning' as const : 'info' as const,
      icon: isActive ? '⏸️' : '▶️'
    };
  });

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
  // Gestion des modales de confirmation
  // ===================

  openDeletePerformerModal(performer: Performer): void {
    this.deletePerformerModal.set({
      isOpen: true,
      performer,
      isLoading: false
    });
    this.closeAllMenus();
  }

  closeDeletePerformerModal(): void {
    this.deletePerformerModal.set({
      isOpen: false,
      performer: null,
      isLoading: false
    });
  }

  openDeactivatePerformerModal(performer: Performer): void {
    this.deactivatePerformerModal.set({
      isOpen: true,
      performer,
      isLoading: false
    });
    this.closeAllMenus();
  }

  closeDeactivatePerformerModal(): void {
    this.deactivatePerformerModal.set({
      isOpen: false,
      performer: null,
      isLoading: false
    });
  }

  // ===================
  // Actions des intervenants
  // ===================

  editPerformer(performer: Performer) {
    this.openPerformerModal('edit', performer);
  }

  togglePerformerStatus(performer: Performer) {
    this.openDeactivatePerformerModal(performer);
  }

  async confirmDeletePerformer(): Promise<void> {
    const modal = this.deletePerformerModal();
    if (!modal.performer) return;

    this.deletePerformerModal.update(m => ({ ...m, isLoading: true }));

    try {
      console.log('🗑️ Suppression de l\'intervenant:', modal.performer.id);
      await this.taskService.deletePerformer(modal.performer.id);
      console.log('✅ Intervenant supprimé avec succès');
      this.closeDeletePerformerModal();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'intervenant:', error);
      this.deletePerformerModal.update(m => ({ ...m, isLoading: false }));
      alert('Erreur lors de la suppression de l\'intervenant');
    }
  }

  async confirmDeactivatePerformer(): Promise<void> {
    const modal = this.deactivatePerformerModal();
    if (!modal.performer) return;

    this.deactivatePerformerModal.update(m => ({ ...m, isLoading: true }));

    try {
      console.log(`🔄 Toggle du statut de l'intervenant:`, modal.performer.id);
      
      await this.taskService.togglePerformerStatus(modal.performer.id);
      
      console.log(`✅ Statut de l'intervenant mis à jour avec succès`);
      this.closeDeactivatePerformerModal();
    } catch (error) {
      console.error('❌ Erreur lors de la modification du statut:', error);
      this.deactivatePerformerModal.update(m => ({ ...m, isLoading: false }));
      alert('Erreur lors de la modification du statut');
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