import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Document } from '../../core/services/haccp.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="documents-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Documents</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un document
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <input
          [(ngModel)]="searchTerm"
          (ngModelChange)="applyFilters()"
          placeholder="Rechercher un document..."
          class="flex-1 px-3 py-2 border rounded">
        <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Toutes les catégories</option>
          <option value="TEMPERATURES">Températures</option>
          <option value="CLEANING">Nettoyage</option>
          <option value="TRAINING">Formation</option>
          <option value="COMPLIANCE">Conformité</option>
          <option value="OTHER">Autre</option>
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

      <!-- Table documents -->
      <div class="documents-table bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold">Nom du document</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Catégorie</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Date de création</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Durée de conservation</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Responsable</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (document of filteredDocuments(); track document.id) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📄</span>
                    <span class="font-semibold">{{ document.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 text-xs rounded"
                        [class.bg-blue-100]="document.category === 'TEMPERATURES'"
                        [class.text-blue-700]="document.category === 'TEMPERATURES'"
                        [class.bg-green-100]="document.category === 'CLEANING'"
                        [class.text-green-700]="document.category === 'CLEANING'"
                        [class.bg-purple-100]="document.category === 'TRAINING'"
                        [class.text-purple-700]="document.category === 'TRAINING'"
                        [class.bg-orange-100]="document.category === 'COMPLIANCE'"
                        [class.text-orange-700]="document.category === 'COMPLIANCE'"
                        [class.bg-gray-100]="document.category === 'OTHER'"
                        [class.text-gray-700]="document.category === 'OTHER'">
                    {{ getCategoryLabel(document.category) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ document.creation_date | date:'shortDate' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ document.retention_period || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ document.responsible_id || '-' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button (click)="downloadDocument(document)" class="text-sm text-green-600 hover:underline">Télécharger</button>
                    <button (click)="editDocument(document)" class="text-sm text-blue-600 hover:underline">Modifier</button>
                    <button (click)="deleteDocument(document)" class="text-sm text-red-600 hover:underline">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-400">
                  <div class="text-6xl mb-4">📂</div>
                  <p>Aucun document trouvé</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content max-w-2xl" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingDocument() ? 'Modifier' : 'Ajouter' }} un document</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveDocument()">
              <div class="modal-body">
                <div class="space-y-4">
                  <div class="form-group">
                    <label class="form-label required">Nom du document</label>
                    <input [(ngModel)]="formData.name" name="name" required class="form-input">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label required">Catégorie</label>
                      <select [(ngModel)]="formData.category" name="category" required class="form-select">
                        <option value="TEMPERATURES">Températures</option>
                        <option value="CLEANING">Nettoyage</option>
                        <option value="TRAINING">Formation</option>
                        <option value="COMPLIANCE">Conformité</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Date de création</label>
                      <input [(ngModel)]="formData.creation_date" name="creation_date" type="date" required class="form-input">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label required">Chemin du fichier</label>
                    <input [(ngModel)]="formData.file_path" name="file_path" required class="form-input" placeholder="Ex: /documents/haccp/temperatures_2024.pdf">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">Durée de conservation</label>
                      <input [(ngModel)]="formData.retention_period" name="retention_period" class="form-input" placeholder="Ex: 3 ans">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Responsable</label>
                      <input [(ngModel)]="formData.responsible_id" name="responsible_id" class="form-input">
                    </div>
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
export class DocumentsComponent implements OnInit {
  private haccpService = inject(HaccpService);

  documents = signal<Document[]>([]);
  filteredDocuments = signal<Document[]>([]);
  showModal = signal(false);
  editingDocument = signal<Document | null>(null);

  searchTerm = '';
  categoryFilter = '';
  dateFrom = '';
  dateTo = '';

  formData: Partial<Document> = {
    name: '',
    category: 'TEMPERATURES',
    file_path: '',
    creation_date: '',
    retention_period: '',
    responsible_id: ''
  };

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.haccpService.getDocuments().subscribe(documents => {
      this.documents.set(documents);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.documents();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(term) ||
        (d.file_path && d.file_path.toLowerCase().includes(term))
      );
    }

    if (this.categoryFilter) {
      filtered = filtered.filter(d => d.category === this.categoryFilter);
    }

    if (this.dateFrom) {
      filtered = filtered.filter(d => new Date(d.creation_date) >= new Date(this.dateFrom));
    }

    if (this.dateTo) {
      filtered = filtered.filter(d => new Date(d.creation_date) <= new Date(this.dateTo));
    }

    this.filteredDocuments.set(filtered);
  }

  openModal() {
    this.formData = {
      name: '',
      category: 'TEMPERATURES',
      file_path: '',
      creation_date: new Date().toISOString().split('T')[0],
      retention_period: '',
      responsible_id: ''
    };
    this.editingDocument.set(null);
    this.showModal.set(true);
  }

  editDocument(document: Document) {
    this.formData = { ...document };
    this.editingDocument.set(document);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveDocument() {
    const editing = this.editingDocument();
    if (editing) {
      this.haccpService.updateDocument(editing.id, this.formData).subscribe(() => {
        this.loadDocuments();
        this.closeModal();
      });
    } else {
      this.haccpService.createDocument(this.formData).subscribe(() => {
        this.loadDocuments();
        this.closeModal();
      });
    }
  }

  deleteDocument(document: Document) {
    if (confirm(`Supprimer le document "${document.name}" ?`)) {
      this.haccpService.deleteDocument(document.id).subscribe(() => this.loadDocuments());
    }
  }

  downloadDocument(document: Document) {
    // TODO: Implement actual download logic with Firebase Storage
    alert(`Téléchargement du document: ${document.file_path}`);
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'TEMPERATURES': 'Températures',
      'CLEANING': 'Nettoyage',
      'TRAINING': 'Formation',
      'COMPLIANCE': 'Conformité',
      'OTHER': 'Autre'
    };
    return labels[category] || category;
  }
}
