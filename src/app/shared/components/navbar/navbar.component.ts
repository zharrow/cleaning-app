import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Home, Calendar, CheckSquare, Users, Settings, LogOut, Menu, X } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo et navigation principale -->
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <span class="text-2xl">🧹</span>
              <span class="ml-2 text-xl font-bold text-gray-900">CleanTrack</span>
            </div>
            
            <!-- Navigation desktop -->
            <div class="hidden md:ml-8 md:flex md:space-x-6">
              <a
                routerLink="/dashboard"
                routerLinkActive="border-primary-500 text-gray-900"
                [routerLinkActiveOptions]="{exact: true}"
                class="border-b-2 border-transparent hover:border-gray-300 px-1 pt-1 pb-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <lucide-icon name="home" [size]="18"></lucide-icon>
                <span>Tableau de bord</span>
              </a>
              
              <a
                routerLink="/session"
                routerLinkActive="border-primary-500 text-gray-900"
                class="border-b-2 border-transparent hover:border-gray-300 px-1 pt-1 pb-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <lucide-icon name="calendar" [size]="18"></lucide-icon>
                <span>Session du jour</span>
              </a>
              
              <a
                routerLink="/tasks"
                routerLinkActive="border-primary-500 text-gray-900"
                class="border-b-2 border-transparent hover:border-gray-300 px-1 pt-1 pb-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <lucide-icon name="check-square" [size]="18"></lucide-icon>
                <span>Tâches</span>
              </a>
            </div>
          </div>
          
          <!-- Menu utilisateur -->
          <div class="flex items-center gap-4">
            <!-- Info utilisateur -->
            <div class="hidden md:flex items-center gap-3">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
                <p class="text-xs text-gray-500">Gérante</p>
              </div>
              <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-primary-700">
                  {{ getUserInitials() }}
                </span>
              </div>
            </div>
            
            <!-- Bouton déconnexion -->
            <button
              (click)="handleLogout()"
              class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <lucide-icon name="log-out" [size]="20"></lucide-icon>
            </button>
            
            <!-- Menu mobile -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              @if (isMobileMenuOpen()) {
                <lucide-icon name="x" [size]="24"></lucide-icon>
              } @else {
                <lucide-icon name="menu" [size]="24"></lucide-icon>
              }
            </button>
          </div>
        </div>
      </div>
      
      <!-- Menu mobile -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden border-t animate-slide-in">
          <div class="px-4 py-3 space-y-1">
            <a
              routerLink="/dashboard"
              (click)="closeMobileMenu()"
              class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Tableau de bord
            </a>
            <a
              routerLink="/session"
              (click)="closeMobileMenu()"
              class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Session du jour
            </a>
            <a
              routerLink="/tasks"
              (click)="closeMobileMenu()"
              class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Tâches
            </a>
          </div>
        </div>
      }
    </nav>
  `,
  styles: []
})
export class NavbarComponent {
  private authService = inject(AuthService);
  
  isMobileMenuOpen = signal(false);
  
  userName = signal(this.authService.appUser()?.full_name || 'Utilisateur');
  
  getUserInitials(): string {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
  
  async handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await this.authService.signOutUser();
    }
  }
}