# 🧹 Micro-Crèche - Application Angular 19

> Application moderne de gestion du nettoyage quotidien pour micro-crèche, construite avec **Angular 19**, **Firebase**, et les dernières innovations web.

## 🚀 Nouvelles fonctionnalités Angular 19

Cette application utilise toutes les dernières fonctionnalités d'Angular 19 :

### ✨ Architecture moderne
- ✅ **Standalone components** uniquement
- ✅ **Signals** pour la gestion d'état réactive
- ✅ **New Control Flow** (`@if`, `@for`, `@switch`)
- ✅ **input()** et **output()** au lieu des décorateurs
- ✅ **resource()** pour la gestion des données HTTP
- ✅ **Functional Guards** avec `inject()`
- ✅ **Functional Interceptors**

### 🎯 Fonctionnalités avancées
- 📱 **PWA complète** avec service worker
- 🔥 **Firebase Authentication**
- 🎨 **CSS moderne** avec variables et animations
- 📊 **Dashboard interactif**
- 📸 **Upload de photos**
- 📄 **Export PDF**
- 🌐 **Mode hors ligne**

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Angular CLI** >= 19.0.0
- **Compte Firebase** (gratuit)

## 🛠️ Installation

### 1. Cloner et installer

```bash
# Cloner le repository
git clone <your-repo-url>
cd micro-creche-app

# Installer les dépendances
npm install

# Installer Angular CLI si nécessaire
npm install -g @angular/cli@19
```

### 2. Configuration Firebase

#### A. Créer un projet Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Créer un nouveau projet
3. Activer **Authentication** > **Email/Password**
4. Récupérer la configuration

#### B. Configurer l'application
```bash
# Copier les environnements
cp src/environments/environment.ts src/environments/environment.local.ts
```

Éditer `src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  firebase: {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  }
  // ... autres configurations
};
```

### 3. Démarrage rapide

```bash
# Développement
npm start

# Production locale
npm run start:prod

# Build
npm run build

# Tests
npm test

# Linting
npm run lint
```

L'application sera disponible sur `http://localhost:4200`

## 📁 Structure du projet

```
src/
├── 📁 app/
│   ├── 📁 core/                    # Services et utilitaires centraux
│   │   ├── 📁 guards/              # Guards fonctionnels Angular 19
│   │   ├── 📁 interceptors/        # Intercepteurs HTTP fonctionnels
│   │   └── 📁 services/            # Services avec signals
│   ├── 📁 features/                # Modules fonctionnels
│   │   ├── 📁 auth/                # Authentification
│   │   ├── 📁 dashboard/           # Tableau de bord
│   │   ├── 📁 session/             # Gestion des sessions
│   │   ├── 📁 manage/              # Administration
│   │   └── 📁 profile/             # Profil utilisateur
│   ├── app.component.ts            # Composant racine avec signals
│   ├── app.config.ts               # Configuration standalone
│   └── app.routes.ts               # Routes avec guards fonctionnels
├── 📁 styles/                      # CSS global modulaire
│   ├── variables.css               # Variables CSS personnalisées
│   ├── animations.css              # Animations et transitions
│   ├── components.css              # Composants réutilisables
│   ├── utilities.css               # Classes utilitaires
│   └── base.css                    # Reset et styles de base
├── 📁 environments/                # Configurations d'environnement
└── 📁 assets/                      # Assets statiques
```

## 🎯 Concepts Angular 19 utilisés

### Signals et réactivité
```typescript
// Service avec signals
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly data = signal<Data[]>([]);
  private readonly loading = signal(false);
  
  readonly dataCount = computed(() => this.data().length);
  readonly isReady = computed(() => !this.loading() && this.data().length > 0);
}
```

### Nouveaux Input/Output
```typescript
@Component({...})
export class MyComponent {
  // Nouveau: input() signal
  readonly userName = input.required<string>();
  readonly isActive = input(false);
  
  // Nouveau: output() 
  readonly userClick = output<User>();
  readonly dataChange = output<Data[]>();
}
```

### Control Flow moderne
```html
<!-- Nouveau @if au lieu de *ngIf -->
@if (user(); as currentUser) {
  <p>Bonjour {{ currentUser.name }}</p>
} @else {
  <p>Veuillez vous connecter</p>
}

<!-- Nouveau @for au lieu de *ngFor -->
@for (item of items(); track item.id) {
  <div class="item">{{ item.name }}</div>
} @empty {
  <p>Aucun élément</p>
}
```

### Resource() pour HTTP
```typescript
// Nouveau: resource() pour la gestion des données
readonly users = resource({
  request: () => ({ page: this.currentPage() }),
  loader: async ({ request }) => {
    const response = await fetch(`/api/users?page=${request.page}`);
    return response.json();
  }
});
```

