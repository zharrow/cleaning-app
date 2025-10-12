import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Equipment } from '../../core/services/haccp.service';

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="equipment-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Equipements</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un équipement
        </button>
      </div>

      <!-- Alertes -->
      @if (nonCompliantEquipment().length > 0) {
        <div class="alert bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚠️</span>
            <div>
              <h3 class="font-bold text-red-700">Equipements non conformes</h3>
              <p class="text-red-600">{{ nonCompliantEquipment().length }} équipement(s) nécessitent une maintenance</p>
            </div>
          </div>
        </div>
      }

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <input
          [(ngModel)]="searchTerm"
          (ngModelChange)="applyFilters()"
          placeholder="Rechercher un équipement..."
          class="flex-1 px-3 py-2 border rounded">
        <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous les types</option>
          <option value="frigo">Frigo</option>
          <option value="four">Four</option>
          <option value="chauffe-repas">Chauffe-repas</option>
          <option value="autre">Autre</option>
        </select>
        <select [(ngModel)]="complianceFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Tous</option>
          <option value="true">Conformes</option>
          <option value="false">Non conformes</option>
        </select>
      </div>

      <!-- Liste équipements -->
      <div class="equipment-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (equipment of filteredEquipment(); track equipment.id) {
          <div class="equipment-card bg-white p-4 rounded-lg shadow"
               [class.border-l-4]="!equipment.is_compliant"
               [class.border-red-500]="!equipment.is_compliant">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="font-semibold text-lg">{{ equipment.name }}</h3>
                @if (equipment.type) {
                  <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mt-1">
                    {{ equipment.type }}
                  </span>
                }
              </div>
              <span class="inline-block px-2 py-1 text-xs rounded"
                    [class.bg-green-100]="equipment.is_compliant"
                    [class.text-green-700]="equipment.is_compliant"
                    [class.bg-red-100]="!equipment.is_compliant"
                    [class.text-red-700]="!equipment.is_compliant">
                {{ equipment.is_compliant ? '✓ Conforme' : '✗ Non conforme' }}
              </span>
            </div>
            <div class="space-y-1 text-sm">
              @if (equipment.target_temperature !== null && equipment.target_temperature !== undefined) {
                <p class="text-gray-600">Température cible: {{ equipment.target_temperature }}°C</p>
              }
              @if (equipment.last_control_date) {
                <p class="text-gray-600">
                  Dernier contrôle: {{ equipment.last_control_date | date:'shortDate' }}
                </p>
              }
              @if (equipment.observations) {
                <p class="text-gray-600 text-xs italic">{{ equipment.observations }}</p>
              }
            </div>
            <div class="actions flex gap-2 mt-3">
              <button (click)="editEquipment(equipment)" class="text-sm text-blue-600 hover:underline">Modifier</button>
              <button (click)="deleteEquipment(equipment)" class="text-sm text-red-600 hover:underline">Supprimer</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-400">
            <div class="text-6xl mb-4">🔧</div>
            <p>Aucun équipement trouvé</p>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeModal()">
          <div class="modal-content bg-white rounded-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold mb-4">{{ editingEquipment() ? 'Modifier' : 'Ajouter' }} un équipement</h2>
            <form (ngSubmit)="saveEquipment()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Nom de l'équipement *</label>
                <input [(ngModel)]="formData.name" name="name" required class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Type</label>
                <select [(ngModel)]="formData.type" name="type" class="w-full px-3 py-2 border rounded">
                  <option value="">Sélectionner</option>
                  <option value="frigo">Frigo</option>
                  <option value="four">Four</option>
                  <option value="chauffe-repas">Chauffe-repas</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Température cible (°C)</label>
                <input [(ngModel)]="formData.target_temperature" name="target_temperature" type="number" step="0.1" class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Date du dernier contrôle</label>
                <input [(ngModel)]="formData.last_control_date" name="last_control_date" type="date" class="w-full px-3 py-2 border rounded">
              </div>
              <div class="flex items-center gap-2">
                <input [(ngModel)]="formData.is_compliant" name="is_compliant" type="checkbox" id="is_compliant" class="w-4 h-4">
                <label for="is_compliant" class="text-sm font-medium">Conforme</label>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Observations</label>
                <textarea [(ngModel)]="formData.observations" name="observations" rows="3" class="w-full px-3 py-2 border rounded"></textarea>
              </div>
              <div class="flex gap-2 justify-end">
                <button type="button" (click)="closeModal()" class="px-4 py-2 border rounded hover:bg-gray-50">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class EquipmentComponent implements OnInit {
  private haccpService = inject(HaccpService);

  equipment = signal<Equipment[]>([]);
  filteredEquipment = signal<Equipment[]>([]);
  showModal = signal(false);
  editingEquipment = signal<Equipment | null>(null);

  searchTerm = '';
  typeFilter = '';
  complianceFilter = '';

  formData: Partial<Equipment> = {
    name: '',
    type: '',
    target_temperature: undefined,
    last_control_date: '',
    is_compliant: true,
    observations: ''
  };

  nonCompliantEquipment = computed(() => {
    return this.equipment().filter(e => !e.is_compliant);
  });

  ngOnInit() {
    this.loadEquipment();
  }

  loadEquipment() {
    this.haccpService.getEquipment().subscribe(equipment => {
      this.equipment.set(equipment);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.equipment();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(term) ||
        (e.type && e.type.toLowerCase().includes(term))
      );
    }

    if (this.typeFilter) {
      filtered = filtered.filter(e => e.type === this.typeFilter);
    }

    if (this.complianceFilter !== '') {
      const isCompliant = this.complianceFilter === 'true';
      filtered = filtered.filter(e => e.is_compliant === isCompliant);
    }

    this.filteredEquipment.set(filtered);
  }

  openModal() {
    this.formData = {
      name: '',
      type: '',
      target_temperature: undefined,
      last_control_date: '',
      is_compliant: true,
      observations: ''
    };
    this.editingEquipment.set(null);
    this.showModal.set(true);
  }

  editEquipment(equipment: Equipment) {
    this.formData = { ...equipment };
    this.editingEquipment.set(equipment);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveEquipment() {
    const editing = this.editingEquipment();
    if (editing) {
      this.haccpService.updateEquipment(editing.id, this.formData).subscribe(() => {
        this.loadEquipment();
        this.closeModal();
      });
    } else {
      this.haccpService.createEquipment(this.formData).subscribe(() => {
        this.loadEquipment();
        this.closeModal();
      });
    }
  }

  deleteEquipment(equipment: Equipment) {
    if (confirm(`Supprimer l'équipement "${equipment.name}" ?`)) {
      this.haccpService.deleteEquipment(equipment.id).subscribe(() => this.loadEquipment());
    }
  }
}
