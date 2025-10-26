import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AppRoutes } from '../../../config/app-routes.enum';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

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
          @if (item.label === 'Messages' && unreadMessages > 0) {
            <span class="badge"><i class="bi bi-bell-fill"></i>{{ unreadMessages }}</span>
          }
          @if (item.label === 'Notifications' && unreadNotifications > 0) {
            <span class="badge-Notifications"><i class="bi bi-bell-fill"></i>{{ unreadNotifications }}</span>
          }
        </a>
      }
    </mat-nav-list>
  `,
  styleUrl: "sidebar.component.css"
})
export class SidebarComponent implements OnInit {
  navItems: { path: string | null, icon: string, label: string }[];
  unreadMessages: number = 0;
  unreadNotifications: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.navItems = [
      { path: AppRoutes.HOME, icon: 'home', label: 'Home' },
      { path: this.authService.UserName, icon: 'person', label: 'Profile' },
      { path: AppRoutes.BOOKMARKS, icon: 'bookmark', label: 'Bookmarks' },
      { path: AppRoutes.NOTIFICATIONS, icon: 'notifications', label: 'Notifications' },
      { path: AppRoutes.MESSAGES, icon: 'messages', label: 'Messages' },
      { path: AppRoutes.LOGOUT, icon: 'logout', label: 'Logout' },
    ];
  }

  ngOnInit(): void {
    this.notificationService.unreadMessagesCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadMessages = count);

    this.notificationService.unreadNotificationsCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadNotifications = count);

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}