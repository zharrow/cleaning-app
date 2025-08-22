// ========================================
// Configuration principale Angular 19
// src/app/app.config.ts
// ========================================
import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

// Routes
import { routes } from './app.routes';

// Environment
import { environment } from '../environments/environment';

// Interceptors
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

/**
 * Configuration de l'application Angular 19
 * Utilise la nouvelle API de configuration standalone
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ===================
    // Router Configuration
    // ===================
    provideRouter(
      routes,
      // Bloque la navigation initiale jusqu'à ce que le router soit prêt
      withEnabledBlockingInitialNavigation(),
      
      // Gestion du scroll
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      
      // Configuration du router
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),

    // ===================
    // HTTP Client
    // ===================
    provideHttpClient(
      // Utilise l'API fetch moderne
      withFetch(),
      
      // Intercepteurs dans l'ordre d'exécution
      withInterceptors([
        loadingInterceptor,  // Gestion du loading
        authInterceptor,     // Ajout du token d'auth
        errorInterceptor     // Gestion des erreurs globales
      ])
    ),

    // ===================
    // Firebase Configuration
    // ===================
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // ===================
    // PWA Service Worker
    // ===================
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      // Enregistre le SW quand l'application est stable
      // ou après 30 secondes (au cas où l'application ne deviendrait jamais stable)
      registrationStrategy: 'registerWhenStable:30000',
      // Stratégie de mise à jour
      updateStrategy: 'versionReady'
    }),

    // ===================
    // Animations
    // ===================
    provideAnimations(),

    // ===================
    // Zone.js moderne (optionnel)
    // ===================
    // Décommentez pour utiliser les nouvelles stratégies de détection de changements
    // provideZoneChangeDetection({ 
    //   eventCoalescing: true,
    //   runCoalescing: true 
    // }),

    // ===================
    // Hydratation SSR (si SSR activé)
    // ===================
    // provideClientHydration(
    //   withEventReplay(),
    //   withDomHydration()
    // ),

    // ===================
    // Providers personnalisés
    // ===================
    
    // Services globaux (optionnel, déjà fournis via providedIn: 'root')
    // AuthService,
    // ApiService,

    // Configuration globale pour les formulaires réactifs
    importProvidersFrom([
      // Modules spécifiques si nécessaire
    ]),

    // ===================
    // Configuration de développement
    // ===================
    ...(isDevMode() ? [
      // Providers spécifiques au développement
    ] : []),

    // ===================
    // Configuration de production
    // ===================
    ...(!isDevMode() ? [
      // Providers spécifiques à la production
      // Par exemple, des intercepteurs de monitoring
    ] : [])
  ]
};

/**
 * Configuration spécifique pour les tests
 */
export const testConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations(),
    
    // Mock Firebase pour les tests
    // provideFirebaseApp(() => initializeApp(testEnvironment.firebase)),
    
    // Pas de Service Worker en test
    // provideServiceWorker(...) 
  ]
};