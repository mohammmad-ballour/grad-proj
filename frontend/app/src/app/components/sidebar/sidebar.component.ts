import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AppRoutes } from '../../config/app-routes.enum';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule, RouterLinkActive],
  template: `
    <mat-nav-list>
      @for (item of navItems; track item.path) {
        <a mat-list-item [routerLink]="item.path" routerLinkActive="active" class="nav-item">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon> 
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styleUrl: "sidebar.component.css"
})
export class SidebarComponent {
  navItems: { path: string | null, icon: string, label: string }[];

  constructor(private authService: AuthService) {
    this.navItems = [
      { path: AppRoutes.HOME, icon: 'home', label: 'Home' },
      { path: this.authService.UserName, icon: 'person', label: 'Profile' }, // just username
      { path: "explore", icon: 'explore', label: 'Explore' },
      { path: AppRoutes.NOTIFICATIONS, icon: 'notifications', label: 'Notifications' },
      { path: AppRoutes.MESSAGES, icon: 'messages', label: 'Messages' },
      { path: AppRoutes.MORE, icon: 'more', label: 'More' },
    ];
  }
}

