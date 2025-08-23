// ========================================
// Environment de développement - CORRIGÉ
// src/environments/environment.ts
// ========================================

export const environment = {
  // ===================
  // Configuration générale
  // ===================
  production: false,
  appName: 'Micro-Crèche - Gestion du nettoyage',
  version: '1.0.0',
  
  // ===================
  // API Configuration
  // ===================
  apiUrl: 'http://localhost:8000',
  apiTimeout: 30000, // 30 secondes
  
  // ===================
  // Firebase Configuration
  // ===================
  firebase: {
    apiKey: "AIzaSyABEsIGWnPHyUzfclVEzjWEmHHnh6_0ILw",
    authDomain: "cleaning-app-toulouse.firebaseapp.com",
    projectId: "cleaning-app-toulouse",
    storageBucket: "cleaning-app-toulouse.firebasestorage.app",
    messagingSenderId: "971814563402",
    appId: "1:971814563402:web:4d0aa11a34c3a1eb8c40b3",
    measurementId: "G-P5YGVB17TC"
  },
  
  // ===================
  // PWA Configuration
  // ===================
  pwa: {
    enabled: false, // Désactivé en développement
    updateCheckInterval: 30000, // 30 secondes
    notificationIcon: '/assets/icons/icon-192x192.png'
  },
  
  // ===================
  // Cache Configuration
  // ===================
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50, // Nombre maximum d'entrées dans le cache
    enableHttpCache: true,
    enableServiceWorkerCache: false
  },
  
  // ===================
  // Logging Configuration
  // ===================
  logging: {
    level: 'debug' as const, // 'error' | 'warn' | 'info' | 'debug'
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    remoteLoggingUrl: ''
  },
  
  // ===================
  // Performance Configuration
  // ===================
  performance: {
    enableMetrics: true,
    enableWebVitals: true,
    enablePerformanceObserver: true,
    enableMemoryMonitoring: true
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
    enableDebugPanel: true
  },
  
  // ===================
  // Security Configuration
  // ===================
  security: {
    enableCSP: false, // Désactivé en développement
    enableHttps: false,
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
    maxLoginAttempts: 5,
    sessionTimeout: 8 * 60 * 60 * 1000 // 8 heures
  },
  
  // ===================
  // Upload Configuration
  // ===================
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.8,
    maxDimensions: { width: 1920, height: 1080 }
  },
  
  // ===================
  // Development Tools
  // ===================
  devTools: {
    enableReduxDevTools: true,
    enableAngularDevKit: true,
    enableMockData: false,
    enableTestUsers: true,
    showPerformanceMetrics: true
  },
  
  // ===================
  // External Services (Développement)
  // ===================
  services: {
    analytics: {
      enabled: false,
      trackingId: ''
    },
    sentry: {
      enabled: false,
      dsn: '',
      environment: 'development'
    },
    monitoring: {
      enabled: false,
      endpoint: ''
    }
  }
};

// ========================================
// Types TypeScript pour les environments
// src/environments/environment.interface.ts
// ========================================

export interface Environment {
  // Configuration générale
  production: boolean;
  appName: string;
  version: string;
  
  // API
  apiUrl: string;
  apiTimeout: number;
  
  // Firebase
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  
  // PWA
  pwa: {
    enabled: boolean;
    updateCheckInterval: number;
    notificationIcon: string;
  };
  
  // Cache
  cache: {
    defaultTtl: number;
    maxSize: number;
    enableHttpCache: boolean;
    enableServiceWorkerCache: boolean;
  };
  
  // Logging
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enableConsoleLogging: boolean;
    enableRemoteLogging: boolean;
    remoteLoggingUrl: string;
  };
  
  // Performance
  performance: {
    enableMetrics: boolean;
    enableWebVitals: boolean;
    enablePerformanceObserver: boolean;
    enableMemoryMonitoring: boolean;
  };
  
  // Feature flags
  features: {
    enableOfflineMode: boolean;
    enablePhotoUpload: boolean;
    enableNotifications: boolean;
    enableExport: boolean;
    enableAdvancedReports: boolean;
    enableUserManagement: boolean;
    enableDebugPanel: boolean;
  };
  
  // Security
  security: {
    enableCSP: boolean;
    enableHttps: boolean;
    tokenRefreshThreshold: number;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
  
  // Upload
  upload: {
    maxFileSize: number;
    allowedImageTypes: string[];
    compressionQuality: number;
    maxDimensions: {
      width: number;
      height: number;
    };
  };
  
  // Dev tools
  devTools: {
    enableReduxDevTools: boolean;
    enableAngularDevKit: boolean;
    enableMockData: boolean;
    enableTestUsers: boolean;
    showPerformanceMetrics: boolean;
  };
  
  // Services externes
  services: {
    analytics: {
      enabled: boolean;
      trackingId: string;
    };
    sentry: {
      enabled: boolean;
      dsn: string;
      environment: string;
    };
    monitoring: {
      enabled: boolean;
      endpoint: string;
    };
  };
}