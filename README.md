# 🎨 cLean App - Frontend Angular

Application Angular 19 PWA pour la gestion du nettoyage et HACCP en micro-crèche.

## 🚀 Démarrage rapide

```bash
pnpm install
pnpm start
```

→ http://localhost:4200

## 📚 Scripts disponibles

```bash
pnpm start              # Dev server
pnpm build              # Build production
pnpm build:prod         # Build prod optimisé
pnpm lint               # ESLint
pnpm lint:fix           # Fix ESLint
pnpm type-check         # TypeScript check
pnpm test               # Tests unitaires
pnpm test:ci            # Tests CI avec coverage
pnpm precommit          # Lint + type-check + format
```

## 🛠️ Stack

- **Framework**: Angular 19
- **State**: Signals + Resource API
- **Components**: Standalone
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **UI**: CSS Variables (Tailwind-inspired)
- **Real-time**: WebSocket

## 📱 Modules

### cLean (Nettoyage)
- Dashboard avec métriques
- Gestion pièces, tâches, employés
- Session du jour avec progression temps réel
- Historique avec statistiques
- Upload photos Firebase
- Interface tablette pour employés

### HACCP (8 composants)
- Dashboard HACCP avec alertes
- Gestion enfants avec allergies
- Gestion repas avec températures
- Gestion produits avec alertes péremption
- Gestion fournisseurs
- Gestion équipements
- Gestion non-conformités
- Gestion documents

### Communication (2 composants)
- Messages (style Messenger avec WebSocket)
- Notifications (centre de notifications temps réel)

### Analytics
- Dashboard développeur (KPIs globaux)

## 🎯 Architecture

```
src/app/
├── core/
│   ├── services/      # ApiService, AuthService, HaccpService, etc.
│   ├── guards/        # Auth guards (developer, admin, user)
│   └── interceptors/  # HTTP interceptors
├── shared/
│   ├── components/    # Header, Sidebar, StatsCard
│   └── layouts/       # MainLayout, TabletLayout
└── features/
    ├── auth/          # Login (Firebase + PIN)
    ├── dashboard/     # Dashboard admin
    ├── manage/        # CRUD (rooms, tasks, users)
    ├── session/       # Session du jour
    ├── history/       # Historique sessions
    ├── haccp/         # 8 composants HACCP
    ├── communication/ # Messages + Notifications
    ├── analytics/     # Dashboard développeur
    └── tablet/        # Interfaces tablette
```

## 🔐 Authentification

- **Admin/Developer**: Firebase Auth (email/password)
- **User/Employé**: Code PIN local (4-6 chiffres)

## 🧪 Tests

```bash
pnpm test           # Jasmine/Karma
pnpm test:ci        # CI avec coverage
```

## 📦 Build

```bash
pnpm build:prod     # Production build
```

Output: `dist/clean-app/`

---

**Status**: 100% implémenté
**Version**: 1.0.0
