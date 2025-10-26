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
  ParentStatusSnippet,
} from '../models/StatusWithRepliesResponseDto';
import { Router } from '@angular/router';
import { AppRoutes } from '../../../config/app-routes.enum';
import { MediaService } from '../../services/media.service';
import { TimeAgoPipe } from "../../../core/Pipes/TimeAgoPipe";

@Component({
  selector: 'app-status-parent-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TimeAgoPipe],
  template: `
      
    <mat-card class="post " >
      <!-- User Header -->
      <mat-card-header class="header"  >
        <img
          mat-card-avatar
          [src]="processImage(parentStatusSnippet.parentUserAvatar.profilePicture)"
          (error)="onImageError($event,'assets/ProfileAvatar.png')" 

          alt="avatar"
          class="avatar"
        />
        <div class="header-info"   (click)="displayProfile()">
          <span class="display-name">{{ parentStatusSnippet.parentUserAvatar.displayName }}</span>
          <span class="username">{{ '@'+parentStatusSnippet.parentUserAvatar.username }}</span>
          <span class="dot">·</span>
          <span class="time">{{ parentStatusSnippet.postedAt | timeAgo }}</span>
 
        </div>
      </mat-card-header>
         <!-- Post Content -->
      <mat-card-content
        #contentElement 
        class="post-content"
        [ngClass]="{ expanded: isExpanded }"
        (click)="displayStatus()"
      >
        {{ parentStatusSnippet.content }}
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
      @if ( parentStatusSnippet. medias && parentStatusSnippet.medias.length > 0) {

        <div class="media-grid"   (click)="displayStatus()">
          @for (media of parentStatusSnippet.medias; track media.mediaId) {
            @if (media.mimeType.startsWith('image/')) {
              <img
          
                [src]="mediaServices.getMediaById(media.mediaId)"
                class="media-item"
              />
            }
            @if (media.mimeType.startsWith('video/')) {
              <video
                controls
                class="media-item"
                [src]="mediaServices.getMediaById(media.mediaId)"
              ></video>
            }
          }
        </div>

      }

      
    </mat-card>
  `,
  styles: [
    `
      .post {
         width: 98%;
        margin: 8px auto;
        border: none;
        border-radius: 12px;
        box-shadow: none;
        background-color: black;
        padding: 12px;
        overflow: hidden;
        border-radius:10px;
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
        cursor: pointer;
      }
      .display-name {
        font-weight: 600;
        color: #ecedeeff;
      }
      .username {
        color: #d4d8dcff;
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
        color: #f1f1f1ff;
        margin: 8px 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        transition: all 0.3s ease;
        cursor: pointer;

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
          cursor: pointer;
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
export class StatusParentCardComponent implements AfterViewInit {

  @Input() parentStatusSnippet!: ParentStatusSnippet;
  @ViewChild('parentcontentElement') parentcontentElement!: ElementRef;
  isExpanded = false;
  isContentOverflowing = false;
  isLiked = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    public mediaServices: MediaService

  ) { }
  displayStatus() {
    console.log(this.parentStatusSnippet.parentStatusId)
    console.log('test')
    this.router.navigate([`${AppRoutes.STATUS}`, this.parentStatusSnippet.parentStatusId])
  }
  displayProfile() {
    this.router.navigate([this.parentStatusSnippet.parentUserAvatar.username])
  }


  ngAfterViewInit() {
    setTimeout(() => {
      if (this.parentcontentElement?.nativeElement) {
        const element = this.parentcontentElement.nativeElement;
        this.isContentOverflowing = element.scrollHeight > element.clientHeight;
        this.cdr.detectChanges();
      }
    }, 0);
  }
  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processImage(image: string | undefined): string {
    return `data:image/png;base64,${image}`;
  }

  processVideo(media: string): string {
    if (!media) return '';
    return `data:video/mp4;base64,${media}`;
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
