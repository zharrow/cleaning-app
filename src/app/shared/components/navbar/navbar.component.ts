import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Home, Calendar, SquareCheckBig , Users, Settings, LogOut, Menu, X } from 'lucide-angular';

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
            <!-- User dropdown (desktop) -->
            <div class="relative hidden md:block" (click)="$event.stopPropagation()">
              <button (click)="toggleUserMenu()" class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
                  <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
                </div>
                <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-primary-700">{{ getUserInitials() }}</span>
                </div>
                <lucide-icon name="chevron-down" [size]="18" class="text-gray-500"></lucide-icon>
              </button>

              <!-- Dropdown panel -->
              @if (isUserMenuOpen()) {
                <div class="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-md ring-1 ring-black/5 z-50 animate-fade-in">
                  <!-- User info -->
                  <div class="px-4 py-3">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ userName() }}</p>
                    @if (userEmail()) {
                      <p class="mt-1 text-xs text-gray-500 truncate">{{ userEmail() }}</p>
                    }
                  </div>
                  <div class="py-1 border-t">
                    @if (canManage()) {
                      <a
                        routerLink="/manage/tasks"
                        (click)="closeUserMenu()"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full"
                      >
                        <lucide-icon name="settings" [size]="16"></lucide-icon>
                        Gérer les tâches
                      </a>
                      <a
                        routerLink="/manage/rooms"
                        (click)="closeUserMenu()"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full"
                      >
                        <lucide-icon name="home" [size]="16"></lucide-icon>
                        Gérer les pièces
                      </a>
                      <div class="my-1 border-t"></div>
                    }
                    <a
                      routerLink="/profile"
                      (click)="closeUserMenu()"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full"
                    >
                      <lucide-icon name="user" [size]="16"></lucide-icon>
                      Profil
                    </a>
                    <button (click)="handleLogout(); closeUserMenu()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <lucide-icon name="log-out" [size]="16"></lucide-icon>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              }
            </div>

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
  isUserMenuOpen = signal(false);
  
  userName = computed(() => this.authService.appUser()?.full_name || 'Utilisateur');
  userEmail = computed(() => this.authService.currentUser()?.email || '');
  roleLabel = computed(() => {
    const role = this.authService.userRole();
    if (role === 'admin') return 'Admin';
    if (role === 'manager' || role === 'gerante') return 'Gérante';
    return '';
  });
  canManage = computed(() => this.authService.canManage());
  
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
  
  toggleUserMenu() {
    this.isUserMenuOpen.update(v => !v);
  }
  
  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }
  
  @HostListener('document:click')
  onDocumentClick() {
    // Close user dropdown when clicking outside
    if (this.isUserMenuOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }
  
  async handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await this.authService.signOutUser();
    }
  }
}