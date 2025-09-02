// ========================================
// Composant Setup Enterprise Angular 19
// src/app/features/setup-enterprise/setup-enterprise.component.ts
// ========================================
import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { EnterpriseService, CreateEnterpriseData } from '../../core/services/enterprise.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Composant pour configurer l'entreprise lors de la première connexion
 */
@Component({
  selector: 'app-setup-enterprise',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <!-- Header -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-extrabold text-gray-900">
              Configuration de votre entreprise
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              Configurez les informations de votre entreprise pour commencer
            </p>
          </div>

          <!-- Formulaire -->
          <form [formGroup]="enterpriseForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Nom de l'entreprise -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nom de l'entreprise *
              </label>
              <div class="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  formControlName="name"
                  required
                  placeholder="Ex: Micro-Crèche Les Petits Anges"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  [class.border-red-300]="nameControl.invalid && nameControl.touched"
                >
                <div *ngIf="nameControl.invalid && nameControl.touched" class="mt-1">
                  <p *ngIf="nameControl.errors?.['required']" class="text-sm text-red-600">
                    Le nom de l'entreprise est obligatoire
                  </p>
                  <p *ngIf="nameControl.errors?.['minlength']" class="text-sm text-red-600">
                    Le nom doit contenir au moins 2 caractères
                  </p>
                </div>
              </div>
            </div>

            <!-- URL du logo -->
            <div>
              <label for="logoUrl" class="block text-sm font-medium text-gray-700">
                URL du logo (optionnel)
              </label>
              <div class="mt-1">
                <input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  formControlName="logo_url"
                  placeholder="https://exemple.com/logo.png"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  [class.border-red-300]="logoUrlControl.invalid && logoUrlControl.touched"
                >
                <div *ngIf="logoUrlControl.invalid && logoUrlControl.touched" class="mt-1">
                  <p *ngIf="logoUrlControl.errors?.['url']" class="text-sm text-red-600">
                    Veuillez entrer une URL valide
                  </p>
                </div>
              </div>
            </div>

            <!-- Forme juridique -->
            <div>
              <label for="legalForm" class="block text-sm font-medium text-gray-700">
                Forme juridique (optionnel)
              </label>
              <div class="mt-1">
                <select
                  id="legalForm"
                  name="legalForm"
                  formControlName="legal_form"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">-- Sélectionnez --</option>
                  <option value="SARL">SARL</option>
                  <option value="SAS">SAS</option>
                  <option value="SASU">SASU</option>
                  <option value="EURL">EURL</option>
                  <option value="SA">SA</option>
                  <option value="Association">Association</option>
                  <option value="Entreprise individuelle">Entreprise individuelle</option>
                  <option value="Micro-entreprise">Micro-entreprise</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <!-- SIRET -->
            <div>
              <label for="siret" class="block text-sm font-medium text-gray-700">
                Numéro SIRET (optionnel)
              </label>
              <div class="mt-1">
                <input
                  id="siret"
                  name="siret"
                  type="text"
                  formControlName="siret"
                  placeholder="12345678901234"
                  maxlength="14"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  [class.border-red-300]="siretControl.invalid && siretControl.touched"
                >
                <div *ngIf="siretControl.invalid && siretControl.touched" class="mt-1">
                  <p *ngIf="siretControl.errors?.['pattern']" class="text-sm text-red-600">
                    Le SIRET doit contenir exactement 14 chiffres
                  </p>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Le SIRET est composé de 14 chiffres (SIREN + NIC)
              </p>
            </div>

            <!-- Message d'erreur global -->
            <div *ngIf="error()" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    Erreur lors de la création
                  </h3>
                  <p class="text-sm text-red-700 mt-1">
                    {{ error() }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Boutons -->
            <div>
              <button
                type="submit"
                [disabled]="enterpriseForm.invalid || isLoading()"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="!isLoading()">Créer mon entreprise</span>
                <span *ngIf="isLoading()" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </span>
              </button>
            </div>

            <!-- Lien de déconnexion -->
            <div class="text-center">
              <button
                type="button"
                (click)="logout()"
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                Me déconnecter et revenir plus tard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Animation pour le spinner */
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SetupEnterpriseComponent implements OnDestroy {
  // Services injectés
  private readonly formBuilder = inject(FormBuilder);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Signals d'état
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Formulaire réactif
  readonly enterpriseForm: FormGroup;
  
  // Getters pour les contrôles
  get nameControl() { return this.enterpriseForm.get('name')!; }
  get logoUrlControl() { return this.enterpriseForm.get('logo_url')!; }
  get legalFormControl() { return this.enterpriseForm.get('legal_form')!; }
  get siretControl() { return this.enterpriseForm.get('siret')!; }
  
  constructor() {
    // Initialiser le formulaire
    this.enterpriseForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      logo_url: ['', [this.urlValidator]],
      legal_form: [''],
      siret: ['', [this.siretValidator]]
    });
    
    // Vérifier si l'utilisateur a déjà une entreprise
    this.checkExistingEnterprise();
  }
  
  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }
  
  /**
   * Vérifier si l'utilisateur a déjà une entreprise configurée
   */
  private async checkExistingEnterprise(): Promise<void> {
    try {
      const exists = await this.enterpriseService.checkEnterpriseExists();
      
      if (exists.exists) {
        // Rediriger vers le dashboard si l'entreprise existe déjà
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification de l\'entreprise existante:', error);
    }
  }
  
  /**
   * Soumettre le formulaire
   */
  async onSubmit(): Promise<void> {
    if (this.enterpriseForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }
    
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const formData: CreateEnterpriseData = {
        name: this.enterpriseForm.value.name,
        logo_url: this.enterpriseForm.value.logo_url || undefined,
        legal_form: this.enterpriseForm.value.legal_form || undefined,
        siret: this.enterpriseForm.value.siret || undefined
      };
      
      await this.enterpriseService.createEnterprise(formData);
      
      // Rediriger vers le dashboard après création
      await this.router.navigate(['/dashboard']);
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error);
      this.error.set(
        error && typeof error === 'object' && 'error' in error 
          ? String((error as any).error?.detail || 'Erreur lors de la création de l\'entreprise')
          : 'Erreur lors de la création de l\'entreprise'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
  
  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.enterpriseForm.controls).forEach(key => {
      this.enterpriseForm.get(key)?.markAsTouched();
    });
  }
  
  /**
   * Validateur personnalisé pour les URLs
   */
  private urlValidator(control: any) {
    if (!control.value) {
      return null; // Pas de validation si vide
    }
    
    try {
      new URL(control.value);
      return null; // URL valide
    } catch {
      return { url: true }; // URL invalide
    }
  }
  
  /**
   * Validateur personnalisé pour le SIRET
   */
  private siretValidator(control: any) {
    if (!control.value) {
      return null; // Pas de validation si vide
    }
    
    const siret = control.value.replace(/\D/g, ''); // Supprimer tout ce qui n'est pas un chiffre
    
    if (siret.length !== 14) {
      return { pattern: true };
    }
    
    return null; // SIRET valide
  }
}