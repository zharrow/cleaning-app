import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthMultiTierService } from '../../../core/services/auth-multi-tier.service';
import { EnterpriseService } from '../../../core/services/enterprise.service';

@Component({
  selector: 'app-pin-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './pin-login.component.html',
  styleUrl: './pin-login.component.css'
})
export class PinLoginComponent {
  private readonly authService = inject(AuthMultiTierService);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly router = inject(Router);

  // Signals
  readonly pinCode = signal('');
  readonly enterpriseId = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Numeric keypad numbers
  readonly keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  // Enterprise from service
  readonly enterprise = this.enterpriseService.currentEnterprise;

  ngOnInit() {
    // Pre-fill enterprise ID if available
    const enterprise = this.enterprise();
    if (enterprise) {
      this.enterpriseId.set(enterprise.id);
    }
  }

  /**
   * Add digit to PIN
   */
  addDigit(digit: number): void {
    const currentPin = this.pinCode();
    if (currentPin.length < 6) {
      this.pinCode.set(currentPin + digit);
      this.error.set(null);
    }
  }

  /**
   * Remove last digit
   */
  removeDigit(): void {
    const currentPin = this.pinCode();
    if (currentPin.length > 0) {
      this.pinCode.set(currentPin.slice(0, -1));
      this.error.set(null);
    }
  }

  /**
   * Clear entire PIN
   */
  clearPin(): void {
    this.pinCode.set('');
    this.error.set(null);
  }

  /**
   * Submit PIN login
   */
  async onSubmit(): Promise<void> {
    const pin = this.pinCode();
    const enterpriseId = this.enterpriseId();

    if (!pin || pin.length < 4) {
      this.error.set('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }

    if (!enterpriseId) {
      this.error.set('Aucune entreprise sélectionnée');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const success = await this.authService.loginWithPin({
        pin_code: pin,
        enterprise_id: enterpriseId
      });

      if (success) {
        this.router.navigate(['/tablet']);
      } else {
        this.error.set('Code PIN incorrect');
        this.clearPin();
      }
    } catch (error) {
      console.error('PIN login error:', error);
      this.error.set('Code PIN incorrect ou erreur de connexion');
      this.clearPin();
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Navigate back to main login
   */
  goToMainLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Get masked PIN display (show as dots)
   */
  getMaskedPin(): string {
    return '●'.repeat(this.pinCode().length);
  }
}
