import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  SimpleChanges,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// ADD these imports
import { Output, EventEmitter } from '@angular/core';

import {
  StatusResponse,
  ParentAssociation,
  MediaResponse
} from '../models/StatusWithRepliesResponseDto';
import { StatusParentCardComponent } from "../status-parent-card/status-parent-card.component";
import { StatusActionCardComponent } from "../status-reaction-card/status-action-card.component";
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { AppRoutes } from '../../../config/app-routes.enum';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../services/media.service';
import { MediaViewerComponent } from '../media-viewer-component/media-viewer-component.component';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    StatusParentCardComponent,
    StatusActionCardComponent
  ],
  template: `
    <mat-card class="post w-100">
      @if (loading) {
        <!-- Centered spinner while the feed item loads -->
        <div class="spinner-wrap" role="status" aria-live="polite">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else {
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
        <mat-card-header class="header">
          <img
            mat-card-avatar
            [src]="processMedia(statusData.userAvatar.profilePicture, 'image/png')"
            (error)="onImageError($event,'assets/ProfileAvatar.png')"
            alt="avatar"
            class="avatar"
          />
          <div class="header-info text-center cursor-pointer" (click)="displayProfile()">
            <span class="display-name">{{ statusData.userAvatar.displayName }}</span>
            <span class="username">{{ '@' + statusData.userAvatar.username }}</span>
            <span class="dot">·</span>
            <span class="time">{{ statusData.postedAt | date: 'short' }}</span>

            <!-- Colored privacy icon (Material) -->
            <mat-icon
              class="privacy-icon"
              [style.color]="privacyColor(statusData.privacy)"
              [attr.aria-label]="privacyAriaLabel(statusData.privacy)">
              {{ privacyIcon(statusData.privacy) }}
            </mat-icon>
          </div>
        </mat-card-header>

        <!-- Post Content -->
        <mat-card-content
          #contentEl
          class="post-content"
          [innerHTML]="processedContent"
          [ngClass]="{ expanded: isExpanded }"
          (click)="displayStatus()">
        </mat-card-content>

        <!-- See More Button -->
        @if (isContentOverflowing) {
          <div class="see-more">
            <button mat-button (click)="toggleExpand()" class="see-more-btn">
              {{ isExpanded ? 'See Less' : 'See More' }}
            </button>
          </div>
        }

        <!-- Media Grid -->
        @if (statusData.medias && statusData.medias.length > 0) {
          <div class="media-grid">
            @for (media of statusData.medias; track media.mediaId) {
              @if (media.mimeType.startsWith('image/')) {
                <img
                  [src]="mediaService.getMediaById(media.mediaId)"
                  class="media-item"
                  (click)="openMediaViewer(media)"
                  alt="Media content"/>
              }
              @if (media.mimeType.startsWith('video/')) {
                <video
                  controls
                  class="media-item"
                  [src]="mediaService.getMediaById(media.mediaId)"
                  aria-label="Video content"></video>
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
          [parentStatus]="statusData"
          (statusActionChange)="UpdateStatusAction($event)">
        </app-status-action-card>
      }
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
      min-height: 140px; /* space for spinner/card */
    }

    /* Centered spinner */
    .spinner-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      padding: 12px;
    }

    /* Header */
    .header { display: flex; align-items: center; cursor: pointer; }
    .avatar { border-radius: 50%; width: 40px; height: 40px; }
    .header-info { display: flex; align-items: center; gap: 4px; margin-left: 8px; font-size: 13px; }
    .display-name { font-weight: 600; color: #d6daddff; }
    .username, .dot, .time { color: #657786; }

    .privacy-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-left: 4px;
      transition: color .2s ease;
    }

    /* Mentions */
    .mention { color: #1da1f2; cursor: pointer; }
    .mention:hover { text-decoration: underline; }

    /* Post Content */
    .post-content {
      font-size: 15px; color: #cdd3daff; margin: 8px 0; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
      overflow: hidden; text-overflow: ellipsis; white-space: normal;
      transition: all 0.3s ease; cursor: pointer;
    }
    .post-content.expanded { -webkit-line-clamp: unset; overflow: visible; }

    .see-more-btn { font-size: 13px; color: #1da1f2; padding: 0; }

    /* Media Grid */
    .media-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;
      border-radius: 12px; overflow: hidden;
    }
    .media-item { width: 100%; border-radius: 12px; object-fit: cover; max-height: 300px; cursor: pointer; }

    /* Unavailable Content */
    .unavailable-content {
      background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 8px;
      text-align: center; color: #333;
    }
    .lock-icon { font-size: 24px; color: #657786; }
    .unavailable-content h3 { font-size: 16px; margin: 8px 0; }
    .unavailable-content p { font-size: 14px; margin: 0; }

    /* Connecting Line */
    .connecting-line { width: 2px; background-color: #657786; height: 20px; margin: 8px 0 8px 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusCardComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() statusData!: StatusResponse;

  /** Show spinner while the feed item is not fully loaded */
  @Input() loading = false;
  @Output() reloadRequested = new EventEmitter<string>()
  @ViewChild('contentEl') contentEl!: ElementRef<HTMLElement>;

  isExpanded = false;
  isContentOverflowing = false;
  isLiked = false;
  readonly parentAssociation = ParentAssociation;

  processedContent!: SafeHtml;
  statusAction!: StatusActionDto;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    public mediaService: MediaService,
    private el: ElementRef,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    // When status changes or loading flips to false, (re)initialize the view
    if ((changes['statusData'] || (changes['loading'] && this.loading === false)) && this.statusData && !this.loading) {
      this.statusAction = this.getStatusAction();
      this.processContent();
      setTimeout(() => this.measureOverflow(), 0);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.loading) {
        this.measureOverflow();
        this.el.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 0);
  }

  ngOnDestroy() {
    window.removeEventListener('mentionClick', this.handleMentionClick);
  }

  // Material privacy icon + color
  privacyIcon(p?: string): string {
    switch (p) {
      case 'PUBLIC': return 'public';
      case 'FOLLOWERS': return 'person'; // or 'group'
      case 'PRIVATE': return 'lock';
      default: return 'help_outline';
    }
  }
  privacyColor(p?: string): string {
    switch (p) {
      case 'PUBLIC': return '#42a5f5';   // Blue 400
      case 'FOLLOWERS': return '#26a69a';// Teal 400
      case 'PRIVATE': return '#ffb300';  // Amber 600
      default: return '#9aa5b1';         // Neutral
    }
  }
  privacyAriaLabel(p?: string): string {
    switch (p) {
      case 'PUBLIC': return 'Public';
      case 'FOLLOWERS': return 'Followers only';
      case 'PRIVATE': return 'Private';
      default: return 'Privacy';
    }
  }

  openMediaViewer(media: MediaResponse) {
    this.dialog.open(MediaViewerComponent, {
      data: { mimeType: media.mimeType, mediaUrl: this.mediaService.getMediaById(media.mediaId) },
      width: '80%',
      height: '80%',
      panelClass: 'media-viewer-dialog'
    });
  }

  displayProfile() {
    this.router.navigate([this.statusData.userAvatar.username]);
  }

  displayStatus() {
    this.router.navigate([`${AppRoutes.STATUS}`, this.statusData.statusId]);
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.cdr.markForCheck();
  }

  processMedia(content: string | undefined, mimeType: string): string {
    if (!content) return '';
    return `data:${mimeType};base64,${content}`;
  }

  private handleMentionClick = (e: any) => {
    this.router.navigate([e.detail]);
  };

  private measureOverflow() {
    const el = this.contentEl?.nativeElement;
    if (!el) return;
    const overflowing = el.scrollHeight > el.clientHeight + 1;
    if (overflowing !== this.isContentOverflowing) {
      this.isContentOverflowing = overflowing;
      this.cdr.markForCheck();
    }
  }

  private processContent() {
    if (!this.statusData?.content) {
      this.processedContent = '';
      return;
    }

    let content = this.statusData.content;

    if (this.statusData.mentionedUsers?.length) {
      for (const username of this.statusData.mentionedUsers) {
        const safe = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@${safe}`, 'g');
        content = content.replace(
          regex,
          `<span class="mention" style="color:#5f7fcb; cursor:pointer"
             onclick="window.dispatchEvent(new CustomEvent('mentionClick',{detail:'${username}'}))">@${username}</span>`
        );
      }
    }

    this.processedContent = this.sanitizer.bypassSecurityTrustHtml(content);

    window.removeEventListener('mentionClick', this.handleMentionClick);
    window.addEventListener('mentionClick', this.handleMentionClick);
  }

  private getStatusAction(): StatusActionDto {
    return {
      statusId: this.statusData.statusId,
      statusOwnerId: this.statusData.userAvatar.userId,
      numLikes: this.statusData.numLikes,
      numReplies: this.statusData.numReplies,
      numShares: this.statusData.numShares,
      liked: this.statusData.isStatusLikedByCurrentUser,
      saved: false,
      isCurrentUserAllowedToReply: this.statusData.isCurrentUserAllowedToReply,
      isCurrentUserAllowedToShare: this.statusData.isCurrentUserAllowedToShare,
      privacy: this.statusData.privacy,
      replyAudience: this.statusData.replyAudience,
      shareAudience: this.statusData.shareAudience,
      content: this.statusData.content,
      postedAt: this.statusData.postedAt,
      profilePicture: this.statusData.userAvatar.profilePicture,
      username: this.statusData.userAvatar.username
    };
  }

  UpdateStatusAction(statusActionDto: StatusActionDto) {
    console.log("from UpdateStatusAction ")
    console.log(this.activatedRoute.snapshot.paramMap.get("statusId"))
    console.log()
    if (statusActionDto.numReplies == this.statusAction.numReplies + 1 && this.activatedRoute.snapshot.paramMap.get("statusId") == statusActionDto.statusId) {
      console.log("from indide if condition")
      this.reloadRequested.emit(statusActionDto.statusId);


    }
    this.statusAction = statusActionDto;
    this.statusData.isStatusLikedByCurrentUser = statusActionDto.liked;
    this.cdr.markForCheck();
  }


  // UpdateStatusAction(statusActionDto: StatusActionDto) {
  //   // keep the local action state in sync
  //   this.statusAction = statusActionDto;
  //   this.statusData.isStatusLikedByCurrentUser = statusActionDto.liked;

  //   // If we're already on /status/:id and numReplies just increased by 1,
  //   // ask the parent view to refetch the full thread (so the new reply appears).
  //   const routeId = this.activatedRoute.snapshot.paramMap.get('statusId');
  //   const isSameDetailRoute = routeId === statusActionDto.statusId;
  //   const replyBumpedByOne = statusActionDto.numReplies === (this.statusAction.numReplies ?? 0) + 1;

  //   if (isSameDetailRoute && replyBumpedByOne) {
  //     // Do NOT navigate to the same URL; emit a reload request instead.
  //     this.reloadRequested.emit(statusActionDto.statusId);
  //   }

  //   this.cdr.markForCheck();
  // }
}
