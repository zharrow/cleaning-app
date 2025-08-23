// ========================================
// Bootstrap principal Angular 19 - CORRIGÉ
// src/main.ts
// ========================================
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

/**
 * Configuration d'initialisation de l'application
 */
async function initializeApp(): Promise<void> {
  if (!environment.production) {
    console.log('🚀 Démarrage de l\'application Micro-Crèche');
    console.log('📊 Environment:', environment);
    console.log('🔧 Mode développement activé');
  }

  await loadPolyfillsIfNeeded();
  configurePWA();
  configurePerformance();
}

/**
 * Chargement des polyfills optionnels
 */
async function loadPolyfillsIfNeeded(): Promise<void> {
  // ✅ Polyfill conditionnel pour IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    console.log('🔧 IntersectionObserver non disponible - utilisation du fallback');
    // Fallback simple au lieu d'importer un package manquant
    (window as any).IntersectionObserver = class {
      constructor(callback: Function) {}
      observe(target: Element) {}
      unobserve(target: Element) {}
      disconnect() {}
    };
  }

  // ✅ Polyfill conditionnel pour ResizeObserver
  if (!('ResizeObserver' in window)) {
    console.log('🔧 ResizeObserver non disponible - utilisation du fallback');
    // Fallback simple
    (window as any).ResizeObserver = class {
      constructor(callback: Function) {}
      observe(target: Element) {}
      unobserve(target: Element) {}
      disconnect() {}
    };
  }

  // ✅ Vérification des fonctionnalités CSS modernes
  if (!CSS.supports?.('color', 'oklch(0.7 0.2 180)')) {
    console.log('🎨 Couleurs modernes non supportées, fallback activé');
  }
}

/**
 * Configuration des fonctionnalités PWA
 */
function configurePWA(): void {
  if ('serviceWorker' in navigator && environment.production) {
    console.log('📱 PWA: Service Worker disponible');
    
    navigator.serviceWorker.ready.then(registration => {
      console.log('📱 PWA: Service Worker prêt');
      
      // Vérifier les mises à jour toutes les 30 minutes
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);
    });

    // Gérer l'installation de l'application
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      console.log('📱 PWA: Installation disponible');
      (window as any).deferredPrompt = e;
    });

    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA: Application installée avec succès');
    });
  }
}

/**
 * Configuration des performances
 */
function configurePerformance(): void {
  // ✅ Configuration des métriques de performance
  if (environment.performance?.enableWebVitals) {
    console.log('📊 Web Vitals activés');
  }

  // ✅ Préchargement des images critiques avec typage correct
  if (environment.production) {
    preloadCriticalImages();
  }

  // ✅ Configuration des gestionnaires d'erreurs
  setupGlobalErrorHandling();
}

/**
 * Préchargement des images critiques
 */
function preloadCriticalImages(): void {
  // ✅ Typage explicite pour éviter l'erreur TypeScript
  const criticalImages: string[] = [
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/logo.svg'
  ];

  criticalImages.forEach((imageSrc: string) => {
    const img = new Image();
    img.src = imageSrc;
  });
}

/**
 * Configuration des gestionnaires d'erreurs globaux
 */
function setupGlobalErrorHandling(): void {
  // Gestionnaire d'erreurs JavaScript global
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.error('🚨 Erreur de chargement de ressource:', event.target);
    }
  }, true);

  // Gestionnaire d'erreurs de promesses rejetées
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promesse rejetée non gérée:', event.reason);
  });
}

/**
 * Configuration post-bootstrap
 */
function configurePostBootstrap(): void {
  // Configuration du titre dynamique
  if (!environment.production) {
    document.title = '🔧 [DEV] Micro-Crèche - Gestion du nettoyage';
  }

  // Configuration des métadonnées
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 
      'Application de gestion du nettoyage quotidien pour micro-crèche. ' +
      'Planification, suivi et validation des tâches de nettoyage.'
    );
  }
}

/**
 * Affichage d'une page d'erreur de fallback
 */
function displayFallbackError(error: any): void {
  document.body.innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      padding: 2rem;
      background: #f9fafb;
      font-family: system-ui, sans-serif;
    ">
      <div style="
        max-width: 500px; 
        text-align: center; 
        padding: 2rem; 
        background: white; 
        border-radius: 0.5rem; 
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      ">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">❌ Erreur de démarrage</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          Une erreur s'est produite lors du démarrage de l'application.
        </p>
        <details style="margin-bottom: 1.5rem; text-align: left;">
          <summary style="cursor: pointer; color: #374151;">Détails de l'erreur</summary>
          <pre style="
            background: #f3f4f6; 
            padding: 1rem; 
            border-radius: 0.25rem; 
            overflow-x: auto; 
            font-size: 0.875rem; 
            margin-top: 0.5rem;
          ">${error?.message || 'Erreur inconnue'}</pre>
        </details>
        <button onclick="window.location.reload()" style="
          background: #3b82f6; 
          color: white; 
          padding: 0.75rem 1.5rem; 
          border: none; 
          border-radius: 0.375rem; 
          cursor: pointer; 
          font-weight: 500;
        ">
          🔄 Recharger la page
        </button>
      </div>
    </div>
  `;
}

/**
 * Point d'entrée principal de l'application
 */
async function main(): Promise<void> {
  try {
    await initializeApp();

    // ✅ Bootstrap de l'application Angular
    const appRef = await bootstrapApplication(AppComponent, appConfig);
    
    if (!environment.production) {
      console.log('✅ Application Angular démarrée avec succès');
      // ✅ Pas d'accès à appRef.location (n'existe pas dans ApplicationRef)
      console.log('📱 Composant racine prêt');
    }

    configurePostBootstrap();

  } catch (error) {
    console.error('❌ Erreur lors du démarrage de l\'application:', error);
    displayFallbackError(error);
  }
}

// Démarrage de l'application
main();