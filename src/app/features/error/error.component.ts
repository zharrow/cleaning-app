import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/**
 * Composant d'affichage des erreurs
 * Gère les différents types d'erreurs de l'application
 */
@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <div class="w-full max-w-md text-center animate-fade-in">
        
        <!-- Icône d'erreur -->
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded mb-4">
            <span class="text-4xl">{{ errorIcon() }}</span>
          </div>
        </div>
        
        <!-- Titre et message -->
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          {{ errorTitle() }}
        </h1>
        
        <p class="text-gray-600 mb-8 leading-relaxed">
          {{ errorMessage() }}
        </p>
        
        <!-- Actions -->
        <div class="space-y-3">
          <button 
            class="btn btn-primary btn-full"
            (click)="goBack()"
          >
            <span class="text-lg">←</span>
            Retour
          </button>
          
          <button 
            class="btn btn-secondary btn-full"
            (click)="goHome()"
          >
            <span class="text-lg">🏠</span>
            Accueil
          </button>
          
          <button 
            class="btn btn-ghost btn-full"
            (click)="reload()"
          >
            <span class="text-lg">🔄</span>
            Recharger la page
          </button>
        </div>
        
        <!-- Informations de contact -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500 mb-3">
            Si le problème persiste, contactez le support :
          </p>
          <div class="space-y-1 text-sm text-gray-600">
            <p>📧 support&#64;micro-creche.fr</p>
            <p>📞 01 23 45 67 89</p>
          </div>
        </div>
        
        <!-- Détails techniques (développement) -->
        @if (showTechnicalDetails()) {
          <details class="mt-6 text-left bg-gray-100 rounded-lg p-4">
            <summary class="cursor-pointer font-medium text-gray-700 mb-2">
              Détails techniques
            </summary>
            <div class="text-sm text-gray-600 space-y-2">
              <p><strong>Code d'erreur :</strong> {{ errorCode() }}</p>
              <p><strong>URL :</strong> {{ currentUrl() }}</p>
              <p><strong>Timestamp :</strong> {{ timestamp() }}</p>
              @if (userAgent()) {
                <p><strong>Navigateur :</strong> {{ userAgent() }}</p>
              }
            </div>
          </details>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ErrorComponent {
  private readonly route = inject(ActivatedRoute);
  
  // Signals pour les paramètres d'erreur
   readonly errorType = signal(this.route.snapshot.queryParams['type'] || 'unknown');
   readonly errorCode = signal(this.route.snapshot.queryParams['code'] || '500');
   readonly currentUrl = signal(window.location.href);
   readonly timestamp = signal(new Date().toISOString());
   readonly userAgent = signal(navigator.userAgent);
  
  // Computed pour l'affichage
  readonly errorIcon = computed(() => {
    const type = this.errorType();
    const icons = {
      'network': '📡',
      'auth': '🔐',
      'permission': '🚫',
      'not-found': '🔍',
      'server': '🔧',
      'unknown': '⚠️'
    };
    return icons[type as keyof typeof icons] || '⚠️';
  });
  
  readonly errorTitle = computed(() => {
    const type = this.errorType();
    const titles = {
      'network': 'Problème de connexion',
      'auth': 'Erreur d\'authentification',
      'permission': 'Accès refusé',
      'not-found': 'Page non trouvée',
      'server': 'Erreur du serveur',
      'unknown': 'Une erreur est survenue'
    };
    return titles[type as keyof typeof titles] || 'Une erreur est survenue';
  });
  
  readonly errorMessage = computed(() => {
    const type = this.errorType();
    const messages = {
      'network': 'Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.',
      'auth': 'Votre session a expiré ou vos identifiants sont invalides. Veuillez vous reconnecter.',
      'permission': 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
      'not-found': 'La page que vous recherchez n\'existe pas ou a été déplacée.',
      'server': 'Le serveur rencontre des difficultés. Nos équipes travaillent à résoudre le problème.',
      'unknown': 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support.'
    };
    return messages[type as keyof typeof messages] || 'Une erreur inattendue s\'est produite.';
  });
  
  readonly showTechnicalDetails = computed(() => 
    !window.location.hostname.includes('production') && this.errorCode() !== '404'
  );
  
  /**
   * Actions
   */
  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goHome();
    }
  }
  
  goHome(): void {
    window.location.href = '/';
  }
  
  reload(): void {
    window.location.reload();
  }
}