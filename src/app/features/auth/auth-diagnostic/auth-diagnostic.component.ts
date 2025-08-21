// // ========================================
// // src/app/features/auth/auth-diagnostic/auth-diagnostic.component.ts
// // ========================================
// import { Component, inject, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../../../core/services/auth.service';
// import { environment } from '../../../../environments/environment';

// /**
//  * Composant de diagnostic pour identifier les problèmes d'authentification
//  * À utiliser temporairement pour debugger les problèmes de rôle
//  */
// @Component({
//   selector: 'app-auth-diagnostic',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="max-w-4xl mx-auto p-6">
//       <div class="bg-white rounded-lg shadow-lg p-6">
//         <h2 class="text-2xl font-bold mb-6">🔍 Diagnostic d'authentification</h2>
        
//         <!-- État général -->
//         <div class="mb-6 p-4 bg-gray-50 rounded">
//           <h3 class="font-semibold mb-2">État général</h3>
//           <div class="space-y-1 text-sm">
//             <div>Authentifié: <span class="font-mono">{{ authService.isAuthenticated() ? '✅ Oui' : '❌ Non' }}</span></div>
//             <div>Auth prête: <span class="font-mono">{{ authService.authReady() ? '✅ Oui' : '⏳ Non' }}</span></div>
//             <div>En chargement: <span class="font-mono">{{ authService.isLoading() ? '⏳ Oui' : '✅ Non' }}</span></div>
//             <div>Environnement: <span class="font-mono">{{ environment.production ? '🚀 Production' : '🔧 Développement' }}</span></div>
//           </div>
//         </div>
        
//         <!-- Utilisateur Firebase -->
//         @if (authService.currentUser(); as firebaseUser) {
//           <div class="mb-6 p-4 bg-blue-50 rounded">
//             <h3 class="font-semibold mb-2">🔥 Firebase User</h3>
//             <div class="space-y-1 text-sm">
//               <div>UID: <span class="font-mono">{{ firebaseUser.uid }}</span></div>
//               <div>Email: <span class="font-mono">{{ firebaseUser.email }}</span></div>
//             </div>
//           </div>
//         }
        
//         <!-- Utilisateur App -->
//         @if (authService.appUser(); as appUser) {
//           <div class="mb-6 p-4 bg-green-50 rounded">
//             <h3 class="font-semibold mb-2">👤 App User</h3>
//             <div class="space-y-1 text-sm">
//               <div>ID: <span class="font-mono">{{ appUser.id }}</span></div>
//               <div>Nom: <span class="font-mono">{{ appUser.full_name }}</span></div>
//               <div>Rôle: <span class="font-mono font-bold text-blue-600">{{ appUser.role || '⚠️ AUCUN RÔLE' }}</span></div>
//               <div>Firebase UID: <span class="font-mono">{{ appUser.firebase_uid }}</span></div>
//             </div>
//           </div>
//         } @else {
//           <div class="mb-6 p-4 bg-red-50 rounded">
//             <h3 class="font-semibold mb-2 text-red-600">⚠️ Pas d'App User</h3>
//             <p class="text-sm">L'utilisateur Firebase est connecté mais l'App User n'est pas chargé depuis l'API.</p>
//           </div>
//         }
        
//         <!-- Rôles et permissions -->
//         <div class="mb-6 p-4 bg-purple-50 rounded">
//           <h3 class="font-semibold mb-2">🎭 Rôles et permissions</h3>
//           <div class="space-y-1 text-sm">
//             <div>Rôle actuel: <span class="font-mono font-bold">{{ roleInfo().current }}</span></div>
//             <div>Rôle normalisé: <span class="font-mono">{{ roleInfo().normalized }}</span></div>
//             <div>Peut gérer (canManage): <span class="font-mono">{{ roleInfo().canManage ? '✅ Oui' : '❌ Non' }}</span></div>
            
//             <div class="mt-3 pt-3 border-t">
//               <div class="font-semibold mb-1">Tests de rôle:</div>
//               <div>hasRole('admin'): <span class="font-mono">{{ roleTests().isAdmin ? '✅' : '❌' }}</span></div>
//               <div>hasRole('manager'): <span class="font-mono">{{ roleTests().isManager ? '✅' : '❌' }}</span></div>
//               <div>hasRole('gerante'): <span class="font-mono">{{ roleTests().isGerante ? '✅' : '❌' }}</span></div>
//             </div>
//           </div>
//         </div>
        
