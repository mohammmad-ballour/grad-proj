import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface Message {
  id: number;
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
  ],
  template: `
    <div class="messages-container">
      <mat-card *ngFor="let message of filteredMessages" class="message-card">
        <mat-card-content>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>message</mat-icon>
              <span matListItemTitle>{{ message.content }}</span>
              <span matListItemLine>{{ message.timestamp }}</span>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
      <div *ngIf="filteredMessages.length === 0" class="no-messages">
        No messages found.
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .messages-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .message-card {
      margin-bottom: 16px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 20px; /* Matches HeaderComponent's border radius */
      color: var(--mdc-theme-on-surface, white);
    }

    .mat-mdc-card-content {
      padding: 12px;
    }

    .mat-list-item {
      color: var(--mdc-theme-on-surface, white);
    }

    .mat-icon {
      color: var(--mdc-theme-primary, white);
    }

    .no-messages {
      text-align: center;
      color: var(--mdc-theme-on-surface-variant, rgba(255, 255, 255, 0.7));
      padding: 20px;
    }

    @media (max-width: 600px) {
      .messages-container {
        padding: 8px;
      }

      .message-card {
        border-radius: 16px; /* Slightly smaller radius for mobile */
      }
    }
  `],
})
export class MessagesComponent implements OnInit {
  @Input() searchQuery: string = '';

  messages: Message[] = [
    { id: 1, content: 'Hello, how are you?', timestamp: '2025-05-27 16:30' },
    { id: 2, content: 'Meeting at 5 PM today.', timestamp: '2025-05-27 15:45' },
    { id: 3, content: 'Angular Material is awesome!', timestamp: '2025-05-27 14:20' },
  ];

  filteredMessages: Message[] = [];

  ngOnInit() {
    this.filteredMessages = [...this.messages];
  }

  ngOnChanges() {
    this.filterMessages();
  }

  private filterMessages() {
    const query = this.searchQuery?.trim().toLowerCase() ?? '';
    this.filteredMessages = query
      ? this.messages.filter(message =>
        message.content.toLowerCase().includes(query)
      )
      : [...this.messages];
  }
}