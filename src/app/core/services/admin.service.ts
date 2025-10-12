/**
 * Service for managing Admins (Daycare managers with Firebase auth)
 * Angular 19 with Signals and Resource API
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { resource, ResourceRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Admin,
  AdminCreate,
  AdminUpdate,
  AdminResponse
} from '../../shared/models/user.models';

export interface EnterpriseCreate {
  readonly name: string;
  readonly address?: string;
  readonly phone?: string;
  readonly siret?: string;
}

export interface EnterpriseResponse {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly phone?: string;
  readonly siret?: string;
  readonly admin_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins`;

  // Signals
  readonly refreshTrigger = signal(0);
  readonly selectedAdminId = signal<string | null>(null);

  // Resource for all admins
  readonly adminsResource: ResourceRef<AdminResponse[]> = resource({
    request: () => ({ trigger: this.refreshTrigger() }),
    loader: async () => {
      try {
        return await firstValueFrom(
          this.http.get<AdminResponse[]>(this.apiUrl)
        );
      } catch (error) {
        console.error('Error loading admins:', error);
        throw error;
      }
    }
  });

  // Resource for single admin
  readonly adminResource: ResourceRef<AdminResponse | null> = resource({
    request: () => ({ id: this.selectedAdminId() }),
    loader: async ({ request }) => {
      if (!request.id) return null;

      try {
        return await firstValueFrom(
          this.http.get<AdminResponse>(`${this.apiUrl}/${request.id}`)
        );
      } catch (error) {
        console.error('Error loading admin:', error);
        throw error;
      }
    }
  });

  // Computed signals
  readonly admins = computed(() => this.adminsResource.value() ?? []);
  readonly activeAdmins = computed(() =>
    this.admins().filter(admin => admin.is_active)
  );
  readonly isLoading = computed(() =>
    this.adminsResource.isLoading() || this.adminResource.isLoading()
  );
  readonly error = computed(() =>
    this.adminsResource.error() || this.adminResource.error()
  );

  /**
   * Create a new admin (Developer only)
   */
  async createAdmin(data: AdminCreate): Promise<AdminResponse> {
    try {
      const admin = await firstValueFrom(
        this.http.post<AdminResponse>(this.apiUrl, data)
      );
      this.refreshTrigger.update(v => v + 1);
      return admin;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Update an admin
   */
  async updateAdmin(id: string, data: AdminUpdate): Promise<AdminResponse> {
    try {
      const admin = await firstValueFrom(
        this.http.patch<AdminResponse>(`${this.apiUrl}/${id}`, data)
      );
      this.refreshTrigger.update(v => v + 1);
      return admin;
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  }

  /**
   * Deactivate an admin (soft delete)
   */
  async deactivateAdmin(id: string): Promise<AdminResponse> {
    try {
      const admin = await firstValueFrom(
        this.http.patch<AdminResponse>(`${this.apiUrl}/${id}`, { is_active: false })
      );
      this.refreshTrigger.update(v => v + 1);
      return admin;
    } catch (error) {
      console.error('Error deactivating admin:', error);
      throw error;
    }
  }

  /**
   * Permanently delete an admin (Developer only)
   */
  async deleteAdmin(id: string): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(
        this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`)
      );
      this.refreshTrigger.update(v => v + 1);
      return result;
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw error;
    }
  }

  /**
   * Get admin's enterprise
   */
  async getAdminEnterprise(adminId: string): Promise<EnterpriseResponse> {
    try {
      return await firstValueFrom(
        this.http.get<EnterpriseResponse>(`${this.apiUrl}/${adminId}/enterprise`)
      );
    } catch (error) {
      console.error('Error loading admin enterprise:', error);
      throw error;
    }
  }

  /**
   * Create enterprise for admin
   */
  async createAdminEnterprise(adminId: string, data: EnterpriseCreate): Promise<EnterpriseResponse> {
    try {
      const enterprise = await firstValueFrom(
        this.http.post<EnterpriseResponse>(`${this.apiUrl}/${adminId}/enterprise`, data)
      );
      this.refreshTrigger.update(v => v + 1);
      return enterprise;
    } catch (error) {
      console.error('Error creating admin enterprise:', error);
      throw error;
    }
  }

  /**
   * Select an admin for detail view
   */
  selectAdmin(id: string | null): void {
    this.selectedAdminId.set(id);
  }

  /**
   * Refresh admins list
   */
  refresh(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  /**
   * Get admin by ID (from cache)
   */
  getAdminById(id: string): AdminResponse | undefined {
    return this.admins().find(admin => admin.id === id);
  }
}