//         <!-- Actions de debug (dev uniquement) -->
//         @if (!environment.production) {
//           <div class="mb-6 p-4 bg-yellow-50 rounded border-2 border-yellow-300">
//             <h3 class="font-semibold mb-2">🔧 Actions de debug (Dev uniquement)</h3>
//             <div class="flex gap-2 flex-wrap">
//               <button
//                 (click)="setDevRole('admin')"
//                 class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//               >
//                 Forcer Admin
//               </button>
//               <button
//                 (click)="setDevRole('manager')"
//                 class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Forcer Manager
//               </button>
//               <button
//                 (click)="setDevRole('gerante')"
//                 class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//               >
//                 Forcer Gérante
//               </button>
//               <button
//                 (click)="clearDevRole()"
//                 class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
//               >
//                 Réinitialiser
//               </button>
//             </div>
//             @if (currentDevRole()) {
//               <div class="mt-2 text-sm text-yellow-700">
//                 ⚠️ Rôle forcé: <span class="font-bold">{{ currentDevRole() }}</span>
//               </div>
//             }
//           </div>
//         }
        
//         <!-- Recommandations -->
//         <div class="p-4 bg-amber-50 rounded border border-amber-300">
//           <h3 class="font-semibold mb-2">💡 Recommandations</h3>
//           <ol class="list-decimal list-inside space-y-1 text-sm">
//             @if (!authService.appUser()) {
//               <li class="text-red-600">L'utilisateur App n'est pas chargé. Vérifiez que l'API retourne bien les données utilisateur.</li>
//             }
//             @if (authService.appUser() && !authService.userRole()) {
//               <li class="text-red-600">L'utilisateur n'a pas de rôle défini. Vérifiez dans la base de données que le champ 'role' est bien renseigné.</li>
//             }
//             @if (authService.userRole() && !roleInfo().canManage) {
//               <li class="text-orange-600">L'utilisateur a le rôle "{{ authService.userRole() }}" qui ne permet pas d'accéder aux pages de gestion.</li>
//               <li>Pour accéder à /manage/*, le rôle doit être: admin, manager ou gerante.</li>
//             }
//             @if (!environment.production) {
//               <li class="text-blue-600">En mode dev, vous pouvez forcer un rôle avec les boutons ci-dessus pour tester.</li>
//             }
//           </ol>
//         </div>
        
//         <!-- Console debug -->
//         <div class="mt-6 p-4 bg-gray-100 rounded">
//           <p class="text-xs text-gray-600">
//             💻 Dans la console, utilisez: <code class="bg-white px-1">authDebug.info()</code> pour voir l'état complet
//           </p>
//         </div>
//       </div>
//     </div>
//   `,
//   styles: []
// })
// export class AuthDiagnosticComponent {
//   authService = inject(AuthService);
//   environment = environment;
  
//   // Computed pour les infos de rôle
//   roleInfo = computed(() => ({
//     current: this.authService.userRole() || '❌ AUCUN',
//     normalized: this.authService.normalizedRole() || '❌ AUCUN',
//     canManage: this.authService.canManage()
//   }));
  
//   // Tests de rôle
//   roleTests = computed(() => ({
//     isAdmin: this.authService.hasRole('admin'),
//     isManager: this.authService.hasRole('manager'),
//     isGerante: this.authService.hasRole('gerante')
//   }));
  
//   // Dev role actuel
//   currentDevRole = computed(() => {
//     if (environment.production) return null;
//     // Accès au devRole via la méthode info() exposée dans authDebug
//     const authDebug = (window as any).authDebug;
//     return authDebug?.getRole?.() || null;
//   });
  
//   setDevRole(role: 'admin' | 'manager' | 'gerante') {
//     if (!environment.production) {
//       this.authService.setDevRole(role);
//       console.log(`✅ Rôle forcé à: ${role}`);
//       // Recharger la page pour appliquer le nouveau rôle
//       setTimeout(() => window.location.reload(), 500);
//     }
//   }
  
//   clearDevRole() {
//     if (!environment.production) {
//       this.authService.setDevRole(null);
//       console.log('✅ Rôle réinitialisé');
//       // Recharger la page
//       setTimeout(() => window.location.reload(), 500);
//     }
//   }
// }