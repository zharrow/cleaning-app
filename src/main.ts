// ========================================
// Bootstrap principal Angular 19
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
  // Logs de démarrage en développement
  if (!environment.production) {
    console.log('🚀 Démarrage de l\'application Micro-Crèche');
    console.log('📊 Environment:', environment);
    console.log('🔧 Mode développement activé');
  }

  // Configuration des polyfills si nécessaire
  await loadPolyfills();

  // Configuration PWA
  configurePWA();

  // Configuration des performances
  configurePerformance();
}

/**
 * Chargement des polyfills pour les navigateurs plus anciens
 */
async function loadPolyfills(): Promise<void> {
  // Polyfill pour IntersectionObserver (si nécessaire)
  if (!('IntersectionObserver' in window)) {
    await import('intersection-observer');
  }

  // Polyfill pour ResizeObserver (si nécessaire)
  if (!('ResizeObserver' in window)) {
    const module = await import('@juggle/resize-observer');
    (window as any).ResizeObserver = module.ResizeObserver;
  }

  // Polyfill pour les fonctionnalités modernes de CSS (si nécessaire)
  if (!CSS.supports?.('color', 'oklch(0.7 0.2 180)')) {
    // Fallback pour les couleurs modernes si nécessaire
    console.log('🎨 Couleurs modernes non supportées, fallback activé');
  }
}

/**
 * Configuration des fonctionnalités PWA
 */
function configurePWA(): void {
  // Configuration des métadonnées PWA
  if ('serviceWorker' in navigator && environment.production) {
    // Le service worker sera enregistré automatiquement par Angular
    console.log('📱 PWA: Service Worker disponible');
    
    // Écouter les mises à jour
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
      
      // Stocker l'événement pour l'utiliser plus tard
      (window as any).deferredPrompt = e;
    });

    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA: Application installée avec succès');
    });
  }

  // Configuration des notifications (si permissions accordées)
  if ('Notification' in window && Notification.permission === 'granted') {
    console.log('🔔 Notifications autorisées');
  }
}

/**
 * Configuration des optimisations de performance
 */
function configurePerformance(): void {
  // Préchargement des ressources critiques
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Précharger les images importantes en arrière-plan
      const criticalImages = [
        // '/assets/images/logo.png',
        // '/assets/images/icons/cleaning.svg'
      ];
      
      criticalImages.forEach(imageSrc => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = imageSrc;
        document.head.appendChild(link);
      });
    });
  }

  // Configuration des métriques de performance en développement
  if (!environment.production && 'performance' in window) {
    // Observer les métriques Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`⚡ Performance: ${entry.name}`, entry);
      }
    }).observe({ entryTypes: ['measure', 'navigation'] });
  }

  // Configuration de la stratégie de rendu
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    console.log('🚀 Scheduler API disponible pour l\'optimisation des tâches');
  }
}

/**
 * Gestionnaire d'erreurs globales
 */
function setupGlobalErrorHandling(): void {
  // Gestionnaire d'erreurs JavaScript
  window.addEventListener('error', (event) => {
    console.error('🚨 Erreur JavaScript globale:', event.error);
    
    // En production, envoyer à un service de monitoring
    if (environment.production) {
      // Exemple avec Sentry ou service similaire
      // Sentry.captureException(event.error);
    }
  });

  // Gestionnaire d'erreurs de promesses non catchées
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promesse rejetée non gérée:', event.reason);
    
    if (environment.production) {
      // Logging en production
      // Sentry.captureException(event.reason);
    }
  });

  // Gestionnaire d'erreurs de ressources (images, scripts, etc.)
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.error('🚨 Erreur de chargement de ressource:', event.target);
    }
  }, true);
}

/**
 * Configuration des fonctionnalités modernes du navigateur
 */
function setupModernFeatures(): void {
  // Configuration de l'API de partage natif
  if ('share' in navigator) {
    console.log('📤 API de partage native disponible');
  }

  // Configuration de l'API de vibration
  if ('vibrate' in navigator) {
    console.log('📳 API de vibration disponible');
  }

  // Configuration de l'API de wake lock
  if ('wakeLock' in navigator) {
    console.log('🔋 API Wake Lock disponible');
  }

  // Configuration de l'API de badge
  if ('setAppBadge' in navigator) {
    console.log('🏷️ API Badge d\'application disponible');
  }
}

/**
 * Point d'entrée principal de l'application
 */
async function main(): Promise<void> {
  try {
    // Initialisation
    await initializeApp();
    
    // Configuration des gestionnaires d'erreurs
    setupGlobalErrorHandling();
    
    // Configuration des fonctionnalités modernes
    setupModernFeatures();

    // Bootstrap de l'application Angular
    const appRef = await bootstrapApplication(AppComponent, appConfig);
    
    // Log de succès
    if (!environment.production) {
      console.log('✅ Application Angular démarrée avec succès');
      console.log('📱 Composant racine:', appRef.location.nativeElement);
    }

    // Configuration post-bootstrap
    configurePostBootstrap(appRef);

  } catch (error) {
    console.error('❌ Erreur lors du démarrage de l\'application:', error);
    
    // Affichage d'une page d'erreur de fallback
    displayFallbackError(error);
  }
}

/**
 * Configuration après le bootstrap de l'application
 */
function configurePostBootstrap(appRef: any): void {
  // Configuration du titre dynamique
  if (!environment.production) {
    document.title = '🔧 [DEV] Micro-Crèche - Gestion du nettoyage';
  }

  // Configuration des métadonnées
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 
      'Application de gestion du nettoyage quotidien pour micro-crèche. ' +
      'Planification, suivi et validation des tâches de nettoyage.');
  }

  // Configuration du thème couleur pour la PWA
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', '#3B82F6'); // Couleur primaire
  }
}

/**
 * Affichage d'une page d'erreur de fallback
 */
function displayFallbackError(error: any): void {
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      margin: 0;
      padding: 20px;
    ">
      <div style="
        text-align: center;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        max-width: 500px;
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
        <h1 style="color: #1f2937; margin-bottom: 16px; font-size: 1.5rem;">
          Erreur de démarrage
        </h1>
        <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.5;">
          Une erreur est survenue lors du chargement de l'application.
          Veuillez rafraîchir la page ou contacter le support technique.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-right: 12px;
          "
        >
          Rafraîchir la page
        </button>
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; color: #6b7280;">Détails techniques</summary>
          <pre style="
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
            font-size: 0.875rem;
            color: #1f2937;
            margin-top: 8px;
          ">${error?.stack || error?.message || 'Erreur inconnue'}</pre>
        </details>
      </div>
    </div>
  `;
}

// Démarrage de l'application
main().catch(error => {
  console.error('❌ Erreur fatale au démarrage:', error);
  displayFallbackError(error);
});