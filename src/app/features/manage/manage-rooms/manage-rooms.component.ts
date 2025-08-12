import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TaskService } from '../../tasks/task.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-manage-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './manage-rooms.component.html',
  styleUrl: './manage-rooms.component.css'
})
export class ManageRoomsComponent implements OnInit {
  taskService = inject(TaskService);
  
  showAddForm = false;
  newRoom = {
    name: '',
    description: '',
    display_order: 0
  };
  
  sortedRooms = signal<any[]>([]);
  
  ngOnInit() {
    this.loadData();
  }
  
  async loadData() {
    await this.taskService.loadAllData();
    this.updateSortedRooms();
  }
  
  updateSortedRooms() {
    const rooms = [...this.taskService.rooms()];
    rooms.sort((a, b) => a.display_order - b.display_order);
    this.sortedRooms.set(rooms);
  }
  
  async saveNewRoom() {
    if (!this.newRoom.name) return;
    
    // TODO: Implémenter la création via l'API
    console.log('Saving new room:', this.newRoom);
    
    // Reset form
    this.cancelAdd();
  }
  
  cancelAdd() {
    this.showAddForm = false;
    this.newRoom = {
      name: '',
      description: '',
      display_order: this.taskService.rooms().length
    };
  }
  
  editRoom(room: any) {
    console.log('Edit room:', room);
    // TODO: Implémenter l'édition
  }
  
  deleteRoom(room: any) {
    if (confirm(`Supprimer la pièce "${room.name}" ?`)) {
      console.log('Delete room:', room);
      // TODO: Implémenter la suppression
    }
  }
  
  moveRoom(room: any, direction: number) {
    console.log('Move room:', room, direction);
    // TODO: Implémenter le changement d'ordre
  }
}