import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-gray-900">Profil</h1>
      <p class="text-gray-600 mt-2">Page de profil utilisateur.</p>
    </div>
  `,
})
export class ProfileComponent {}
