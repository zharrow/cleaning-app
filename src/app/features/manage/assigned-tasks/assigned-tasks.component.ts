import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, AssignedTask, TaskTemplate, Room, Performer, FrequencyConfig } from '../../tasks/task.service';

@Component({
  selector: 'app-assigned-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Tâches Assignées</h1>
        <button 
          (click)="showModal = true" 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          + Assigner une tâche
        </button>
      </div>

      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tâche
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pièce
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exécutant
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fréquence
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure suggérée
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let task of taskService.assignedTasks()">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ task.task_template.name }}</div>
                  <div class="text-sm text-gray-500" *ngIf="task.task_template.description">{{ task.task_template.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ task.room.name }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">
                    {{ task.default_performer?.name || 'Non assigné' }}
                  </span>
                  @if (!task.default_performer) {
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded ml-2">
                      À assigner
                    </span>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">
                    {{ formatFrequency(task.frequency_days) }}
                  </span>
                  <div class="text-xs text-gray-500">{{ task.times_per_day }}x par jour</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">
                    {{ task.suggested_time || 'Non définie' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    (click)="editTask(task)" 
                    class="text-indigo-600 hover:text-indigo-900 mr-4">
                    Modifier
                  </button>
                  <button 
                    (click)="deleteTask(task.id)" 
                    class="text-red-600 hover:text-red-900">
                    Supprimer
                  </button>
                </td>
              </tr>
              <tr *ngIf="taskService.assignedTasks().length === 0">
                <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  Aucune tâche assignée
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">
                {{ editingTask ? 'Modifier' : 'Assigner' }} une tâche
              </h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
                <span class="sr-only">Fermer</span>
                ✕
              </button>
            </div>
            
            <form [formGroup]="assignForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tâche</label>
                <select formControlName="task_template_id" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Sélectionner une tâche</option>
                  <option *ngFor="let template of taskService.taskTemplates()" [value]="template.id">
                    {{ template.name || 'Titre manquant' }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pièce</label>
                <select formControlName="room_id" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Sélectionner une pièce</option>
                  <option *ngFor="let room of taskService.rooms()" [value]="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Exécutant par défaut 
                  <span class="text-gray-500 font-normal">(optionnel)</span>
                </label>
                <select formControlName="default_performer_id" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Aucun exécutant assigné</option>
                  <option *ngFor="let performer of taskService.performers()" [value]="performer.id">
                    {{ performer.name }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Type de fréquence</label>
                  <select (change)="onFrequencyTypeChange($event)" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                    <option value="occasional">Occasionnel</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fois par jour</label>
                  <input type="number" 
                         formControlName="times_per_day" 
                         min="1" max="10"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Heure suggérée</label>
                <input type="time" 
                       formControlName="suggested_time"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" 
                        (click)="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                  Annuler
                </button>
                <button type="submit" 
                        [disabled]="!isFormValid() || isSubmitting()"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                  {{ isSubmitting() ? 'Traitement...' : (editingTask ? 'Modifier' : 'Assigner') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssignedTasksComponent implements OnInit {
  taskService = inject(TaskService);
  fb = inject(FormBuilder);
  
  showModal = false;
  editingTask: AssignedTask | null = null;
  isSubmitting = signal(false);
  
  assignForm: FormGroup = this.fb.group({
    task_template_id: ['', Validators.required],
    room_id: ['', Validators.required],
    default_performer_id: [''], // Rendu optionnel - plus de Validators.required
    times_per_day: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    suggested_time: ['']
  });

  currentFrequency: FrequencyConfig = {
    type: 'daily',
    times_per_day: 1,
    days: []
  };

  ngOnInit() {
    console.log('🔄 Chargement des données TaskService...');
    this.taskService.loadAllData();
    
    // Log des données de l'ApiService pour debug
    console.log('📋 TaskTemplates depuis ApiService:', this.taskService.api.taskTemplates.value());
    console.log('🏠 Rooms depuis ApiService:', this.taskService.api.rooms.value());
  }

  formatFrequency(frequency: FrequencyConfig): string {
    switch (frequency.type) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'occasional': return 'Occasionnel';
      default: return 'Non défini';
    }
  }

  onFrequencyTypeChange(event: any) {
    this.currentFrequency.type = event.target.value as FrequencyConfig['type'];
  }

  editTask(task: AssignedTask) {
    this.editingTask = task;
    this.currentFrequency = { ...task.frequency_days };
    
    this.assignForm.patchValue({
      task_template_id: task.task_template.id,
      room_id: task.room.id,
      default_performer_id: task.default_performer.id,
      times_per_day: task.times_per_day,
      suggested_time: task.suggested_time || ''
    });
    
    this.showModal = true;
  }

  async deleteTask(taskId: string) {
    console.log('🗑️ Tentative de suppression de la tâche:', taskId);
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche assignée ?')) {
      try {
        console.log('✅ Confirmation reçue, suppression en cours...');
        await this.taskService.deleteAssignedTask(taskId);
        console.log('✅ Tâche supprimée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la tâche: ' + error);
      }
    } else {
      console.log('❌ Suppression annulée par l\'utilisateur');
    }
  }

  async onSubmit() {
    if (this.assignForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      
      try {
        const formData = this.assignForm.value;
        const assignmentData = {
          ...formData,
          frequency_days: this.currentFrequency
        };
        
        console.log('🔄 Données formulaire:', formData);
        console.log('🔄 Données envoyées:', assignmentData);

        if (this.editingTask) {
          await this.taskService.updateAssignedTask(this.editingTask.id, assignmentData);
        } else {
          await this.taskService.assignTask(assignmentData);
        }
        
        this.closeModal();
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        alert('Erreur lors de la sauvegarde');
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  closeModal() {
    this.showModal = false;
    this.editingTask = null;
    this.assignForm.reset();
    this.currentFrequency = {
      type: 'daily',
      times_per_day: 1,
      days: []
    };
    this.assignForm.patchValue({
      times_per_day: 1
    });
  }

  // Validation personnalisée qui ignore le performer
  isFormValid(): boolean {
    const taskTemplate = this.assignForm.get('task_template_id')?.value;
    const room = this.assignForm.get('room_id')?.value;
    const timesPerDay = this.assignForm.get('times_per_day')?.value;
    
    return !!(taskTemplate && room && timesPerDay && timesPerDay > 0);
  }

}