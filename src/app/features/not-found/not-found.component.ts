// ========================================
// Composant Page non trouvée - src/app/features/not-found/not-found.component.ts
// ========================================
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Composant 404 - Page non trouvée
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div class="w-full max-w-lg text-center animate-bounce-in">
        
        <!-- Animation 404 -->
        <div class="mb-8">
          <div class="text-8xl font-bold text-primary-200 mb-4 animate-pulse">
            404
          </div>
          <div class="relative">
            <span class="text-6xl animate-wiggle">🔍</span>
            <span class="absolute -top-2 -right-2 text-2xl animate-bounce">❓</span>
          </div>
        </div>
        
        <!-- Contenu -->
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Page introuvable
        </h1>
        
        <p class="text-gray-600 mb-8 leading-relaxed">
          Oups ! La page que vous cherchez semble avoir disparu. 
          Elle a peut-être été déplacée, supprimée ou vous avez tapé une mauvaise adresse.
        </p>
        
        <!-- Suggestions -->
        <div class="bg-white rounded-xl p-6 mb-8 shadow-md">
          <h3 class="font-semibold text-gray-900 mb-4">Où vouliez-vous aller ?</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a 
              routerLink="/dashboard" 
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span class="text-2xl">📊</span>
              <div class="text-left">
                <p class="font-medium text-gray-900">Tableau de bord</p>
                <p class="text-sm text-gray-600">Vue d'ensemble</p>
              </div>
            </a>
            
            <a 
              routerLink="/session" 
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span class="text-2xl">📋</span>
              <div class="text-left">
                <p class="font-medium text-gray-900">Session du jour</p>
                <p class="text-sm text-gray-600">Tâches actuelles</p>
              </div>
            </a>
            
            <a 
              routerLink="/tasks" 
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span class="text-2xl">✅</span>
              <div class="text-left">
                <p class="font-medium text-gray-900">Mes tâches</p>
                <p class="text-sm text-gray-600">Gérer les tâches</p>
              </div>
            </a>
            
            <a 
              routerLink="/history" 
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span class="text-2xl">📚</span>
              <div class="text-left">
                <p class="font-medium text-gray-900">Historique</p>
                <p class="text-sm text-gray-600">Sessions passées</p>
              </div>
            </a>
          </div>
        </div>
        
        <!-- Actions principales -->
        <div class="space-y-3">
          <a routerLink="/" class="btn btn-primary btn-full">
            <span class="text-lg">🏠</span>
            Retour à l'accueil
          </a>
          
          <button 
            class="btn btn-secondary btn-full"
            (click)="goBack()"
          >
            <span class="text-lg">←</span>
            Page précédente
          </button>
        </div>
        
        <!-- Contact -->
        <div class="mt-8 text-sm text-gray-500">
          <p>Besoin d'aide ? Contactez-nous au</p>
          <p class="font-medium text-primary-600">support&#64;micro-creche.fr</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .animate-wiggle {
      animation: wiggle 2s ease-in-out infinite;
    }
    
    @keyframes wiggle {
      0%, 7% { transform: rotateZ(0); }
      15% { transform: rotateZ(-15deg); }
      20% { transform: rotateZ(10deg); }
      25% { transform: rotateZ(-10deg); }
      30% { transform: rotateZ(6deg); }
      35% { transform: rotateZ(-4deg); }
      40%, 100% { transform: rotateZ(0); }
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }
}