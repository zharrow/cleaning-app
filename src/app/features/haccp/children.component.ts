import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Child } from '../../core/services/haccp.service';

@Component({
  selector: 'app-children',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="children-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Enfants</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un enfant
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <select [(ngModel)]="selectedSection" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Toutes les sections</option>
          <option value="Babies">Bébés</option>
          <option value="Toddlers">Moyens</option>
          <option value="Preschoolers">Grands</option>
        </select>
        <select [(ngModel)]="showActive" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="true">Actifs uniquement</option>
          <option value="false">Inactifs uniquement</option>
          <option value="">Tous</option>
        </select>
      </div>

      <!-- Liste enfants -->
      <div class="children-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (child of filteredChildren(); track child.id) {
          <div class="child-card bg-white p-4 rounded-lg shadow">
            <div class="flex items-start gap-3">
              <div class="avatar w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                {{ child.first_name[0] }}{{ child.last_name[0] }}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold">{{ child.first_name }} {{ child.last_name }}</h3>
                <p class="text-sm text-gray-500">{{ getAge(child.birth_date) }} ans</p>
                <span class="inline-block px-2 py-1 text-xs rounded mt-1"
                      [class.bg-blue-100]="child.section === 'Babies'"
                      [class.bg-green-100]="child.section === 'Toddlers'"
                      [class.bg-purple-100]="child.section === 'Preschoolers'">
                  {{ getSectionLabel(child.section) }}
                </span>
                @if (child.allergies) {
                  <div class="mt-2">
                    <span class="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      🚨 Allergies: {{ child.allergies }}
                    </span>
                  </div>
                }
                @if (child.specific_diet) {
                  <p class="text-xs text-gray-600 mt-1">Régime: {{ child.specific_diet }}</p>
                }
              </div>
            </div>
            <div class="actions flex gap-2 mt-3">
              <button (click)="editChild(child)" class="text-sm text-blue-600 hover:underline">Modifier</button>
              <button (click)="toggleActive(child)" class="text-sm text-orange-600 hover:underline">
                {{ child.is_active ? 'Désactiver' : 'Activer' }}
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeModal()">
          <div class="modal-content bg-white rounded-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold mb-4">{{ editingChild() ? 'Modifier' : 'Ajouter' }} un enfant</h2>
            <form (ngSubmit)="saveChild()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Prénom *</label>
                <input [(ngModel)]="formData.first_name" name="first_name" required class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Nom *</label>
                <input [(ngModel)]="formData.last_name" name="last_name" required class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Date de naissance *</label>
                <input [(ngModel)]="formData.birth_date" name="birth_date" type="date" required class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Section *</label>
                <select [(ngModel)]="formData.section" name="section" required class="w-full px-3 py-2 border rounded">
                  <option value="Babies">Bébés</option>
                  <option value="Toddlers">Moyens</option>
                  <option value="Preschoolers">Grands</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Allergies</label>
                <textarea [(ngModel)]="formData.allergies" name="allergies" rows="2" class="w-full px-3 py-2 border rounded"></textarea>
                @if (formData.allergies) {
                  <p class="text-xs text-red-600 mt-1">⚠️ Attention: Allergies renseignées</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Régime spécial</label>
                <textarea [(ngModel)]="formData.specific_diet" name="specific_diet" rows="2" class="w-full px-3 py-2 border rounded"></textarea>
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
export class ChildrenComponent implements OnInit {
  private haccpService = inject(HaccpService);

  children = signal<Child[]>([]);
  filteredChildren = signal<Child[]>([]);
  showModal = signal(false);
  editingChild = signal<Child | null>(null);

  selectedSection = '';
  showActive = 'true';

  formData: Partial<Child> = {
    first_name: '',
    last_name: '',
    birth_date: '',
    section: 'Babies',
    allergies: '',
    specific_diet: ''
  };

  ngOnInit() {
    this.loadChildren();
  }

  loadChildren() {
    this.haccpService.getChildren().subscribe(children => {
      this.children.set(children);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = this.children();

    if (this.selectedSection) {
      filtered = filtered.filter(c => c.section === this.selectedSection);
    }

    if (this.showActive !== '') {
      const isActive = this.showActive === 'true';
      filtered = filtered.filter(c => c.is_active === isActive);
    }

    this.filteredChildren.set(filtered);
  }

  openModal() {
    this.formData = {
      first_name: '',
      last_name: '',
      birth_date: '',
      section: 'Babies',
      allergies: '',
      specific_diet: ''
    };
    this.editingChild.set(null);
    this.showModal.set(true);
  }

  editChild(child: Child) {
    this.formData = { ...child };
    this.editingChild.set(child);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveChild() {
    const editing = this.editingChild();
    if (editing) {
      this.haccpService.updateChild(editing.id, this.formData).subscribe(() => {
        this.loadChildren();
        this.closeModal();
      });
    } else {
      this.haccpService.createChild(this.formData).subscribe(() => {
        this.loadChildren();
        this.closeModal();
      });
    }
  }

  toggleActive(child: Child) {
    this.haccpService.updateChild(child.id, { is_active: !child.is_active }).subscribe(() => {
      this.loadChildren();
    });
  }

  getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getSectionLabel(section: string): string {
    const labels: Record<string, string> = {
      'Babies': 'Bébés',
      'Toddlers': 'Moyens',
      'Preschoolers': 'Grands'
    };
    return labels[section] || section;
  }
}
