import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthMultiTierService, EmployeeUser } from '../../../core/services/auth-multi-tier.service';

@Component({
  selector: 'app-tablet-home',
  imports: [CommonModule],
  templateUrl: './tablet-home.component.html',
  styleUrl: './tablet-home.component.css'
})
export class TabletHomeComponent {
  private readonly authService = inject(AuthMultiTierService);
  private readonly router = inject(Router);

  // Get current employee user
  readonly currentUser = computed(() => {
    const user = this.authService.appUser();
    return user?.user_type === 'employee' ? (user as EmployeeUser) : null;
  });

  readonly accessibleRooms = computed(() =>
    this.currentUser()?.accessible_rooms || []
  );

  readonly hasRooms = computed(() => this.accessibleRooms().length > 0);

  /**
   * Navigate to room
   */
  goToRoom(roomId: string): void {
    this.router.navigate(['/tablet/room', roomId]);
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await this.authService.logout();
    }
  }
}
