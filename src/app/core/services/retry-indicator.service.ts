// ========================================
// src/app/core/services/retry-indicator.service.ts
// ========================================
import { Injectable, signal } from '@angular/core';

/**
 * Service simple pour afficher les indicateurs de retry
 * Permet de montrer à l'utilisateur quand des requêtes sont en cours de retry
 */
@Injectable({
  providedIn: 'root'
})
export class RetryIndicatorService {
  private readonly retryingSignal = signal(false);
  private readonly messageSignal = signal<string>('');
  
  // Signals publics en lecture seule
  readonly isRetrying = this.retryingSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();
  
  private retryTimeout?: ReturnType<typeof setTimeout>;
  
  /**
   * Indique qu'un retry est en cours
   */
  showRetry(message: string = 'Nouvelle tentative en cours...'): void {
    console.log('🔄 Retry Indicator: Affichage retry -', message);
    
    this.messageSignal.set(message);
    this.retryingSignal.set(true);
    
    // Auto-hide après 5 secondes si pas appelé manuellement
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.retryTimeout = setTimeout(() => {
      this.hideRetry();
    }, 5000);
  }
  
  /**
   * Masque l'indicateur de retry
   */
  hideRetry(): void {
    console.log('✅ Retry Indicator: Masquage retry');
    
    this.retryingSignal.set(false);
    this.messageSignal.set('');
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
  }
  
  /**
   * Affiche un retry avec auto-hide après délai
   */
  showTemporaryRetry(message: string = 'Nouvelle tentative...', duration: number = 3000): void {
    this.showRetry(message);
    
    setTimeout(() => {
      this.hideRetry();
    }, duration);
  }
}