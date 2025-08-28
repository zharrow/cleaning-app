import { Component, inject, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface pour les éléments de navigation
 */
interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly requiresRole?: string[];
}

/**
 * Navbar moderne Angular 19 avec menu utilisateur complet
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white shadow-sm border-b sticky top-0 z-50">
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
              @for (item of visibleNavItems(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="border-primary-500 text-gray-900"
                  [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
                  class="border-b-2 border-transparent hover:border-gray-300 px-1 pt-1 pb-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span class="text-lg">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          </div>
          
          <!-- Actions utilisateur et menu -->
          <div class="flex items-center gap-4">
            
            <!-- Indicateur de synchronisation -->
            @if (syncInProgress()) {
              <div class="hidden md:flex items-center gap-2 text-sm text-blue-600">
                <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Synchronisation...</span>
              </div>
            }
            
            
            <!-- Menu utilisateur desktop -->
            @if (authService.isAuthenticated()) {
              <div class="relative hidden md:block" (click)="$event.stopPropagation()">
                <button 
                  (click)="toggleUserMenu()" 
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  [attr.aria-expanded]="isUserMenuOpen()"
                  aria-haspopup="true"
                >
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
                    <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
                  </div>
                  <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                    <span class="text-sm font-medium text-white">{{ getUserInitials() }}</span>
                  </div>
                  <svg 
                    class="w-4 h-4 text-gray-500 transition-transform"
                    [class.rotate-180]="isUserMenuOpen()"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                <!-- Menu dropdown utilisateur -->
                @if (isUserMenuOpen()) {
                  <div class="absolute right-0 mt-2 w-64 rounded-lg border bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in">
                    <div class="p-4 border-b bg-gray-50">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span class="text-sm font-medium text-white">{{ getUserInitials() }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">{{ userName() }}</p>
                          <p class="text-xs text-gray-500">{{ authService.currentUser()?.email }}</p>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {{ roleLabel() }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="py-2">
                      <!-- Action: Voir le profil -->
                      <button 
                        (click)="navigateToProfile()"
                        class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>Mon profil</span>
                      </button>
                      
                      <!-- Action: Paramètres (si manager+) -->
                      @if (authService.isManager()) {
                        <button 
                          (click)="navigateToSettings()"
                          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span>Paramètres</span>
                        </button>
                      }
                      
                      <!-- Divider -->
                      <div class="border-t my-2"></div>
                      
                      <!-- Action: Déconnexion -->
                      <button 
                        (click)="logout()"
                        [disabled]="loggingOut()"
                        class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        @if (loggingOut()) {
                          <div class="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                        }
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Menu mobile hamburger -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              @if (isMobileMenuOpen()) {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              } @else {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              }
            </button>
          </div>
        </div>
      </div>
      
      <!-- Menu mobile -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden border-t bg-white animate-slide-down">
          <div class="px-4 py-3 space-y-1">
            @for (item of visibleNavItems(); track item.path) {
              <a
                [routerLink]="item.path"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
            
            <!-- Actions mobiles -->
            
            @if (authService.isAuthenticated()) {
              <div class="border-t pt-3 mt-3">
                <div class="flex items-center gap-3 px-3 py-2 mb-2">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-white">{{ getUserInitials() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
                    <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
                  </div>
                </div>
                
                <button 
                  (click)="navigateToProfile(); closeMobileMenu()"
                  class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span>Mon profil</span>
                </button>
                
                <button 
                  (click)="logout()"
                  [disabled]="loggingOut()"
                  class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  @if (loggingOut()) {
                    <div class="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                    </svg>
                  }
                  <span>Se déconnecter</span>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </nav>
  `,
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    
    .animate-slide-down {
      animation: slide-down 0.3s ease-out;
    }
  `]
})
export class NavbarComponent {
  // Services injectés
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Signaux d'état
  readonly isMobileMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);
  readonly loggingOut = signal(false);
  
  // Configuration de navigation
  private readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '🏠' },
    { path: '/session', label: 'Session du jour', icon: '📅' },
    { path: '/tasks', label: 'Mes tâches', icon: '✅' },
    { path: '/manage/tasks', label: 'Gestion tâches', icon: '⚙️', requiresRole: ['admin', 'manager'] },
    { path: '/manage/rooms', label: 'Gestion pièces', icon: '🏠', requiresRole: ['admin', 'manager'] },
    { path: '/manage/performers', label: 'Équipe', icon: '👥', requiresRole: ['admin', 'manager'] },
  ];
  
  // Computed signals
  readonly visibleNavItems = computed(() => {
    const userRole = this.authService.userRole();
    if (!userRole) return this.navItems.filter(item => !item.requiresRole);
    
    return this.navItems.filter(item => {
      if (!item.requiresRole) return true;
      return item.requiresRole.includes(userRole) || this.authService.isManager();
    });
  });
  
  readonly userName = computed(() => {
    const appUser = this.authService.appUser();
    if (appUser?.full_name) return appUser.full_name;
    
    const firebaseUser = this.authService.currentUser();
    return firebaseUser?.email?.split('@')[0] || 'Utilisateur';
  });
  
  readonly roleLabel = computed(() => {
    const role = this.authService.userRole();
    const roleLabels = {
      'admin': 'Administrateur',
      'manager': 'Manager',
      'gerante': 'Gérante'
    };
    return role ? roleLabels[role] : 'Utilisateur';
  });
  
  readonly getUserInitials = computed(() => {
    const name = this.userName();
    return name.split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });
  
  
  readonly syncInProgress = computed(() => {
    return this.authService.isLoading();
  });
  
  constructor() {
    // Fermer les menus lors des clics extérieurs
    effect(() => {
      const handleClickOutside = () => {
        this.isUserMenuOpen.set(false);
      };
      
      if (this.isUserMenuOpen()) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
      
      return () => {};
    });
  }
  
  /**
   * Actions de navigation
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
  
  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }
  
  /**
   * Actions utilisateur
   */
  async navigateToProfile(): Promise<void> {
    this.isUserMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }
  
  async navigateToSettings(): Promise<void> {
    this.isUserMenuOpen.set(false);
    this.router.navigate(['/settings']);
  }
  
  async logout(): Promise<void> {
    if (this.loggingOut()) return;
    
    this.loggingOut.set(true);
    this.isUserMenuOpen.set(false);
    
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.loggingOut.set(false);
    }
  }
  
  /**
   * Listener pour fermer le menu utilisateur
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const navbar = target.closest('nav');
    if (!navbar && this.isUserMenuOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }
}