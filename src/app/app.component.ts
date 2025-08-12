import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class AppComponent {
  private authService = inject(AuthService);
  
  constructor() {
    // Initialisation de l'auth au démarrage
    this.authService.initializeAuth();
  }
}