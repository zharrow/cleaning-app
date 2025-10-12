// ========================================
// Environment de production
// src/environments/environment.prod.ts
// ========================================

export const environment = {
  // ===================
  // Configuration générale
  // ===================
  production: true,
  appName: 'Micro-Crèche - Gestion du nettoyage',
  version: '1.0.0',
  
  // ===================
  // API Configuration
  // ===================
  apiUrl: (globalThis as any)?.process?.env?.['NG_APP_API_URL'] || 'https://clean-api.onrender.com',
  apiTimeout: 30000,

  // ===================
  // Firebase Configuration (Production)
  // ===================
  firebase: {
    apiKey: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_API_KEY'] || '',
    authDomain: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_AUTH_DOMAIN'] || '',
    projectId: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_PROJECT_ID'] || '',
    storageBucket: '', // 🚫 Storage désactivé - on utilise l'API backend
    messagingSenderId: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_MESSAGING_SENDER_ID'] || '',
    appId: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_APP_ID'] || '',
    measurementId: (globalThis as any)?.process?.env?.['NG_APP_FIREBASE_MEASUREMENT_ID'] || ''
  },
  
  // ===================
  // PWA Configuration
  // ===================
  pwa: {
    enabled: true, // Activé en production
    updateCheckInterval: 60000, // 1 minute
    notificationIcon: '/assets/icons/icon-192x192.png'
  },
  
  // ===================
  // Cache Configuration
  // ===================
  cache: {
    defaultTtl: 30 * 60 * 1000, // 30 minutes
    maxSize: 200,
    enableHttpCache: true,
    enableServiceWorkerCache: true
  },
  
  // ===================
  // Logging Configuration
  // ===================
  logging: {
    level: 'error' as const,
    enableConsoleLogging: false,
    enableRemoteLogging: true,
    remoteLoggingUrl: 'https://logs.micro-creche.fr/api'
  },
  
  // ===================
  // Performance Configuration
  // ===================
  performance: {
    enableMetrics: true,
    enableWebVitals: true,
    enablePerformanceObserver: false, // Désactivé en prod pour les perfs
    enableMemoryMonitoring: false
  },
  
  // ===================
  // Feature Flags
  // ===================
  features: {
    enableOfflineMode: true,
    enablePhotoUpload: true,
    enableNotifications: true,
    enableExport: true,
    enableAdvancedReports: true,
    enableUserManagement: true,
    enableDebugPanel: false // Désactivé en production
  },
  
  // ===================
  // Security Configuration
  // ===================
  security: {
    enableCSP: true,
    enableHttps: true,
    tokenRefreshThreshold: 5 * 60 * 1000,
    maxLoginAttempts: 3, // Plus strict en production
    sessionTimeout: 4 * 60 * 60 * 1000 // 4 heures
  },
  
  // ===================
  // Upload Configuration
  // ===================
  upload: {
    maxFileSize: 3 * 1024 * 1024, // 3MB en production
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.7, // Plus compressé
    maxDimensions: { width: 1280, height: 720 }
  },
  
  // ===================
  // Development Tools
  // ===================
  devTools: {
    enableReduxDevTools: false,
    enableAngularDevKit: false,
    enableMockData: false,
    enableTestUsers: false,
    showPerformanceMetrics: false
  },
  
  // ===================
  // External Services (Production)
  // ===================
  services: {
    analytics: {
      enabled: true,
      trackingId: 'G-XXXXXXXXXX'
    },
    sentry: {
      enabled: true,
      dsn: 'https://your-sentry-dsn@sentry.io/project-id',
      environment: 'production'
    },
    monitoring: {
      enabled: true,
      endpoint: 'https://monitoring.micro-creche.fr/api'
    }
  }
};