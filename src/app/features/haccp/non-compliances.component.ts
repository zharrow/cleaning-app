import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, NonCompliance } from '../../core/services/haccp.service';

@Component({
  selector: 'app-non-compliances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="non-compliances-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Non-Conformités</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Déclarer une non-conformité
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les types</option>
          <option value="PRODUCT">Produit</option>
          <option value="TEMPERATURE">Température</option>
          <option value="HYGIENE">Hygiène</option>
          <option value="OTHER">Autre</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouvertes</option>
          <option value="CORRECTED">Corrigées</option>
          <option value="CLOSED">Fermées</option>
        </select>
        <input
          [(ngModel)]="dateFrom"
          (ngModelChange)="applyFilters()"
          type="date"
          placeholder="Date début"
          class="px-3 py-2 border rounded">
        <input
          [(ngModel)]="dateTo"
          (ngModelChange)="applyFilters()"
          type="date"
          placeholder="Date fin"
          class="px-3 py-2 border rounded">
      </div>

      <!-- Liste non-conformités -->
      <div class="non-compliances-list grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (nc of filteredNonCompliances(); track nc.id) {
          <div class="non-compliance-card bg-white p-4 rounded-lg shadow border-l-4"
               [class.border-red-500]="nc.status === 'OPEN'"
               [class.border-orange-500]="nc.status === 'CORRECTED'"
               [class.border-green-500]="nc.status === 'CLOSED'">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="inline-block px-2 py-1 text-xs rounded"
                        [class.bg-blue-100]="nc.type === 'PRODUCT'"
                        [class.text-blue-700]="nc.type === 'PRODUCT'"
                        [class.bg-purple-100]="nc.type === 'TEMPERATURE'"
                        [class.text-purple-700]="nc.type === 'TEMPERATURE'"
                        [class.bg-yellow-100]="nc.type === 'HYGIENE'"
                        [class.text-yellow-700]="nc.type === 'HYGIENE'"
                        [class.bg-gray-100]="nc.type === 'OTHER'"
                        [class.text-gray-700]="nc.type === 'OTHER'">
                    {{ getTypeLabel(nc.type) }}
                  </span>
                  <span class="inline-block px-2 py-1 text-xs rounded font-semibold"
                        [class.bg-red-100]="nc.status === 'OPEN'"
                        [class.text-red-700]="nc.status === 'OPEN'"
                        [class.bg-orange-100]="nc.status === 'CORRECTED'"
                        [class.text-orange-700]="nc.status === 'CORRECTED'"
                        [class.bg-green-100]="nc.status === 'CLOSED'"
                        [class.text-green-700]="nc.status === 'CLOSED'">
                    {{ getStatusLabel(nc.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-800 mb-2">{{ nc.description }}</p>
                <p class="text-xs text-gray-500">
                  Déclarée le: {{ nc.report_date | date:'short' }}
                </p>
                @if (nc.responsible_id) {
                  <p class="text-xs text-gray-500">
                    Responsable: {{ nc.responsible_id }}
                  </p>
                }
                @if (nc.corrective_action) {
                  <div class="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <strong>Action corrective:</strong> {{ nc.corrective_action }}
                  </div>
                }
              </div>
            </div>
            <div class="actions flex gap-2 mt-3">
              <button (click)="editNonCompliance(nc)" class="text-sm text-blue-600 hover:underline">Modifier</button>
              <button (click)="deleteNonCompliance(nc)" class="text-sm text-red-600 hover:underline">Supprimer</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-400">
            <div class="text-6xl mb-4">✅</div>
            <p>Aucune non-conformité trouvée</p>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content max-w-2xl" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingNonCompliance() ? 'Modifier' : 'Déclarer' }} une non-conformité</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveNonCompliance()">
              <div class="modal-body">
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label required">Type</label>
                      <select [(ngModel)]="formData.type" name="type" required class="form-select">
                        <option value="PRODUCT">Produit</option>
                        <option value="TEMPERATURE">Température</option>
                        <option value="HYGIENE">Hygiène</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Statut</label>
                      <select [(ngModel)]="formData.status" name="status" required class="form-select">
                        <option value="OPEN">Ouverte</option>
                        <option value="CORRECTED">Corrigée</option>
                        <option value="CLOSED">Fermée</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label required">Description</label>
                    <textarea [(ngModel)]="formData.description" name="description" required rows="3" class="form-textarea"></textarea>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label required">Date de déclaration</label>
                      <input [(ngModel)]="formData.report_date" name="report_date" type="datetime-local" required class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Responsable</label>
                      <input [(ngModel)]="formData.responsible_id" name="responsible_id" class="form-input">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Action corrective</label>
                    <textarea [(ngModel)]="formData.corrective_action" name="corrective_action" rows="3" class="form-textarea"></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class NonCompliancesComponent implements OnInit {
  private haccpService = inject(HaccpService);

  nonCompliances = signal<NonCompliance[]>([]);
  filteredNonCompliances = signal<NonCompliance[]>([]);
  showModal = signal(false);
  editingNonCompliance = signal<NonCompliance | null>(null);

  typeFilter = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';

  formData: Partial<NonCompliance> = {
    type: 'PRODUCT',
    description: '',
    report_date: '',
    responsible_id: null,
    corrective_action: '',
    status: 'OPEN'
  };

  ngOnInit() {
    this.loadNonCompliances();
  }

  loadNonCompliances() {
    this.haccpService.getNonCompliances().subscribe(nonCompliances => {
      this.nonCompliances.set(nonCompliances);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.nonCompliances();

    if (this.typeFilter) {
      filtered = filtered.filter(nc => nc.type === this.typeFilter);
    }

    if (this.statusFilter) {
      filtered = filtered.filter(nc => nc.status === this.statusFilter);
    }

    if (this.dateFrom) {
      filtered = filtered.filter(nc => new Date(nc.report_date) >= new Date(this.dateFrom));
    }

    if (this.dateTo) {
      filtered = filtered.filter(nc => new Date(nc.report_date) <= new Date(this.dateTo));
    }

    this.filteredNonCompliances.set(filtered);
  }

  openModal() {
    this.formData = {
      type: 'PRODUCT',
      description: '',
      report_date: new Date().toISOString().slice(0, 16),
      responsible_id: null,
      corrective_action: '',
      status: 'OPEN'
    };
    this.editingNonCompliance.set(null);
    this.showModal.set(true);
  }

  editNonCompliance(nc: NonCompliance) {
    this.formData = {
      ...nc,
      report_date: nc.report_date ? new Date(nc.report_date).toISOString().slice(0, 16) : ''
    };
    this.editingNonCompliance.set(nc);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveNonCompliance() {
    const editing = this.editingNonCompliance();
    if (editing) {
      this.haccpService.updateNonCompliance(editing.id, this.formData).subscribe(() => {
        this.loadNonCompliances();
        this.closeModal();
      });
    } else {
      this.haccpService.createNonCompliance(this.formData).subscribe(() => {
        this.loadNonCompliances();
        this.closeModal();
      });
    }
  }

  deleteNonCompliance(nc: NonCompliance) {
    if (confirm('Supprimer cette non-conformité ?')) {
      this.haccpService.deleteNonCompliance(nc.id).subscribe(() => this.loadNonCompliances());
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PRODUCT': 'Produit',
      'TEMPERATURE': 'Température',
      'HYGIENE': 'Hygiène',
      'OTHER': 'Autre'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'OPEN': 'Ouverte',
      'CORRECTED': 'Corrigée',
      'CLOSED': 'Fermée'
    };
    return labels[status] || status;
  }
}
