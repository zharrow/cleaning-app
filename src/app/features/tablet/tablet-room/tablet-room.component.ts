import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tablet-room',
  imports: [CommonModule],
  templateUrl: './tablet-room.component.html',
  styleUrl: './tablet-room.component.css'
})
export class TabletRoomComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly roomId = signal<string>('');
  readonly roomName = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('roomId');
    if (id) {
      this.roomId.set(id);
      this.roomName.set(`Salle ${id}`);
      // TODO: Load room details and tasks from API
    }
  }

  /**
   * Go back to tablet home
   */
  goBack(): void {
    this.router.navigate(['/tablet']);
  }
}
