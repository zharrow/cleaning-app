// ========================================
// Service Enterprise Angular 19
// src/app/core/services/enterprise.service.ts
// ========================================
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { Auth } from '@angular/fire/auth';

/**
 * Types pour la gestion des entreprises
 */
export interface Enterprise {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly logo_url?: string;
  readonly legal_form?: string;
  readonly siret?: string;
  readonly is_complete: boolean;
  readonly created_at: string;
  readonly updated_at?: string;
}

export interface EnterpriseBasicInfo {
  readonly name: string;
  readonly logo_url?: string;
}

export interface CreateEnterpriseData {
  readonly name: string;
  readonly logo_url?: string;
  readonly legal_form?: string;
  readonly siret?: string;
}

export interface UpdateEnterpriseData {
  readonly name?: string;
  readonly logo_url?: string;
  readonly legal_form?: string;
  readonly siret?: string;
}

export interface EnterpriseExistsResponse {
  readonly exists: boolean;
  readonly is_complete: boolean;
}

/**
 * Service de gestion des entreprises
 * Utilise les nouveautés Angular 19 (signals, resource)
 */
@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  // Services injectés
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  
  // URL de base pour l'API
  private readonly baseUrl = `${environment.apiUrl}/enterprise`;
  
  // Signals d'état
  private readonly _enterprise = signal<Enterprise | null>(null);
  private readonly _basicInfo = signal<EnterpriseBasicInfo | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  // Signals publics (readonly)
  readonly enterprise = this._enterprise.asReadonly();
  readonly currentEnterprise = this._enterprise.asReadonly(); // Alias for compatibility
  readonly basicInfo = this._basicInfo.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasEnterprise = computed(() => this._enterprise() !== null);
  readonly enterpriseName = computed(() => this._basicInfo()?.name || '');
  readonly enterpriseLogo = computed(() => this._basicInfo()?.logo_url || null);
  readonly isEnterpriseComplete = computed(() => this._enterprise()?.is_complete || false);
  
  /**
   * Obtenir les headers d'authentification
   */
  private async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Vérifier si l'utilisateur a une entreprise
   */
  async checkEnterpriseExists(): Promise<EnterpriseExistsResponse> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      const response = await firstValueFrom(
        this.http.get<EnterpriseExistsResponse>(`${this.baseUrl}/exists`, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      return response;
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Récupérer les données complètes de l'entreprise
   */
  async getMyEnterprise(): Promise<Enterprise> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      const enterprise = await firstValueFrom(
        this.http.get<Enterprise>(`${this.baseUrl}/me`, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      this._enterprise.set(enterprise);
      return enterprise;
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Récupérer les informations de base (nom + logo) pour le header
   */
  async getBasicInfo(): Promise<EnterpriseBasicInfo> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      const basicInfo = await firstValueFrom(
        this.http.get<EnterpriseBasicInfo>(`${this.baseUrl}/me/basic`, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      this._basicInfo.set(basicInfo);
      return basicInfo;
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Créer une nouvelle entreprise
   */
  async createEnterprise(data: CreateEnterpriseData): Promise<Enterprise> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      const enterprise = await firstValueFrom(
        this.http.post<Enterprise>(this.baseUrl, data, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      this._enterprise.set(enterprise);
      this._basicInfo.set({
        name: enterprise.name,
        logo_url: enterprise.logo_url
      });
      
      return enterprise;
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Mettre à jour l'entreprise
   */
  async updateEnterprise(data: UpdateEnterpriseData): Promise<Enterprise> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      const enterprise = await firstValueFrom(
        this.http.put<Enterprise>(`${this.baseUrl}/me`, data, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      this._enterprise.set(enterprise);
      this._basicInfo.set({
        name: enterprise.name,
        logo_url: enterprise.logo_url
      });
      
      return enterprise;
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Supprimer l'entreprise
   */
  async deleteEnterprise(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const headers = await this.getAuthHeaders();
      
      await firstValueFrom(
        this.http.delete<void>(`${this.baseUrl}/me`, { headers })
          .pipe(
            catchError(this.handleError.bind(this))
          )
      );
      
      this._enterprise.set(null);
      this._basicInfo.set(null);
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Charger les données au démarrage de l'application
   */
  async loadEnterpriseData(): Promise<void> {
    try {
      const exists = await this.checkEnterpriseExists();
      
      if (exists.exists) {
        await this.getBasicInfo();
        // On peut charger les données complètes si nécessaire
        // await this.getMyEnterprise();
      }
    } catch (error) {
      console.warn('Impossible de charger les données de l\'entreprise:', error);
    }
  }
  
  /**
   * Réinitialiser l'état du service
   */
  resetState(): void {
    this._enterprise.set(null);
    this._basicInfo.set(null);
    this._isLoading.set(false);
    this._error.set(null);
  }
  
  /**
   * Gestionnaire d'erreurs HTTP
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur Enterprise Service:', error);
    return throwError(() => error);
  }
  
  /**
   * Extraction du message d'erreur
   */
  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as HttpErrorResponse;
      if (httpError.error?.detail) {
        return httpError.error.detail;
      }
      if (httpError.message) {
        return httpError.message;
      }
    }
    
    return 'Une erreur inattendue s\'est produite';
  }
}