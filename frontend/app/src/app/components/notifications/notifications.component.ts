import {CommonModule} from "@angular/common";
import {Component, Input} from '@angular/core';
import {NotificationService} from "../services/notification.service";
import {OnInit} from "@angular/core";
import {NotificationDto} from "./models/notification.model";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  @Input() notifications: NotificationDto[] = [];

  constructor(private notificationService: NotificationService) {
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        console.log('notifications ', data);
        this.notifications = data
      },
      error: (err) => console.error('Failed to fetch notifications', err)
    });
  }

  markAllAsRead(): void {
    const unreadIds = this.notifications
      .filter(n => n.groupingState !== 'READ')
      .map(n => n.id);

    this.notificationService.markAsRead(unreadIds).subscribe({
      next: () => {
        // Update local state
        this.notifications = this.notifications.map(n => ({
          ...n,
          groupingState: 'READ'
        }));
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  // Convert byte[] to image source (base64)
  toImageSrc(bytes: Uint8Array | null): string {
    if (!bytes) return 'assets/ProfileAvatar.png';
    const base64 = btoa(String.fromCharCode(...bytes));
    return `data:image/jpeg;base64,${base64}`;
  }

  // Convert enum to readable label
  readableState(state: string): string {
    switch (state) {
      case 'UNREAD_YET':
        return 'Unread';
      case 'HAS_NEW_ACTIVITY':
        return 'New Activity';
      case 'READ':
        return 'Read';
      default:
        return '';
    }
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  actionText(n: NotificationDto): string {
    switch (n.type) {
      case 'LIKE':
        return ' liked your status';
      case 'REPLY':
        return ' replied to your status';
      case 'MENTION':
        return ' mentioned you in';
      case 'FOLLOW':
        return ' followed you';
      case 'RESTRICT':
        return ' restricted your account for 3 days';
      default:
        return n.type.toLowerCase();
    }
  }

  actorSummary(names: string[]): string {
    if (!names || names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }


}
