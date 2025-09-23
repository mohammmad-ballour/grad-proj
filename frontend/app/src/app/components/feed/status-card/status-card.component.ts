import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  StatusResponse,
  ParentAssociation
} from '../models/StatusWithRepliesResponseDto';
import { StatusParentCardComponent } from "../status-parent-card/status-parent-card.component";
import { Router } from '@angular/router';
import { MediaService } from '../../services/media.service';
import { StatusActionCardComponent } from "../status-reaction-card/status-action-card.component";
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { AppRoutes } from '../../../config/app-routes.enum';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, StatusParentCardComponent, StatusActionCardComponent],
  template: `
    <mat-card class="post w-100">

      <!-- Parent Snippet for Replies -->
      @if (statusData.parentAssociation === parentAssociation.REPLY) {
        @if (statusData.parentStatusSnippet && statusData.parentStatusSnippet.parentStatusId) {
          <app-status-parent-card [parentStatusSnippet]="statusData.parentStatusSnippet"></app-status-parent-card>
        } @else {
          <div class="unavailable-content">
            <mat-icon class="lock-icon">lock</mat-icon>
            <h3>This content isn't available at the moment</h3>
            <p>When this happens, it's usually because the owner only shared it with a small group of people, changed who can see it, or it's been deleted.</p>
          </div>
        }
        <div class="connecting-line"></div>
      }
 
      <!-- User Header -->
      <mat-card-header class="header ">
        <img
          mat-card-avatar
          [src]="processMedia(statusData.userAvatar.profilePicture, 'image/png')"
          (error)="onImageError($event,'assets/ProfileAvatar.png')" 
          alt="avatar"
          class="avatar"
        />
        <div class="header-info text-center cursor-pointer" (click)="displayProfile()">
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
        [innerHTML]="processedContent"
        [ngClass]="{ expanded: isExpanded }"
      >
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
                [src]="mediaService.getMediaById(media.mediaId)"   
                class="media-item"
              />
            }
            @if (media.mimeType.startsWith('video/')) {
              <video
                controls
                class="media-item"
                [src]="mediaService.getMediaById(media.mediaId)"
              ></video>
            }
          }
        </div>
      }

      <!-- Parent Snippet for Non-Replies -->
      @if (statusData.parentAssociation !== parentAssociation.REPLY && statusData.parentStatusSnippet && statusData.parentStatusSnippet.parentStatusId) {
        <app-status-parent-card [parentStatusSnippet]="statusData.parentStatusSnippet"></app-status-parent-card>
      } @else if (statusData.parentAssociation !== parentAssociation.REPLY && !statusData.parentStatusSnippet) {
        <div class="unavailable-content">
          <mat-icon class="lock-icon">lock</mat-icon>
          <h3>This content isn't available at the moment</h3>
          <p>When this happens, it's usually because the owner only shared it with a small group of people, changed who can see it, or it's been deleted.</p>
        </div>
      }

      <app-status-action-card
        [statusAction]="statusAction"
        (statusActionChange)="UpdateStatusAction($event)">
      </app-status-action-card>

    </mat-card>
  `,
  styles: [`
      .post {
        width: 100%;
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
        cursor: pointer;
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
      .dot, .time {
        color: #657786;
      }

      /* Mentions */
      .mention {
        color: #1da1f2;
        cursor: pointer;
      }
      .mention:hover {
        text-decoration: underline;
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

      /* Connecting Line */
      .connecting-line {
        width: 2px;
        background-color: #657786;
        height: 20px;
        margin: 8px 0 8px 20px;
      }

  `],
})
export class StatusCardComponent implements AfterViewInit {
  @Input() statusData!: StatusResponse;
  @ViewChild('contentElement') contentElement!: ElementRef;

  isExpanded = false;
  isContentOverflowing = false;
  isLiked = false;
  parentAssociation = ParentAssociation;

  processedContent!: SafeHtml;
  statusAction!: StatusActionDto;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    public mediaService: MediaService,
    private el: ElementRef,
    private sanitizer: DomSanitizer
  ) { }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.contentElement?.nativeElement) {
        const element = this.contentElement.nativeElement;
        this.isContentOverflowing = element.scrollHeight > element.clientHeight;
        this.cdr.detectChanges();
      }
      // scroll to center
      this.el.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['statusData']) {
      this.ngOnInit();
      this.ngAfterViewInit();
    }
  }

  ngOnInit() {
    this.statusAction = this.getStatusAction();
    this.processContent();
  }

  displayProfile() {
    this.router.navigate([this.statusData.userAvatar.username]);
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processMedia(content: string | undefined, mimeType: string): string {
    if (!content) return '';
    return `data:${mimeType};base64,${content}`;
  }

  processContent() {
    if (!this.statusData?.content) return;

    let content = this.statusData.content;

    if (this.statusData.mentionedUsers?.length > 0) {
      for (const username of this.statusData.mentionedUsers) {
        const regex = new RegExp(`@${username}`, 'g');
        content = content.replace(
          regex,
          `<span class="mention" style="color:#5f7fcb ; cursor:pointer" onclick="window.dispatchEvent(new CustomEvent('mentionClick',{detail:'${username}'}))">@${username}</span>`
        );
      }
    }

    this.processedContent = this.sanitizer.bypassSecurityTrustHtml(content);

    // listen for custom click events
    window.addEventListener('mentionClick', (e: any) => {
      this.router.navigate([e.detail]);

    });
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.cdr.detectChanges();
  }

  displayStatus() {
    this.router.navigate([`${AppRoutes.STATUS}`, this.statusData.statusId]);
  }

  getStatusAction(): StatusActionDto {
    return {
      statusId: this.statusData.statusId,
      statusOwnerId: this.statusData.userAvatar.userId,
      numLikes: this.statusData.numLikes,
      numReplies: this.statusData.numReplies,
      numShares: this.statusData.numShares,
      liked: this.statusData.isStatusLikedByCurrentUser
    };
  }

  UpdateStatusAction(statusActionDto: StatusActionDto) {
    this.statusAction = statusActionDto;
    this.statusData.isStatusLikedByCurrentUser = statusActionDto.liked;
  }
}
