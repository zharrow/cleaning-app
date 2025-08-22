// ========================================
// Environment de développement
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
  apiUrl: 'http://localhost:8000/api',
  apiTimeout: 30000, // 30 secondes
  
  // ===================
  // Firebase Configuration
  // ===================
  firebase: {
    apiKey: "your-api-key-here",
    authDomain: "micro-creche-dev.firebaseapp.com",
    projectId: "micro-creche-dev",
    storageBucket: "micro-creche-dev.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX" // Optionnel pour Analytics
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
    level: 'debug', // 'error' | 'warn' | 'info' | 'debug'
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
    enableCSP: false, // Plus permissif en dev
    enableHttps: false,
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes avant expiration
    maxLoginAttempts: 5,
    sessionTimeout: 8 * 60 * 60 * 1000 // 8 heures
  },
  
  // ===================
  // Upload Configuration
  // ===================
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
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
    enableMockData: true,
    enableTestUsers: true,
    showPerformanceMetrics: true
  },
  
  // ===================
  // External Services (Dev)
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
  apiUrl: 'https://api.votre-domaine.com/api',
  apiTimeout: 15000, // 15 secondes en production
  
  // ===================
  // Firebase Configuration (Production)
  // ===================
  firebase: {
    apiKey: "your-production-api-key",
    authDomain: "micro-creche-prod.firebaseapp.com",
    projectId: "micro-creche-prod",
    storageBucket: "micro-creche-prod.appspot.com",
    messagingSenderId: "987654321",
    appId: "1:987654321:web:fedcba654321",
    measurementId: "G-YYYYYYYYYY"
  },
  
  // ===================
  // PWA Configuration
  // ===================
  pwa: {
    enabled: true,
    updateCheckInterval: 60000, // 1 minute
    notificationIcon: '/assets/icons/icon-192x192.png'
  },
  
  // ===================
  // Cache Configuration
  // ===================
  cache: {
    defaultTtl: 10 * 60 * 1000, // 10 minutes
    maxSize: 100,
    enableHttpCache: true,
    enableServiceWorkerCache: true
  },
  
  // ===================
  // Logging Configuration
  // ===================
  logging: {
    level: 'warn', // Moins verbeux en production
    enableConsoleLogging: false,
    enableRemoteLogging: true,
    remoteLoggingUrl: 'https://logs.votre-domaine.com/api/logs'
  },
  
  // ===================
  // Performance Configuration
  // ===================
  performance: {
    enableMetrics: true,
    enableWebVitals: true,
    enablePerformanceObserver: false, // Désactivé pour les performances
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
    maxFileSize: 5 * 1024 * 1024, // 5MB en production
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.7, // Plus de compression
    maxDimensions: { width: 1280, height: 720 }
  },
  
  // ===================
  // Development Tools (Désactivés)
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
      endpoint: 'https://monitoring.votre-domaine.com/api'
    }
  }
};

// ========================================
// Environment de test
// src/environments/environment.test.ts
// ========================================

export const environment = {
  // ===================
  // Configuration générale
  // ===================
  production: false,
  appName: 'Micro-Crèche - Tests',
  version: '1.0.0-test',
  
  // ===================
  // API Configuration
  // ===================
  apiUrl: 'http://localhost:8001/api', // Port différent pour les tests
  apiTimeout: 5000, // Plus court pour les tests
  
  // ===================
  // Firebase Configuration (Test)
  // ===================
  firebase: {
    apiKey: "test-api-key",
    authDomain: "micro-creche-test.firebaseapp.com",
    projectId: "micro-creche-test",
    storageBucket: "micro-creche-test.appspot.com",
    messagingSenderId: "111111111",
    appId: "1:111111111:web:test123456",
    measurementId: "G-TESTTESTING"
  },
  
  // ===================
  // PWA Configuration
  // ===================
  pwa: {
    enabled: false, // Désactivé pour les tests
    updateCheckInterval: 1000,
    notificationIcon: '/assets/icons/icon-192x192.png'
  },
  
  // ===================
  // Cache Configuration
  // ===================
  cache: {
    defaultTtl: 1000, // 1 seconde pour les tests
    maxSize: 10,
    enableHttpCache: false, // Désactivé pour des tests prévisibles
    enableServiceWorkerCache: false
  },
  
  // ===================
  // Logging Configuration
  // ===================
  logging: {
    level: 'debug',
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    remoteLoggingUrl: ''
  },
  
  // ===================
  // Performance Configuration
  // ===================
  performance: {
    enableMetrics: false,
    enableWebVitals: false,
    enablePerformanceObserver: false,
    enableMemoryMonitoring: false
  },
  
  // ===================
  // Feature Flags
  // ===================
  features: {
    enableOfflineMode: false, // Simplifie les tests
    enablePhotoUpload: false,
    enableNotifications: false,
    enableExport: false,
    enableAdvancedReports: false,
    enableUserManagement: true,
    enableDebugPanel: true
  },
  
  // ===================
  // Security Configuration
  // ===================
  security: {
    enableCSP: false,
    enableHttps: false,
    tokenRefreshThreshold: 1000,
    maxLoginAttempts: 10, // Plus permissif pour les tests
    sessionTimeout: 60 * 1000 // 1 minute
  },
  
  // ===================
  // Upload Configuration
  // ===================
  upload: {
    maxFileSize: 1024 * 1024, // 1MB
    allowedImageTypes: ['image/jpeg', 'image/png'],
    compressionQuality: 0.5,
    maxDimensions: { width: 640, height: 480 }
  },
  
  // ===================
  // Development Tools
  // ===================
  devTools: {
    enableReduxDevTools: false,
    enableAngularDevKit: false,
    enableMockData: true, // Données de test
    enableTestUsers: true,
    showPerformanceMetrics: false
  },
  
  // ===================
  // External Services (Tests)
  // ===================
  services: {
    analytics: {
      enabled: false,
      trackingId: ''
    },
    sentry: {
      enabled: false,
      dsn: '',
      environment: 'test'
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