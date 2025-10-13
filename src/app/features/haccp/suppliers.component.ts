import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Supplier } from '../../core/services/haccp.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="suppliers-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Fournisseurs</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un fournisseur
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <input
          [(ngModel)]="searchTerm"
          (ngModelChange)="applyFilters()"
          placeholder="Rechercher un fournisseur..."
          class="flex-1 px-3 py-2 border rounded">
        <select [(ngModel)]="certifiedFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les fournisseurs</option>
          <option value="true">Certifiés HACCP</option>
          <option value="false">Non certifiés</option>
        </select>
      </div>

      <!-- Liste fournisseurs -->
      <div class="suppliers-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (supplier of filteredSuppliers(); track supplier.id) {
          <div class="supplier-card bg-white p-4 rounded-lg shadow">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="font-semibold text-lg">{{ supplier.name }}</h3>
                @if (supplier.contact_name) {
                  <p class="text-sm text-gray-600">Contact: {{ supplier.contact_name }}</p>
                }
              </div>
              @if (supplier.haccp_certified) {
                <span class="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                  ✓ HACCP
                </span>
              }
            </div>
            <div class="space-y-1 text-sm">
              @if (supplier.phone) {
                <p class="text-gray-600">📞 {{ supplier.phone }}</p>
              }
              @if (supplier.email) {
                <p class="text-gray-600">✉️ {{ supplier.email }}</p>
              }
              @if (supplier.validation_date) {
                <p class="text-gray-600">
                  Validation: {{ supplier.validation_date | date:'shortDate' }}
                </p>
              }
            </div>
            <div class="actions flex gap-2 mt-3">
              <button (click)="editSupplier(supplier)" class="text-sm text-blue-600 hover:underline">Modifier</button>
              <button (click)="deleteSupplier(supplier)" class="text-sm text-red-600 hover:underline">Supprimer</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-400">
            <div class="text-6xl mb-4">🚚</div>
            <p>Aucun fournisseur trouvé</p>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content max-w-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingSupplier() ? 'Modifier' : 'Ajouter' }} un fournisseur</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveSupplier()">
              <div class="modal-body">
                <div class="space-y-4">
                  <div class="form-group">
                    <label class="form-label required">Nom du fournisseur</label>
                    <input [(ngModel)]="formData.name" name="name" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Contact</label>
                    <input [(ngModel)]="formData.contact_name" name="contact_name" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Téléphone</label>
                    <input [(ngModel)]="formData.phone" name="phone" type="tel" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input [(ngModel)]="formData.email" name="email" type="email" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Adresse</label>
                    <textarea [(ngModel)]="formData.address" name="address" rows="2" class="form-textarea"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-checkbox">
                      <input [(ngModel)]="formData.haccp_certified" name="haccp_certified" type="checkbox" id="haccp_certified">
                      <span>Certifié HACCP</span>
                    </label>
                  </div>
                  @if (formData.haccp_certified) {
                    <div class="form-group">
                      <label class="form-label">Date de validation</label>
                      <input [(ngModel)]="formData.validation_date" name="validation_date" type="date" class="form-input">
                    </div>
                  }
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
export class SuppliersComponent implements OnInit {
  private haccpService = inject(HaccpService);

  suppliers = signal<Supplier[]>([]);
  filteredSuppliers = signal<Supplier[]>([]);
  showModal = signal(false);
  editingSupplier = signal<Supplier | null>(null);

  searchTerm = '';
  certifiedFilter = '';

  formData: Partial<Supplier> = {
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    haccp_certified: false,
    validation_date: ''
  };

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.haccpService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.suppliers();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(term))
      );
    }

    if (this.certifiedFilter !== '') {
      const isCertified = this.certifiedFilter === 'true';
      filtered = filtered.filter(s => s.haccp_certified === isCertified);
    }

    this.filteredSuppliers.set(filtered);
  }

  openModal() {
    this.formData = {
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      haccp_certified: false,
      validation_date: ''
    };
    this.editingSupplier.set(null);
    this.showModal.set(true);
  }

  editSupplier(supplier: Supplier) {
    this.formData = { ...supplier };
    this.editingSupplier.set(supplier);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveSupplier() {
    const editing = this.editingSupplier();
    if (editing) {
      this.haccpService.updateSupplier(editing.id, this.formData).subscribe(() => {
        this.loadSuppliers();
        this.closeModal();
      });
    } else {
      this.haccpService.createSupplier(this.formData).subscribe(() => {
        this.loadSuppliers();
        this.closeModal();
      });
    }
  }

  deleteSupplier(supplier: Supplier) {
    if (confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) {
      this.haccpService.deleteSupplier(supplier.id).subscribe(() => this.loadSuppliers());
    }
  }
}