### Guards fonctionnels
```typescript
// Guard fonctionnel moderne
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated() 
    ? true 
    : router.createUrlTree(['/login']);
};
```

## 🔧 Scripts disponibles

### Développement
```bash
npm start                 # Serveur de développement
npm run watch             # Build en mode watch
npm run lint              # Vérification du code
npm run lint:fix          # Correction automatique
npm run format            # Formatage du code
npm run type-check        # Vérification TypeScript
```

### Tests
```bash
npm test                  # Tests unitaires
npm run test:ci           # Tests pour CI/CD
npm run e2e               # Tests end-to-end
```

### Build et déploiement
```bash
npm run build             # Build de production
npm run build:analyze     # Analyse des bundles
npm run deploy:staging    # Déploiement staging
npm run deploy:prod       # Déploiement production
```

## 🎨 Système de design

### Variables CSS
L'application utilise un système de variables CSS modulaire :

```css
/* Variables principales */
:root {
  --color-primary-600: #2563eb;
  --color-success-500: #22c55e;
  --spacing-4: 1rem;
  --border-radius-lg: 0.5rem;
  --transition-base: 200ms ease-in-out;
}
```

### Classes utilitaires
```html
<!-- Layout -->
<div class="flex items-center justify-between gap-4">
  <h1 class="text-2xl font-bold text-gray-900">Titre</h1>
  <button class="btn btn-primary">Action</button>
</div>

<!-- Composants -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Titre de la carte</h3>
  </div>
  <div class="card-body">
    <p>Contenu de la carte</p>
  </div>
</div>
```

## 🌐 PWA et mode hors ligne

### Configuration du Service Worker
```typescript
// Configuration dans app.config.ts
provideServiceWorker('ngsw-worker.js', {
  enabled: environment.production,
  registrationStrategy: 'registerWhenStable:30000'
})
```

### Stratégies de cache
- **App Shell** : Cache en priorité
- **API Data** : Network-first avec fallback
- **Images** : Cache-first
- **Assets** : Stale-while-revalidate

## 🔐 Authentification Firebase

### Configuration
```typescript
// Dans app.config.ts
provideFirebaseApp(() => initializeApp(environment.firebase)),
provideAuth(() => getAuth()),
```

### Utilisation
```typescript
// Service d'authentification avec signals
const isAuthenticated = computed(() => !!this.currentUser());
const userRole = computed(() => this.appUser()?.role);
```

## 🚀 Performance et optimisations

### Bundle Analysis
```bash
npm run build:analyze
```

### Stratégies d'optimisation
- **Lazy Loading** : Tous les modules de fonctionnalités
- **OnPush Strategy** : Détection de changements optimisée
- **Tree Shaking** : Élimination du code mort
- **Code Splitting** : Division du code par routes
- **Service Worker** : Cache intelligent

### Budgets de performance
- **Initial Bundle** : < 2MB
- **Component Styles** : < 6KB

## 🧪 Tests

### Tests unitaires
```bash
npm test
```

### Structure des tests
```typescript
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAuth(() => getAuth())]
    });
    service = TestBed.inject(AuthService);
  });
  
  it('should authenticate user with signals', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });
});
```

## 📱 Fonctionnalités métier

### Dashboard
- 📊 Statistiques en temps réel
- 📈 Graphiques de progression
- 🔄 Actualisation automatique

### Sessions de nettoyage
- 📋 Checklist interactive
- 📸 Upload de photos
- ✅ Validation par tâche
- 💾 Sauvegarde hors ligne

### Administration
- 🏠 Gestion des pièces
- 📝 Configuration des tâches
- 👥 Gestion des utilisateurs
- 📊 Rapports et exports

## 🐛 Débogage

### Mode développement
```typescript
// Variables d'environnement de debug
environment.devTools.enableDebugPanel = true;
environment.logging.enableConsoleLogging = true;
```

### Logs utiles
```bash
# Logs de build
ng build --verbose

# Analyse des dépendances
npm ls

# Vérification des versions
ng version
```

## 📚 Documentation supplémentaire

- [Guide Angular 19](https://angular.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Angular Signals Guide](https://angular.dev/guide/signals)

## 🤝 Contribution

### Setup développeur
```bash
# Installation avec hooks
pnpm install
pnpm run prepare

# Vérification pre-commit
pnpm run precommit
```

### Standards de code
- **ESLint** : Configuration strict
- **Prettier** : Formatage automatique
- **TypeScript** : Mode strict activé
- **Husky** : Hooks Git automatiques

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🎉 Prêt à démarrer !

Votre application Angular 19 est maintenant configurée avec toutes les dernières fonctionnalités. Lancez `pnpm start` et commencez à développer ! 

Pour toute question, consultez la documentation ou créez une issue dans le repository.