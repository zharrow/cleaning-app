import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">{{ title }}</p>
          <p class="text-2xl font-bold mt-2" [class]="getValueClass()">
            {{ value }}
          </p>
        </div>
        <div [class]="getIconContainerClass()" class="p-3 rounded-lg">
          <lucide-icon [name]="icon" [size]="24" [class]="getIconClass()"></lucide-icon>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() icon = 'info';
  @Input() color: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
  
  getValueClass(): string {
    const colors = {
      default: 'text-gray-900',
      primary: 'text-primary-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };
    return colors[this.color];
  }
  
  getIconContainerClass(): string {
    const colors = {
      default: 'bg-gray-100',
      primary: 'bg-primary-100',
      success: 'bg-green-100',
      warning: 'bg-yellow-100',
      danger: 'bg-red-100'
    };
    return colors[this.color];
  }
  
  getIconClass(): string {
    const colors = {
      default: 'text-gray-600',
      primary: 'text-primary-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };
    return colors[this.color];
  }
}