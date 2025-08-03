import { Component, Input, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="post">
      <mat-card-header>
        <div class="header-content">
          <mat-card-title>{{ post.user }}</mat-card-title>
          <mat-card-subtitle>{{ post.time }}</mat-card-subtitle>
        </div>
      </mat-card-header>
      <mat-card-content #contentElement class="post-content" [ngClass]="{'expanded': isExpanded}">
        {{ post.content }}
      </mat-card-content>
      <div *ngIf="isContentOverflowing" class="see-more">
        <button mat-button (click)="toggleExpand()" class="see-more-btn">
          {{ isExpanded ? 'See Less' : 'See More' }}
        </button>
      </div>
      <mat-card-actions>
        <button mat-button class="action-btn" (click)="toggleLike()">
          <mat-icon [ngClass]="{'liked': isLiked}">
            {{ isLiked ? 'favorite' : 'favorite_border' }}
          </mat-icon>
          like
        </button>
        <button mat-button class="action-btn"><mat-icon>comment</mat-icon>comment</button>
        <button mat-button class="action-btn"><mat-icon>share</mat-icon>share</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .post {
      width: 95%;
      margin: 8px auto;
      border: none;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      background-color: white;
      padding: 12px;
      overflow: hidden;
    }
    mat-card-header {
      padding: 0;
      margin: 0;
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    mat-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #14171a;
      margin: 0;
      line-height: 1.2;
    }
    mat-card-subtitle {
      font-size: 12px;
      color: #657786;
      margin: 0;
      line-height: 1.2;
    }
    .post-content {
      font-size: 14px;
      color: #14171a;
      padding: 0;
      margin: 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      transition: all 0.3s ease;
    }
    .post-content.expanded {
      -webkit-line-clamp: unset;
      overflow: visible;
      text-overflow: clip;
    }
    .see-more {
      margin-top: 4px;
    }
    .see-more-btn {
      font-size: 12px;
      color: #1da1f2;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    mat-card-actions {
    display: flex;
    border-top: 2px solid #1976d2;
    justify-content: space-around;
    padding: 8px;
    margin: 0;
    }
    .action-btn {
      font-size: 12px;
      color: #1976d2;
      background: white;
      cursor: pointer;
      padding: 4px 10px;
    }
    .action-btn:hover {
      color: #1976d2;
      background: white;
    }
    .liked {
      color:  #1976d2;
    }
  `]
})
export class PostCardComponent implements AfterViewInit {
  @Input() post!: { user: string; time: string; content: string };
  @ViewChild('contentElement') contentElement!: ElementRef;
  isExpanded = false;
  isContentOverflowing = false;
  isLiked = false; // New property to track like state

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    // Defer overflow check to ensure DOM is fully rendered
    setTimeout(() => {
      if (this.contentElement?.nativeElement) {
        const element = this.contentElement.nativeElement;
        this.isContentOverflowing = element.scrollHeight > element.clientHeight;
        this.cdr.detectChanges();
      }
    }, 0);
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges(); // Ensure UI updates after toggle
  }

  toggleLike() {
    this.isLiked = !this.isLiked; // Toggle like state
    this.cdr.detectChanges(); // Ensure UI updates after toggle
  }
}