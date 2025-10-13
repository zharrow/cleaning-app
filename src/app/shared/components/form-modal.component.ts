import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose()">
        <div class="modal-content" [style.max-width]="maxWidth()" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title() }}</h3>
            <button class="modal-close" (click)="onClose()" type="button">✕</button>
          </div>

          <div class="modal-body">
            <ng-content></ng-content>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onClose()"
              [disabled]="isSaving()"
            >
              {{ cancelText() || 'Annuler' }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              (click)="onSave()"
              [disabled]="isSaving() || !canSave()"
              [form]="formId()"
            >
              @if (isSaving()) {
                <div class="spinner spinner-sm"></div>
              }
              {{ saveText() || 'Enregistrer' }}
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
export class FormModalComponent {
  // Inputs
  readonly isOpen = input.required<boolean>();
  readonly title = input.required<string>();
  readonly maxWidth = input<string>('600px');
  readonly isSaving = input<boolean>(false);
  readonly canSave = input<boolean>(true);
  readonly saveText = input<string>('');
  readonly cancelText = input<string>('');
  readonly formId = input<string>(''); // ID du formulaire à soumettre

  // Outputs
  readonly close = output<void>();
  readonly save = output<void>();

  onClose(): void {
    if (!this.isSaving()) {
      this.close.emit();
    }
  }

  onSave(): void {
    if (!this.isSaving() && this.canSave()) {
      this.save.emit();
    }
  }
}
