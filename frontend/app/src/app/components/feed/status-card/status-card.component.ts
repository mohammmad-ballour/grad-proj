import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  StatusResponse,
  MediaResponse,
} from '../../models/StatusWithRepliesResponseDto';
import { StatusParentCardComponent } from "../status-parent-card/status-parent-card.component";

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, StatusParentCardComponent],
  template: `
    <mat-card class="post w-100">
      <!-- User Header -->
      <mat-card-header class="header">
        <img
          mat-card-avatar
          [src]="processMedia(statusData.userAvatar.profilePicture, 'image/png')"
          (error)="onImageError($event,'assets/ProfileAvatar.png')" 
          alt="avatar"
          class="avatar"
        />
        <div class="header-info text-center">
          <span class="display-name">{{ statusData.userAvatar.displayName }}</span>
          <span class="username">{{ '@'+statusData.userAvatar.username }}</span>
          <span class="dot">·</span>
          <span class="time">{{ statusData.postedAt | date: 'short' }}</span>
        </div>
      </mat-card-header>

      <!-- Post Content -->
      <mat-card-content
        #contentElement
        class="post-content"
        [ngClass]="{ expanded: isExpanded }"
      >
        {{ statusData.content }}
      </mat-card-content>

      <!-- See More Button -->
      @if (isContentOverflowing) {
        <div class="see-more">
          <button mat-button (click)="toggleExpand()" class="see-more-btn">
            {{ isExpanded ? 'See Less' : 'See More' }}
          </button>
        </div>
      }

      <!-- Media Section -->
      @if (statusData.medias && statusData.medias.length > 0) {
        <div class="media-grid">
          @for (media of statusData.medias; track media.mediaId) {
            @if (media.mimeType.startsWith('image/')) {
              <img
                [src]="'http://localhost:8080/uploads/'+media.mediaUrl"   
                class="media-item"
              />
            }
            @if (media.mimeType.startsWith('video/')) {
              <video
                controls
                class="media-item"
                [src]="processMedia(media.mediaUrl, media.mimeType)"
              ></video>
            }
          }
        </div>
      }

      <!-- Parent Snippet -->
      @if (statusData.parentStatusSnippet && statusData.parentStatusSnippet.parentStatusId) {
        <app-status-parent-card [parentStatusSnippet]="statusData.parentStatusSnippet"></app-status-parent-card>
      } @else if (!statusData.parentStatusSnippet) {
        <div class="unavailable-content">
          <mat-icon class="lock-icon">lock</mat-icon>
          <h3>This content isn't available at the moment</h3>
          <p>When this happens, it's usually because the owner only shared it with a small group of people, changed who can see it, or it's been deleted.</p>
        </div>
      }

      <!-- Actions -->
      <mat-card-actions class="actions">
        <button mat-button class="action-btn" (click)="toggleLike()">
          <i class="bi" [ngClass]="isLiked ? 'bi-heart-fill liked' : 'bi-heart'"></i>
          {{ statusData.numLikes }}
        </button>
        <button mat-button class="action-btn">
          <i class="bi bi-chat"></i> {{ statusData.numReplies }}
        </button>
        <button mat-button class="action-btn">
          <i class="bi bi-repeat"></i> {{ statusData.numShares }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .post {
        width: 100%;
        height: 100%;
        margin: 8px auto;
        border: none;
        border-radius: 12px;
        box-shadow: none;
        background-color: black;
        padding: 12px;
        overflow: hidden;
        border: 2px solid #cdd7e23b;
      }

      /* Header */
      .header {
        display: flex;
        align-items: center;
        padding: 0;
      }
      .avatar {
        border-radius: 50%;
        width: 40px;
        height: 40px;
      }
      .header-info {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        font-size: 13px;
      }
      .display-name {
        font-weight: 600;
        color: #d6daddff;
      }
      .username {
        color: #657786;
      }
      .dot {
        color: #657786;
      }
      .time {
        color: #657786;
      }

      /* Parent Snippet */
      .parent-snippet {
        margin: 4px 0 6px 48px;
        font-size: 13px;
        color: #657786;
      }
      .mention {
        color: #1da1f2;
      }

      /* Post Content */
      .post-content {
        font-size: 15px;
        color: #cdd3daff;
        margin: 8px 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        transition: all 0.3s ease;
      }
      .post-content.expanded {
        -webkit-line-clamp: unset;
        overflow: visible;
      }

      .see-more-btn {
        font-size: 13px;
        color: #1da1f2;
        padding: 0;
      }

      /* Media Grid */
      .media-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 8px;
        border-radius: 12px;
        overflow: hidden;
      }
      .media-item {
        width: 100%;
        border-radius: 12px;
        object-fit: cover;
        max-height: 300px;
      }

      /* Unavailable Content */
      .unavailable-content {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        margin-top: 8px;
        text-align: center;
        color: #333;
      }
      .lock-icon {
        font-size: 24px;
        color: #657786;
      }
      .unavailable-content h3 {
        font-size: 16px;
        margin: 8px 0;
      }
      .unavailable-content p {
        font-size: 14px;
        margin: 0;
      }

      /* Actions */
      .actions {
        display: flex;
        justify-content: space-around;
        padding: 8px 0 0;
        border-top: 1px solid #e6ecf0;
        margin-top: 8px;
      }
      .action-btn {
        font-size: 13px;
        color: #657786;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .action-btn:hover {
        color: #1da1f2;
        background: none;
      }
      .liked {
        color: #e0245e !important;
      }
    `,
  ],
})
export class StatusCardComponent implements AfterViewInit {
  @Input() statusData!: StatusResponse;
  @ViewChild('contentElement') contentElement!: ElementRef;
  isExpanded = false;
  isContentOverflowing = false;
  isLiked = false;

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.contentElement?.nativeElement) {
        const element = this.contentElement.nativeElement;
        this.isContentOverflowing = element.scrollHeight > element.clientHeight;
        this.cdr.detectChanges();
      }
    }, 0);
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processMedia(content: string | undefined, mimeType: string): string {
    if (!content) return '';
    return `data:${mimeType};base64,${content}`;
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.cdr.detectChanges();
  }
}