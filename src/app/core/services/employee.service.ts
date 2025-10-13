/**
 * Service for managing Employees (Users with PIN authentication)
 * Angular 19 with Signals and Resource API
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { resource, ResourceRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  User,
  UserCreate,
  UserUpdate,
  UserPinUpdate,
  UserResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserRoomsBulkUpdate
} from '../../shared/models/user.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly api = inject(ApiService);
  private readonly apiUrl = `/employees`;

  // Signals
  readonly refreshTrigger = signal(0);
  readonly selectedEmployeeId = signal<string | null>(null);

  // Resource for all employees
  readonly employeesResource = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      try {
        return await firstValueFrom(this.api.get<UserResponse[]>(this.apiUrl));
      } catch (error) {
        console.error('Error loading employees:', error);
        throw error;
      }
    }
  });

  // Resource for single employee
  readonly employeeResource = resource({
    request: () => ({ id: this.selectedEmployeeId() }),
    loader: async ({ request }) => {
      if (!request.id) return null;

      try {
        return await firstValueFrom(this.api.get<UserResponse>(`${this.apiUrl}/${request.id}`));
      } catch (error) {
        console.error('Error loading employee:', error);
        throw error;
      }
    }
  });

  // Computed signals
  readonly employees = computed(() => this.employeesResource.value() ?? []);
  readonly activeEmployees = computed(() =>
    this.employees().filter(emp => emp.is_active)
  );
  readonly isLoading = computed(() =>
    this.employeesResource.isLoading() || this.employeeResource.isLoading()
  );
  readonly error = computed(() =>
    this.employeesResource.error() || this.employeeResource.error()
  );

  /**
   * Create a new employee
   */
  async createEmployee(data: UserCreate): Promise<UserResponse> {
    try {
      const employee = await firstValueFrom(this.api.post<UserResponse>(this.apiUrl, data));
      this.refreshTrigger.update(v => v + 1);
      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: string, data: UserUpdate): Promise<UserResponse> {
    try {
      const employee = await firstValueFrom(this.api.patch<UserResponse>(`${this.apiUrl}/${id}`, data));
      this.refreshTrigger.update(v => v + 1);
      return employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Update employee PIN code
   */
  async updateEmployeePin(id: string, data: UserPinUpdate): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(this.api.patch<{ message: string }>(`${this.apiUrl}/${id}/pin`, data));
      return result;
    } catch (error) {
      console.error('Error updating employee PIN:', error);
      throw error;
    }
  }

  /**
   * Soft delete (deactivate) an employee
   */
  async deactivateEmployee(id: string): Promise<UserResponse> {
    try {
      const employee = await firstValueFrom(this.api.patch<UserResponse>(`${this.apiUrl}/${id}`, { is_active: false }));
      this.refreshTrigger.update(v => v + 1);
      return employee;
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  }

  /**
   * Hard delete (permanent) an employee
   */
  async deleteEmployee(id: string): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(this.api.delete<{ message: string }>(`${this.apiUrl}/${id}`));
      this.refreshTrigger.update(v => v + 1);
      return result;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Get accessible rooms for an employee
   */
  async getEmployeeRooms(id: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(this.api.get<{ room_ids: string[] }>(`${this.apiUrl}/${id}/rooms`));
      return response.room_ids;
    } catch (error) {
      console.error('Error loading employee rooms:', error);
      throw error;
    }
  }

  /**
   * Update accessible rooms for an employee
   */
  async updateEmployeeRooms(id: string, roomIds: string[]): Promise<string[]> {
    try {
      const data: UserRoomsBulkUpdate = { room_ids: roomIds };
      const response = await firstValueFrom(this.api.put<{ room_ids: string[] }>(`${this.apiUrl}/${id}/rooms`, data));
      this.refreshTrigger.update(v => v + 1);
      return response.room_ids;
    } catch (error) {
      console.error('Error updating employee rooms:', error);
      throw error;
    }
  }

  /**
   * PIN authentication for employees
   */
  async loginWithPin(pinCode: string, enterpriseId: string): Promise<UserLoginResponse> {
    try {
      const data: UserLoginRequest = {
        pin_code: pinCode,
        enterprise_id: enterpriseId
      };
      return await firstValueFrom(this.api.post<UserLoginResponse>(`${this.apiUrl}/login`, data));
    } catch (error) {
      console.error('Error logging in with PIN:', error);
      throw error;
    }
  }

  /**
   * Select an employee for detail view
   */
  selectEmployee(id: string | null): void {
    this.selectedEmployeeId.set(id);
  }

  /**
   * Refresh employees list
   */
  refresh(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  /**
   * Get employee by ID (from cache)
   */
  getEmployeeById(id: string): UserResponse | undefined {
    return this.employees().find(emp => emp.id === id);
  }
}
