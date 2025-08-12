import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TaskService } from '../../tasks/task.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-manage-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './manage-tasks.component.html',
  styleUrl: './manage-tasks.component.css'
})
export class ManageTasksComponent implements OnInit {
  taskService = inject(TaskService);
  
  showAddForm = false;
  newTask = {
    name: '',
    description: '',
    room_id: '',
    default_performer_id: '',
    frequency_days: 1
  };
  
  ngOnInit() {
    this.loadData();
  }
  
  async loadData() {
    await this.taskService.loadAllData();
  }
  
  isNewTaskValid(): boolean {
    return !!(this.newTask.name && this.newTask.room_id && this.newTask.default_performer_id);
  }
  
  async saveNewTask() {
    if (!this.isNewTaskValid()) return;
    
    // TODO: Implémenter la création via l'API
    console.log('Saving new task:', this.newTask);
    
    // Reset form
    this.cancelAdd();
  }
  
  cancelAdd() {
    this.showAddForm = false;
    this.newTask = {
      name: '',
      description: '',
      room_id: '',
      default_performer_id: '',
      frequency_days: 1
    };
  }
  
  editTask(task: any) {
    console.log('Edit task:', task);
    // TODO: Implémenter l'édition
  }
  
  deleteTask(task: any) {
    if (confirm(`Supprimer la tâche "${task.task_template.name}" ?`)) {
      console.log('Delete task:', task);
      // TODO: Implémenter la suppression
    }
  }
}