import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HaccpService, Meal, Child } from '../../../core/services/haccp.service';

@Component({
  selector: 'app-tablet-haccp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tablet-haccp min-h-screen bg-gray-50 p-8">
      <!-- Header -->
      <div class="header flex justify-between items-center mb-8">
        <button (click)="goBack()" class="btn-back px-6 py-3 bg-gray-600 text-white rounded-lg text-xl font-semibold hover:bg-gray-700">
          ← Retour
        </button>
        <h1 class="text-4xl font-bold">HACCP - Saisie</h1>
        <div class="w-32"></div> <!-- Spacer -->
      </div>

      <!-- Choix type de saisie -->
      @if (!selectedType()) {
        <div class="type-selection grid grid-cols-2 gap-8">
          <button
            (click)="selectType('meal')"
            class="type-card bg-white p-12 rounded-2xl shadow-lg hover:shadow-xl transition-all text-center">
            <div class="text-8xl mb-4">🍽️</div>
            <h2 class="text-3xl font-bold">Enregistrer un repas</h2>
          </button>
          <button
            (click)="selectType('temperature')"
            class="type-card bg-white p-12 rounded-2xl shadow-lg hover:shadow-xl transition-all text-center">
            <div class="text-8xl mb-4">🌡️</div>
            <h2 class="text-3xl font-bold">Contrôle température</h2>
          </button>
        </div>
      }

      <!-- Formulaire Repas -->
      @if (selectedType() === 'meal') {
        <div class="meal-form bg-white p-8 rounded-2xl shadow-lg">
          <h2 class="text-3xl font-bold mb-6">Enregistrer un repas</h2>
          <form (ngSubmit)="saveMeal()" class="space-y-6">
            <!-- Type de repas -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Type de repas *</label>
              <div class="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  (click)="mealForm.meal_type = 'BREAKFAST'"
                  [class.bg-blue-600]="mealForm.meal_type === 'BREAKFAST'"
                  [class.text-white]="mealForm.meal_type === 'BREAKFAST'"
                  [class.bg-gray-200]="mealForm.meal_type !== 'BREAKFAST'"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  Petit-déjeuner
                </button>
                <button
                  type="button"
                  (click)="mealForm.meal_type = 'LUNCH'"
                  [class.bg-blue-600]="mealForm.meal_type === 'LUNCH'"
                  [class.text-white]="mealForm.meal_type === 'LUNCH'"
                  [class.bg-gray-200]="mealForm.meal_type !== 'LUNCH'"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  Déjeuner
                </button>
                <button
                  type="button"
                  (click)="mealForm.meal_type = 'SNACK'"
                  [class.bg-blue-600]="mealForm.meal_type === 'SNACK'"
                  [class.text-white]="mealForm.meal_type === 'SNACK'"
                  [class.bg-gray-200]="mealForm.meal_type !== 'SNACK'"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  Goûter
                </button>
              </div>
            </div>

            <!-- Description menu -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Menu *</label>
              <textarea
                [(ngModel)]="mealForm.description"
                name="description"
                rows="4"
                required
                placeholder="Décrivez le menu..."
                class="w-full px-6 py-4 text-2xl border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <!-- Enfants (checkboxes) -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Enfants servis</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                @for (child of children(); track child.id) {
                  <label class="child-checkbox flex items-center gap-3 p-4 border-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="selectedChildren().includes(child.id)"
                      (change)="toggleChild(child.id)"
                      class="w-8 h-8">
                    <div>
                      <div class="text-xl font-semibold">{{ child.first_name }} {{ child.last_name }}</div>
                      @if (child.allergies) {
                        <div class="text-sm text-red-600">⚠️ {{ child.allergies }}</div>
                      }
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Boutons -->
            <div class="flex gap-4">
              <button type="button" (click)="cancel()" class="flex-1 py-6 px-8 text-2xl font-semibold bg-gray-300 rounded-xl hover:bg-gray-400">
                Annuler
              </button>
              <button type="submit" class="flex-1 py-6 px-8 text-2xl font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Formulaire Température -->
      @if (selectedType() === 'temperature') {
        <div class="temp-form bg-white p-8 rounded-2xl shadow-lg">
          <h2 class="text-3xl font-bold mb-6">Contrôle de température</h2>
          <form (ngSubmit)="saveTemperature()" class="space-y-6">
            <!-- Sélection repas -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Repas *</label>
              <select
                [(ngModel)]="tempForm.meal_id"
                name="meal"
                required
                class="w-full px-6 py-4 text-2xl border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sélectionner un repas</option>
                @for (meal of todayMeals(); track meal.id) {
                  <option [value]="meal.id">{{ getMealLabel(meal) }}</option>
                }
              </select>
            </div>

            <!-- Point de contrôle -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Point de contrôle *</label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  *ngFor="let checkpoint of checkpoints"
                  (click)="setCheckpoint(checkpoint.value)"
                  [class.bg-blue-600]="tempForm.checkpoint === checkpoint.value"
                  [class.text-white]="tempForm.checkpoint === checkpoint.value"
                  [class.bg-gray-200]="tempForm.checkpoint !== checkpoint.value"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  {{ checkpoint.label }}
                </button>
              </div>
            </div>

            <!-- Température -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Température (°C) *</label>
              <input
                [(ngModel)]="tempForm.temperature"
                name="temperature"
                type="number"
                step="0.1"
                required
                class="w-full px-6 py-4 text-3xl font-bold border-2 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Conforme -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Conforme ?</label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  (click)="tempForm.is_compliant = true"
                  [class.bg-green-600]="tempForm.is_compliant"
                  [class.text-white]="tempForm.is_compliant"
                  [class.bg-gray-200]="!tempForm.is_compliant"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  ✅ OUI
                </button>
                <button
                  type="button"
                  (click)="tempForm.is_compliant = false"
                  [class.bg-red-600]="!tempForm.is_compliant"
                  [class.text-white]="!tempForm.is_compliant"
                  [class.bg-gray-200]="tempForm.is_compliant"
                  class="py-6 rounded-xl text-2xl font-semibold">
                  ❌ NON
                </button>
              </div>
            </div>

            <!-- Observations -->
            <div>
              <label class="block text-2xl font-semibold mb-3">Observations</label>
              <textarea
                [(ngModel)]="tempForm.observations"
                name="observations"
                rows="3"
                placeholder="Remarques..."
                class="w-full px-6 py-4 text-2xl border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <!-- Boutons -->
            <div class="flex gap-4">
              <button type="button" (click)="cancel()" class="flex-1 py-6 px-8 text-2xl font-semibold bg-gray-300 rounded-xl hover:bg-gray-400">
                Annuler
              </button>
              <button type="submit" class="flex-1 py-6 px-8 text-2xl font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class TabletHaccpComponent {
  private haccpService = inject(HaccpService);
  private router = inject(Router);

  selectedType = signal<'meal' | 'temperature' | null>(null);
  children = signal<Child[]>([]);
  todayMeals = signal<Meal[]>([]);
  selectedChildren = signal<string[]>([]);

  checkpoints = [
    { value: 'RECEPTION', label: 'Réception' },
    { value: 'HOLDING', label: 'Maintien' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'STORAGE', label: 'Stockage' }
  ];

  mealForm = {
    date: new Date().toISOString().split('T')[0],
    meal_type: 'LUNCH' as 'BREAKFAST' | 'LUNCH' | 'SNACK',
    description: ''
  };

  tempForm = {
    meal_id: '',
    checkpoint: 'RECEPTION' as 'RECEPTION' | 'HOLDING' | 'SERVICE' | 'STORAGE',
    temperature: 0,
    is_compliant: true,
    observations: '',
    control_date: new Date().toISOString()
  };

  ngOnInit() {
    this.loadChildren();
    this.loadTodayMeals();
  }

  loadChildren() {
    this.haccpService.getChildren(true).subscribe(c => this.children.set(c));
  }

  loadTodayMeals() {
    const today = new Date().toISOString().split('T')[0];
    this.haccpService.getMeals().subscribe(meals => {
      const todayMeals = meals.filter(m => m.date === today);
      this.todayMeals.set(todayMeals);
    });
  }

  selectType(type: 'meal' | 'temperature') {
    this.selectedType.set(type);
  }

  toggleChild(childId: string) {
    const current = this.selectedChildren();
    if (current.includes(childId)) {
      this.selectedChildren.set(current.filter(id => id !== childId));
    } else {
      this.selectedChildren.set([...current, childId]);
    }
  }

  setCheckpoint(value: string) {
    this.tempForm.checkpoint = value as 'RECEPTION' | 'HOLDING' | 'SERVICE' | 'STORAGE';
  }

  saveMeal() {
    this.haccpService.createMeal(this.mealForm).subscribe({
      next: () => {
        alert('Repas enregistré avec succès !');
        this.goBack();
      },
      error: () => alert('Erreur lors de l\'enregistrement')
    });
  }

  saveTemperature() {
    this.haccpService.createTemperature(this.tempForm).subscribe({
      next: (temp) => {
        if (!temp.is_compliant) {
          alert('⚠️ ALERTE: Température non conforme ! L\'admin a été notifié.');
        } else {
          alert('Contrôle de température enregistré !');
        }
        this.goBack();
      },
      error: () => alert('Erreur lors de l\'enregistrement')
    });
  }

  cancel() {
    this.selectedType.set(null);
  }

  goBack() {
    this.router.navigate(['/tablet']);
  }

  getMealLabel(meal: Meal): string {
    const types: Record<string, string> = {
      'BREAKFAST': 'Petit-déjeuner',
      'LUNCH': 'Déjeuner',
      'SNACK': 'Goûter'
    };
    return `${types[meal.meal_type]} - ${meal.description?.substring(0, 30) || 'Sans description'}`;
  }
}
