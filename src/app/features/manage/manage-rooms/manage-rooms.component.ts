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
  editingRoomId: string | null = null;
  editDraft: any = {};
  
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
    // ensure display order is last
    const nextOrder = this.taskService.rooms().length;
    const payload = { ...this.newRoom, display_order: nextOrder };
    const created = await this.taskService.createRoom(payload);
    this.updateSortedRooms();
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
    this.editingRoomId = room.id;
    this.editDraft = { name: room.name, description: room.description, display_order: room.display_order, is_active: room.is_active };
  }
  
  async deleteRoom(room: any) {
    if (!confirm(`Supprimer la pièce "${room.name}" ?`)) return;
    await this.taskService.deleteRoom(room.id);
    this.updateSortedRooms();
  }
  
  async moveRoom(room: any, direction: number) {
    const rooms = this.sortedRooms();
    const idx = rooms.findIndex(r => r.id === room.id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= rooms.length) return;
    // swap display_order values
    const a = rooms[idx];
    const b = rooms[targetIdx];
    const tmp = a.display_order;
    a.display_order = b.display_order;
    b.display_order = tmp;
    // persist both updates sequentially
    await this.taskService.updateRoom(a.id, { display_order: a.display_order });
    await this.taskService.updateRoom(b.id, { display_order: b.display_order });
    await this.taskService.loadAllData();
    this.updateSortedRooms();
  }

  async saveEdit(room: any) {
    if (!this.editingRoomId) return;
    const updated = await this.taskService.updateRoom(this.editingRoomId, this.editDraft);
    this.editingRoomId = null;
    this.editDraft = {};
    this.updateSortedRooms();
  }

  cancelEdit() {
    this.editingRoomId = null;
    this.editDraft = {};
  }
}