// ========================================
// src/app/shared/components/retry-indicator.component.ts
// ========================================
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetryIndicatorService } from '../../core/services/retry-indicator.service';

/**
 * Composant d'indicateur de retry
 * Affiche une notification temporaire quand des requêtes sont en retry
 */
@Component({
  selector: 'app-retry-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (retryService.isRetrying()) {
      <div class="retry-indicator animate-slide-down">
        <div class="retry-content">
          <div class="retry-spinner animate-spin">⏳</div>
          <span class="retry-message">{{ retryService.message() }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .retry-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(59, 130, 246, 0.95);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .retry-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .retry-spinner {
      font-size: 16px;
    }
    
    .retry-message {
      font-size: 14px;
      font-weight: 500;
    }
    
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-100%) translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .animate-slide-down {
      animation: slide-down 0.3s ease-out;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class RetryIndicatorComponent {
  readonly retryService = inject(RetryIndicatorService);
}