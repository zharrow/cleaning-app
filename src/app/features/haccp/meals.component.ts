import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Meal, Child, Supplier, Temperature } from '../../core/services/haccp.service';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="meals-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestion des Repas</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un repas
        </button>
      </div>

      <!-- Sélecteur de date -->
      <div class="date-selector mb-6">
        <input
          [(ngModel)]="selectedDate"
          (ngModelChange)="loadMealsForDate()"
          type="date"
          class="px-4 py-2 border rounded">
      </div>

      <!-- Tabs par type de repas -->
      <div class="tabs flex gap-2 mb-6 border-b">
        <button
          *ngFor="let type of mealTypes"
          (click)="selectedMealType = type"
          [class.border-b-2]="selectedMealType === type"
          [class.border-blue-600]="selectedMealType === type"
          [class.text-blue-600]="selectedMealType === type"
          class="px-4 py-2 hover:bg-gray-50">
          {{ getMealTypeLabel(type) }}
        </button>
      </div>

      <!-- Liste repas du jour -->
      <div class="meals-list space-y-4">
        @for (meal of filteredMeals(); track meal.id) {
          <div class="meal-card bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-semibold">{{ getMealTypeLabel(meal.meal_type) }}</h3>
                <p class="text-sm text-gray-500">{{ meal.date | date:'fullDate' }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="editMeal(meal)" class="text-blue-600 hover:underline">Modifier</button>
                <button (click)="deleteMeal(meal)" class="text-red-600 hover:underline">Supprimer</button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Description menu -->
              <div>
                <h4 class="font-semibold mb-2">Menu</h4>
                <p class="text-gray-700">{{ meal.description || 'Aucune description' }}</p>
              </div>

              <!-- Infos traçabilité -->
              <div>
                <h4 class="font-semibold mb-2">Traçabilité</h4>
                <div class="text-sm space-y-1">
                  @if (meal.supplier_id) {
                    <div>Fournisseur: <span class="text-gray-600">{{ meal.supplier_id }}</span></div>
                  }
                  @if (meal.batch_id) {
                    <div>Lot: <span class="text-gray-600">{{ meal.batch_id }}</span></div>
                  }
                  @if (meal.responsible_id) {
                    <div>Responsable: <span class="text-gray-600">{{ meal.responsible_id }}</span></div>
                  }
                </div>
              </div>
            </div>

            <!-- Contrôles température -->
            <div class="mt-4">
              <h4 class="font-semibold mb-2">Contrôles de température</h4>
              <button (click)="addTemperature(meal)" class="text-sm text-blue-600 hover:underline mb-2">
                + Ajouter un contrôle
              </button>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                @for (temp of getTemperaturesForMeal(meal.id); track temp.id) {
                  <div
                    class="p-3 rounded border-l-4"
                    [class.border-green-500]="temp.is_compliant"
                    [class.bg-green-50]="temp.is_compliant"
                    [class.border-red-500]="!temp.is_compliant"
                    [class.bg-red-50]="!temp.is_compliant">
                    <div class="text-sm font-semibold">{{ temp.checkpoint }}</div>
                    <div class="text-2xl font-bold">{{ temp.temperature }}°C</div>
                    <div class="text-xs text-gray-600">{{ temp.control_date | date:'short' }}</div>
                  </div>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl mb-2">🍽️</div>
            <p>Aucun repas pour cette date</p>
          </div>
        }
      </div>

      <!-- Modal Repas -->
      @if (showMealModal()) {
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeMealModal()">
          <div class="modal-content bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold mb-4">{{ editingMeal() ? 'Modifier' : 'Ajouter' }} un repas</h2>
            <form (ngSubmit)="saveMeal()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Date *</label>
                  <input [(ngModel)]="mealFormData.date" name="date" type="date" required class="w-full px-3 py-2 border rounded">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Type de repas *</label>
                  <select [(ngModel)]="mealFormData.meal_type" name="meal_type" required class="w-full px-3 py-2 border rounded">
                    <option value="Breakfast">Petit-déjeuner</option>
                    <option value="Lunch">Déjeuner</option>
                    <option value="Snack">Goûter</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Description du menu *</label>
                <textarea [(ngModel)]="mealFormData.description" name="description" rows="3" required class="w-full px-3 py-2 border rounded"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Fournisseur</label>
                  <select [(ngModel)]="mealFormData.supplier_id" name="supplier_id" class="w-full px-3 py-2 border rounded">
                    <option value="">Aucun</option>
                    @for (supplier of suppliers(); track supplier.id) {
                      <option [value]="supplier.id">{{ supplier.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Responsable</label>
                  <input [(ngModel)]="mealFormData.responsible_id" name="responsible_id" class="w-full px-3 py-2 border rounded" placeholder="ID Employé">
                </div>
              </div>
              <div class="flex gap-2 justify-end">
                <button type="button" (click)="closeMealModal()" class="px-4 py-2 border rounded hover:bg-gray-50">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Température -->
      @if (showTempModal()) {
        <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeTempModal()">
          <div class="modal-content bg-white rounded-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold mb-4">Ajouter un contrôle de température</h2>
            <form (ngSubmit)="saveTemperature()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Point de contrôle *</label>
                <select [(ngModel)]="tempFormData.checkpoint" name="checkpoint" required class="w-full px-3 py-2 border rounded">
                  <option value="Reception">Réception</option>
                  <option value="Holding">Maintien</option>
                  <option value="Service">Service</option>
                  <option value="Storage">Stockage</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Température (°C) *</label>
                <input [(ngModel)]="tempFormData.temperature" name="temperature" type="number" step="0.1" required class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="flex items-center gap-2">
                  <input [(ngModel)]="tempFormData.is_compliant" name="is_compliant" type="checkbox" class="w-4 h-4">
                  <span>Conforme</span>
                </label>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Observations</label>
                <textarea [(ngModel)]="tempFormData.observations" name="observations" rows="2" class="w-full px-3 py-2 border rounded"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Date/Heure de contrôle *</label>
                <input [(ngModel)]="tempFormData.control_date" name="control_date" type="datetime-local" required class="w-full px-3 py-2 border rounded">
              </div>
              <div class="flex gap-2 justify-end">
                <button type="button" (click)="closeTempModal()" class="px-4 py-2 border rounded hover:bg-gray-50">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class MealsComponent implements OnInit {
  private haccpService = inject(HaccpService);

  meals = signal<Meal[]>([]);
  filteredMeals = signal<Meal[]>([]);
  temperatures = signal<Temperature[]>([]);
  suppliers = signal<Supplier[]>([]);
  children = signal<Child[]>([]);

  showMealModal = signal(false);
  showTempModal = signal(false);
  editingMeal = signal<Meal | null>(null);
  currentMealForTemp = signal<Meal | null>(null);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedMealType: 'Breakfast' | 'Lunch' | 'Snack' = 'Lunch';
  mealTypes: Array<'Breakfast' | 'Lunch' | 'Snack'> = ['Breakfast', 'Lunch', 'Snack'];

  mealFormData: Partial<Meal> = this.getEmptyMealForm();
  tempFormData: Partial<Temperature> = this.getEmptyTempForm();

  ngOnInit() {
    this.loadMealsForDate();
    this.loadSuppliers();
    this.loadChildren();
    this.loadTemperatures();
  }

  loadMealsForDate() {
    this.haccpService.getMeals().subscribe(meals => {
      const filtered = meals.filter(m => m.date === this.selectedDate);
      this.meals.set(filtered);
      this.applyMealTypeFilter();
    });
  }

  applyMealTypeFilter() {
    const filtered = this.meals().filter(m => m.meal_type === this.selectedMealType);
    this.filteredMeals.set(filtered);
  }

  loadSuppliers() {
    this.haccpService.getSuppliers().subscribe(s => this.suppliers.set(s));
  }

  loadChildren() {
    this.haccpService.getChildren(true).subscribe(c => this.children.set(c));
  }

  loadTemperatures() {
    this.haccpService.getTemperatures().subscribe(t => this.temperatures.set(t));
  }

  getTemperaturesForMeal(mealId: string): Temperature[] {
    return this.temperatures().filter(t => t.meal_id === mealId);
  }

  openModal() {
    this.mealFormData = this.getEmptyMealForm();
    this.mealFormData.date = this.selectedDate;
    this.mealFormData.meal_type = this.selectedMealType;
    this.editingMeal.set(null);
    this.showMealModal.set(true);
  }

  editMeal(meal: Meal) {
    this.mealFormData = { ...meal };
    this.editingMeal.set(meal);
    this.showMealModal.set(true);
  }

  closeMealModal() {
    this.showMealModal.set(false);
  }

  saveMeal() {
    const editing = this.editingMeal();
    if (editing) {
      this.haccpService.updateMeal(editing.id, this.mealFormData).subscribe(() => {
        this.loadMealsForDate();
        this.closeMealModal();
      });
    } else {
      this.haccpService.createMeal(this.mealFormData).subscribe(() => {
        this.loadMealsForDate();
        this.closeMealModal();
      });
    }
  }

  deleteMeal(meal: Meal) {
    if (confirm('Supprimer ce repas ?')) {
      this.haccpService.deleteMeal(meal.id).subscribe(() => this.loadMealsForDate());
    }
  }

  addTemperature(meal: Meal) {
    this.currentMealForTemp.set(meal);
    this.tempFormData = this.getEmptyTempForm();
    this.tempFormData.meal_id = meal.id;
    this.tempFormData.control_date = new Date().toISOString().slice(0, 16);
    this.showTempModal.set(true);
  }

  closeTempModal() {
    this.showTempModal.set(false);
  }

  saveTemperature() {
    this.haccpService.createTemperature(this.tempFormData).subscribe(() => {
      this.loadTemperatures();
      this.closeTempModal();
    });
  }

  getMealTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Breakfast': 'Petit-déjeuner',
      'Lunch': 'Déjeuner',
      'Snack': 'Goûter'
    };
    return labels[type] || type;
  }

  private getEmptyMealForm(): Partial<Meal> {
    return {
      date: this.selectedDate,
      meal_type: 'Lunch',
      description: '',
      supplier_id: undefined,
      batch_id: undefined,
      responsible_id: undefined
    };
  }

  private getEmptyTempForm(): Partial<Temperature> {
    return {
      meal_id: '',
      checkpoint: 'Reception',
      temperature: 0,
      is_compliant: true,
      observations: '',
      control_date: new Date().toISOString(),
      responsible_id: undefined
    };
  }
}
