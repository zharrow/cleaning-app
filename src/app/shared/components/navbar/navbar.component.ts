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
 * Navbar moderne et épurée avec design glassmorphism
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14">
          
          <!-- Logo moderne -->
          <div class="flex items-center">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                <span class="text-lg">🧹</span>
              </div>
              <div class="hidden md:block">
                <span class="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">CleanTrack</span>
              </div>
            </div>
          </div>
          
          <!-- Navigation centrale -->
          <div class="hidden md:flex items-center space-x-1">
            @for (item of visibleNavItems(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-gray-100 text-gray-900 shadow-sm"
                [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
                class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 group"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-base group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                  <span class="hidden lg:block">{{ item.label }}</span>
                </div>
              </a>
            }
          </div>
          
          <!-- Actions utilisateur -->
          <div class="flex items-center space-x-3">
            
            <!-- Indicateur de sync moderne -->
            @if (syncInProgress()) {
              <div class="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-xs font-medium text-blue-700">Sync...</span>
              </div>
            }
            
            <!-- Menu utilisateur moderne -->
            @if (authService.isAuthenticated()) {
              <div class="relative hidden md:block" (click)="$event.stopPropagation()">
                <button 
                  (click)="toggleUserMenu()" 
                  class="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  [attr.aria-expanded]="isUserMenuOpen()"
                  aria-haspopup="true"
                >
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm ring-2 ring-white">
                    <span class="text-xs font-semibold text-white">{{ getUserInitials() }}</span>
                  </div>
                  <div class="hidden xl:block text-left">
                    <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
                    <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
                  </div>
                  <svg 
                    class="w-4 h-4 text-gray-400 transition-transform duration-200"
                    [class.rotate-180]="isUserMenuOpen()"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                <!-- Menu dropdown utilisateur moderne -->
                @if (isUserMenuOpen()) {
                  <div class="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-xl ring-1 ring-black/5 animate-fade-in">
                    <!-- En-tête du profil -->
                    <div class="p-4">
                      <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white">
                          <span class="text-sm font-semibold text-white">{{ getUserInitials() }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900 truncate">{{ userName() }}</p>
                          <p class="text-xs text-gray-500 truncate">{{ authService.currentUser()?.email }}</p>
                          <div class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mt-1">
                            {{ roleLabel() }}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="px-2 pb-2">
                      <!-- Action: Voir le profil -->
                      <button 
                        (click)="navigateToProfile()"
                        class="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                      >
                        <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                        <span>Mon profil</span>
                      </button>
                      
                      <!-- Action: Paramètres (si manager+) -->
                      @if (authService.isManager()) {
                        <button 
                          (click)="navigateToSettings()"
                          class="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                        >
                          <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                          </div>
                          <span>Paramètres</span>
                        </button>
                      }
                      
                      <!-- Divider moderne -->
                      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>
                      
                      <!-- Action: Déconnexion -->
                      <button 
                        (click)="logout()"
                        [disabled]="loggingOut()"
                        class="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 group"
                      >
                        <div class="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          @if (loggingOut()) {
                            <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          } @else {
                            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                            </svg>
                          }
                        </div>
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
              class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div class="relative w-5 h-5">
                @if (isMobileMenuOpen()) {
                  <svg class="w-5 h-5 rotate-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                } @else {
                  <div class="space-y-1">
                    <div class="w-5 h-0.5 bg-gray-600 rounded-full"></div>
                    <div class="w-5 h-0.5 bg-gray-600 rounded-full"></div>
                    <div class="w-5 h-0.5 bg-gray-600 rounded-full"></div>
                  </div>
                }
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Menu mobile moderne -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100 animate-slide-down">
          <div class="px-4 py-4 space-y-2">
            @for (item of visibleNavItems(); track item.path) {
              <a
                [routerLink]="item.path"
                (click)="closeMobileMenu()"
                class="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 group"
              >
                <span class="text-lg group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
            
            <!-- Actions mobiles -->
            @if (authService.isAuthenticated()) {
              <div class="pt-4 mt-4 border-t border-gray-100">
                <div class="flex items-center space-x-3 px-4 py-2 mb-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span class="text-sm font-semibold text-white">{{ getUserInitials() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ userName() }}</p>
                    <p class="text-xs text-gray-500">{{ roleLabel() }}</p>
                  </div>
                </div>
                
                <button 
                  (click)="navigateToProfile(); closeMobileMenu()"
                  class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span>Mon profil</span>
                </button>
                
                <button 
                  (click)="logout()"
                  [disabled]="loggingOut()"
                  class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-700 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                >
                  @if (loggingOut()) {
                    <div class="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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
        transform: translateY(-8px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .animate-slide-down {
      animation: slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Effet glassmorphism */
    .backdrop-blur-md {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    
    .backdrop-blur-lg {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
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