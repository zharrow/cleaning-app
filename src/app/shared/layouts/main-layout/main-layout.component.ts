import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';

/**
 * Layout principal de l'application
 * Combine sidebar + header + contenu principal
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      
      <!-- Sidebar fixe à gauche -->
      <app-sidebar></app-sidebar>
      
      <!-- Contenu principal -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Header fixe en haut -->
        <app-header></app-header>
        
        <!-- Zone de contenu avec scroll -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
        
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
    
    /* Assurer que le layout prend toute la hauteur */
    .min-h-screen {
      min-height: 100vh;
    }
    
    /* Scroll smooth pour le contenu principal */
    main {
      scroll-behavior: smooth;
    }
    
    /* Personnalisation de la scrollbar pour le contenu principal */
    main::-webkit-scrollbar {
      width: 6px;
    }
    
    main::-webkit-scrollbar-track {
      background: transparent;
    }
    
    main::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    
    main::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class MainLayoutComponent {
  
}