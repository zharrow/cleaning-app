import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onCancel()">
        <div class="modal-content" style="max-width: 500px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="flex items-center gap-3">
              @if (config().icon) {
                <span class="text-2xl">{{ config().icon }}</span>
              }
              <h3 class="modal-title">{{ config().title }}</h3>
            </div>
            <button class="modal-close" (click)="onCancel()">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="text-gray-700 leading-relaxed">
              {{ config().message }}
            </div>
          </div>
          
          <div class="modal-footer">
            <button 
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()"
              [disabled]="isLoading()"
            >
              {{ config().cancelText || 'Annuler' }}
            </button>
            <button 
              type="button"
              class="btn"
              [class]="getConfirmButtonClass()"
              (click)="onConfirm()"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                <div class="spinner spinner-sm"></div>
              }
              {{ config().confirmText || 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ConfirmationModalComponent {
  // Inputs
  readonly isOpen = input.required<boolean>();
  readonly config = input.required<ConfirmationConfig>();
  readonly isLoading = input<boolean>(false);
  
  // Outputs
  readonly confirm = output<void>();
  readonly cancel = output<void>();
  
  onConfirm(): void {
    if (!this.isLoading()) {
      this.confirm.emit();
    }
  }
  
  onCancel(): void {
    if (!this.isLoading()) {
      this.cancel.emit();
    }
  }
  
  getConfirmButtonClass(): string {
    const type = this.config().type || 'danger';
    const baseClasses = 'btn';
    
    switch (type) {
      case 'danger':
        return `${baseClasses} btn-danger`;
      case 'warning':
        return `${baseClasses} btn-warning`;
      case 'info':
        return `${baseClasses} btn-primary`;
      default:
        return `${baseClasses} btn-danger`;
    }
  }
}