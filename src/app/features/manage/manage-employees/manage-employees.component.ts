import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { UserCreate, UserUpdate, UserResponse, UserPinUpdate } from '../../../shared/models/user.models';

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email?: string;
  pin_code: string;
  is_active: boolean;
}

@Component({
  selector: 'app-manage-employees',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-employees.component.html',
  styleUrl: './manage-employees.component.css'
})
export class ManageEmployeesComponent {
  private readonly employeeService = inject(EmployeeService);

  // Signals
  readonly employees = this.employeeService.employees;
  readonly isLoading = this.employeeService.isLoading;
  readonly showModal = signal(false);
  readonly showPinModal = signal(false);
  readonly showRoomsModal = signal(false);
  readonly editingEmployee = signal<UserResponse | null>(null);
  readonly selectedEmployeeForPin = signal<UserResponse | null>(null);
  readonly selectedEmployeeForRooms = signal<UserResponse | null>(null);
  readonly formData = signal<EmployeeFormData>({
    first_name: '',
    last_name: '',
    email: '',
    pin_code: '',
    is_active: true
  });
  readonly newPin = signal('');
  readonly confirmPin = signal('');
  readonly selectedRoomIds = signal<string[]>([]);
  readonly searchTerm = signal('');
  readonly filterActive = signal<'all' | 'active' | 'inactive'>('active');

  // Computed
  readonly filteredEmployees = computed(() => {
    let filtered = this.employees();

    // Filter by active status
    if (this.filterActive() === 'active') {
      filtered = filtered.filter(emp => emp.is_active);
    } else if (this.filterActive() === 'inactive') {
      filtered = filtered.filter(emp => !emp.is_active);
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(emp =>
        emp.first_name.toLowerCase().includes(search) ||
        emp.last_name.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  readonly activeEmployeesCount = computed(() =>
    this.employees().filter(emp => emp.is_active).length
  );

  readonly inactiveEmployeesCount = computed(() =>
    this.employees().filter(emp => !emp.is_active).length
  );

  readonly isEditMode = computed(() => !!this.editingEmployee());
  readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier l\'employé' : 'Nouvel employé'
  );

  readonly canSavePin = computed(() => {
    const newPin = this.newPin();
    const confirmPin = this.confirmPin();
    return newPin.length >= 4 && newPin.length <= 6 && newPin === confirmPin;
  });

  /**
   * Open create modal
   */
  openCreateModal(): void {
    this.editingEmployee.set(null);
    this.formData.set({
      first_name: '',
      last_name: '',
      email: '',
      pin_code: '',
      is_active: true
    });
    this.showModal.set(true);
  }

  /**
   * Open edit modal
   */
  openEditModal(employee: UserResponse): void {
    this.editingEmployee.set(employee);
    this.formData.set({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      pin_code: '', // Don't show existing PIN
      is_active: employee.is_active
    });
    this.showModal.set(true);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.editingEmployee.set(null);
  }

  /**
   * Save employee (create or update)
   */
  async saveEmployee(): Promise<void> {
    const data = this.formData();

    try {
      if (this.isEditMode()) {
        // Update existing employee
        const employeeId = this.editingEmployee()!.id;
        const updateData: UserUpdate = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || undefined,
          is_active: data.is_active
        };

        await this.employeeService.updateEmployee(employeeId, updateData);

        // Update PIN if provided
        if (data.pin_code.length >= 4) {
          await this.employeeService.updateEmployeePin(employeeId, {
            pin_code: data.pin_code
          });
        }
      } else {
        // Create new employee
        const createData: UserCreate = {
          first_name: data.first_name,
          last_name: data.last_name,
          pin_code: data.pin_code,
          email: data.email || undefined
        };

        await this.employeeService.createEmployee(createData);
      }

      this.closeModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Erreur lors de l\'enregistrement de l\'employé');
    }
  }

  /**
   * Open PIN change modal
   */
  openPinModal(employee: UserResponse): void {
    this.selectedEmployeeForPin.set(employee);
    this.newPin.set('');
    this.confirmPin.set('');
    this.showPinModal.set(true);
  }

  /**
   * Close PIN modal
   */
  closePinModal(): void {
    this.showPinModal.set(false);
    this.selectedEmployeeForPin.set(null);
    this.newPin.set('');
    this.confirmPin.set('');
  }

  /**
   * Save new PIN
   */
  async savePinCode(): Promise<void> {
    if (!this.canSavePin()) return;

    const employee = this.selectedEmployeeForPin();
    if (!employee) return;

    try {
      const pinData: UserPinUpdate = {
        pin_code: this.newPin()
      };

      await this.employeeService.updateEmployeePin(employee.id, pinData);
      this.closePinModal();
      alert('Code PIN modifié avec succès');
    } catch (error) {
      console.error('Error updating PIN:', error);
      alert('Erreur lors de la modification du code PIN');
    }
  }

  /**
   * Toggle employee active status
   */
  async toggleActiveStatus(employee: UserResponse): Promise<void> {
    if (!confirm(`Voulez-vous vraiment ${employee.is_active ? 'désactiver' : 'activer'} ${employee.full_name} ?`)) {
      return;
    }

    try {
      const updateData: UserUpdate = {
        is_active: !employee.is_active
      };

      await this.employeeService.updateEmployee(employee.id, updateData);
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Erreur lors de la modification du statut');
    }
  }

  /**
   * Delete employee permanently
   */
  async deleteEmployee(employee: UserResponse): Promise<void> {
    const confirmMsg = `⚠️ ATTENTION : Voulez-vous vraiment SUPPRIMER DÉFINITIVEMENT ${employee.full_name} ?\n\nCette action est irréversible et supprimera toutes les données associées.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      await this.employeeService.deleteEmployee(employee.id);
      alert('Employé supprimé définitivement');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Erreur lors de la suppression. L\'employé a peut-être des tâches assignées.');
    }
  }

  /**
   * Open rooms management modal
   */
  async openRoomsModal(employee: UserResponse): Promise<void> {
    this.selectedEmployeeForRooms.set(employee);

    try {
      const roomIds = await this.employeeService.getEmployeeRooms(employee.id);
      this.selectedRoomIds.set(roomIds);
      this.showRoomsModal.set(true);
    } catch (error) {
      console.error('Error loading employee rooms:', error);
      alert('Erreur lors du chargement des salles');
    }
  }

  /**
   * Close rooms modal
   */
  closeRoomsModal(): void {
    this.showRoomsModal.set(false);
    this.selectedEmployeeForRooms.set(null);
    this.selectedRoomIds.set([]);
  }

  /**
   * Toggle room selection
   */
  toggleRoomSelection(roomId: string): void {
    const currentIds = this.selectedRoomIds();
    if (currentIds.includes(roomId)) {
      this.selectedRoomIds.set(currentIds.filter(id => id !== roomId));
    } else {
      this.selectedRoomIds.set([...currentIds, roomId]);
    }
  }

  /**
   * Save room assignments
   */
  async saveRoomAssignments(): Promise<void> {
    const employee = this.selectedEmployeeForRooms();
    if (!employee) return;

    try {
      await this.employeeService.updateEmployeeRooms(
        employee.id,
        this.selectedRoomIds()
      );
      this.closeRoomsModal();
      alert('Accès aux salles mis à jour');
    } catch (error) {
      console.error('Error updating room assignments:', error);
      alert('Erreur lors de la mise à jour des accès');
    }
  }

  /**
   * Update form field
   */
  updateField<K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
