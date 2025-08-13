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
  editingTaskId: string | null = null;
  editDraft: any = {};
  
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
    // Create a task template then assign it
    const template = await this.taskService.createTaskTemplate({
      name: this.newTask.name,
      description: this.newTask.description,
      is_active: true
    });
    await this.taskService.assignTask({
      task_template_id: template.id,
      room_id: this.newTask.room_id,
      default_performer_id: this.newTask.default_performer_id,
      frequency_days: this.newTask.frequency_days ?? 1,
      is_active: true
    });
    await this.taskService.loadAllData();
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
    this.editingTaskId = task.id;
    this.editDraft = {
      frequency_days: task.frequency_days,
      times_per_day: task.times_per_day,
      suggested_time: task.suggested_time,
      is_active: task.is_active,
      room_id: task.room.id,
      default_performer_id: task.default_performer.id
    };
  }
  
  async deleteTask(task: any) {
    if (!confirm(`Supprimer la tâche "${task.task_template.name}" ?`)) return;
    await this.taskService.deleteAssignedTask(task.id);
    await this.taskService.loadAllData();
  }

  async saveEdit(task: any) {
    if (!this.editingTaskId) return;
    await this.taskService.updateAssignedTask(this.editingTaskId, this.editDraft);
    this.editingTaskId = null;
    this.editDraft = {};
    await this.taskService.loadAllData();
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editDraft = {};
  }
}