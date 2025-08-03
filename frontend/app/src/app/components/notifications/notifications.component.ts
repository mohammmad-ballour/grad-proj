import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Notification } from '../models/notification.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [MatListModule, MatIconModule, CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  ngOnInit() {
    // Mock data for notifications
    this.notifications = [
      { id: 1, type: 'like', userId: 2, message: 'User 2 liked your post', createdAt: '2025-05-27 13:30' },
      { id: 2, type: 'comment', userId: 3, message: 'User 3 commented on your post', createdAt: '2025-05-27 13:25' },
      { id: 3, type: 'follow', userId: 4, message: 'User 4 followed you', createdAt: '2025-05-27 13:20' }
    ];
  }

  getIcon(type: string): string {
    switch (type) {
      case 'like': return 'favorite';
      case 'comment': return 'comment';
      case 'follow': return 'person_add';
      default: return 'notifications';
    }
  }
}