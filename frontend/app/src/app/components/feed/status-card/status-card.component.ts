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
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  StatusResponse,
  ParentAssociation,
  MediaResponse,
  StatusPrivacy,
  StatusAudience
} from '../models/StatusWithRepliesResponseDto';
import { StatusParentCardComponent } from "../status-parent-card/status-parent-card.component";
import { StatusActionCardComponent } from "../status-reaction-card/status-action-card.component";
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { AppRoutes } from '../../../config/app-routes.enum';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../services/media.service';
import { MediaViewerComponent } from '../media-viewer-component/media-viewer-component.component';
import { AuthService } from '../../../core/services/auth.service';
import { StatusServices } from '../services/status.services';
import { ConfirmDeleteDialogComponent } from './confirm-delete.dialog/confirm-delete.dialog.component';
import { EditStatusContentDialogComponent } from './edit-status-content/edit-status-content.component';
import { EditStatusSettingsDialogComponent } from './edit-status-settings.dialog/edit-status-settings.dialog.component';
import { TimeAgoPipe } from "../../../core/Pipes/TimeAgoPipe";

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
    MatMenuModule,
    MatTooltipModule,
    StatusParentCardComponent,
    StatusActionCardComponent,
    TimeAgoPipe
  ],
  template: `
    <mat-card class="post w-100">
      <!-- 3-dot menu (top-right) -->
      <button
        *ngIf="isOwner()"
        mat-icon-button
        class="more-btn"
        [matMenuTriggerFor]="moreMenu"
        aria-label="More"
        matTooltip="More">
        <mat-icon>more_horiz</mat-icon>
      </button>

      <mat-menu #moreMenu="matMenu">
        <button mat-menu-item (click)="onUpdateSettings()">
          <mat-icon>tune</mat-icon>
          <span>Update settings</span>
        </button>
        <button mat-menu-item (click)="onUpdateContent()">
          <mat-icon>edit</mat-icon>
          <span>Update content</span>
        </button>
        <button mat-menu-item (click)="onDeleteStatus()">
          <mat-icon>delete</mat-icon>
          <span>Delete status</span>
        </button>
      </mat-menu>

      @if (loading) {
        <div class="spinner-wrap" role="status" aria-live="polite">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else {

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

        <!-- Header -->
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
            <span class="time">{{ statusData.postedAt | timeAgo  }}</span>
 
            <mat-icon
              class="privacy-icon"
              [style.color]="privacyColor(statusData.privacy)"
              [attr.aria-label]="privacyAriaLabel(statusData.privacy)">
              {{ privacyIcon(statusData.privacy) }}
            </mat-icon>
          </div>
        </mat-card-header>

        <!-- Content -->
        <mat-card-content
          #contentEl
          class="post-content"
          [innerHTML]="processedContent"
          [ngClass]="{ expanded: isExpanded }"
          (click)="displayStatus()">
        </mat-card-content>

        @if (isContentOverflowing) {
          <div class="see-more">
            <button mat-button (click)="toggleExpand()" class="see-more-btn">
              {{ isExpanded ? 'See Less' : 'See More' }}
            </button>
          </div>
        }

        <!-- Media (X-style layout) -->
        @if (statusData.medias.length) {
          <div class="media-grid" [ngClass]="mediaLayoutClass">
            <ng-container *ngFor="let m of shownMedias; index as i; trackBy: trackMedia">
              <figure class="tile" [ngClass]="'tile-' + i" (click)="openMediaViewer(m)">
                <img
                  *ngIf="m.mimeType.startsWith('image/')"
                  [src]="mediaService.getMediaById(m.mediaId)"
                  alt="Media"
                  loading="lazy"
                  draggable="false"
                />

                <video
                  *ngIf="m.mimeType.startsWith('video/')"
                  [src]="mediaService.getMediaById(m.mediaId)"
                  muted
                  playsinline
                  preload="metadata"
                  aria-label="Video"
                ></video>

                <!-- Video badge like X -->
                <div class="video-badge" *ngIf="m.mimeType.startsWith('video/')">
                  <mat-icon>play_arrow</mat-icon>
                </div>

                <!-- +N overlay when more than 4 medias -->
                <div class="more-overlay" *ngIf="i === 3 && extraMediaCount > 0">
                  +{{ extraMediaCount }}
                </div>
              </figure>
            </ng-container>
          </div>
        }

        <!-- Parent snippet for non-replies -->
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
      position: relative;
      width: 100%;
      margin: 8px auto;
      border: none;
      border-radius: 12px;
      box-shadow: none;
      background-color: black;
      padding: 12px;
      overflow: hidden;
      border: 2px solid #cdd7e23b;
      min-height: 140px;
    }
    .more-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid #2f3336;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
      z-index: 50;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .more-btn:hover { background: rgba(0, 0, 0, 0.7); }

    .spinner-wrap { display:flex; align-items:center; justify-content:center; min-height:120px; padding:12px; }
    .header { display:flex; align-items:center; cursor:pointer; }
    .avatar { border-radius:50%; width:40px; height:40px; }
    .header-info { display:flex; align-items:center; gap:4px; margin-left:8px; font-size:13px; }
    .display-name { font-weight:600; color:#d6daddff; }
    .username, .dot, .time { color:#657786; }

    .privacy-icon { font-size:18px; width:18px; height:18px; margin-left:4px; transition:color .2s ease; }
    .mention { color:#1da1f2; cursor:pointer; }
    .mention:hover { text-decoration: underline; }

    .post-content {
      font-size:15px; color:#cdd3daff; margin:8px 0; line-height:1.5;
      display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical;
      overflow:hidden; text-overflow:ellipsis; white-space:normal; transition:all .3s ease; cursor:pointer;
    }
    .post-content.expanded { -webkit-line-clamp:unset; overflow:visible; }
    .see-more-btn { font-size:13px; color:#1da1f2; padding:0; }

    .unavailable-content { background-color:#f8f9fa; border-radius:8px; padding:16px; margin-top:8px; text-align:center; color:#333; }
    .lock-icon { font-size:24px; color:#657786; }
    .unavailable-content h3 { font-size:16px; margin:8px 0; }
    .unavailable-content p { font-size:14px; margin:0; }
    .connecting-line { width:2px; background-color:#657786; height:20px; margin:8px 0 8px 20px; }

    /* --- X-style media grid --- */
    .media-grid {
      display: grid;
      gap: 6px;
      margin-top: 8px;
      border-radius: 12px;
      overflow: hidden;          /* no scrollbars */
      width: 100%;
    }

    .media-grid .tile {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: #0f1419;
      cursor: pointer;
    }

    /* Default aspect for tiles; individual layouts can override */
    .media-grid .tile,
    .media-grid .tile img,
    .media-grid .tile video {
      aspect-ratio: 16 / 9;
    }

    .media-grid .tile img,
    .media-grid .tile video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none; /* open viewer on container click */
      border: none;
      outline: none;
    }

    .media-grid .tile::after {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(transparent, rgba(0,0,0,0.25));
      opacity: 0;
      transition: opacity .2s ease;
    }
    .media-grid .tile:hover::after { opacity: 1; }

    /* Video play badge */
    .video-badge {
      position: absolute;
      right: 8px;
      bottom: 8px;
      background: rgba(0,0,0,0.55);
      border: 1px solid #2f3336;
      border-radius: 999px;
      padding: 2px 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .video-badge mat-icon { font-size: 18px; height: 18px; width: 18px; color: #fff; }

    /* +N overlay (when > 4 medias) */
    .more-overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 28px;
      color: #fff;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(2px);
    }

    /* --- Layouts --- */

    /* 1 item: full width, big rounded corners */
    .layout-1 {
      grid-template-columns: 1fr;
    }
    .layout-1 .tile-0 {
      border-radius: 12px;
    }

    /* 2 items: 2 equal columns */
    .layout-2 {
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 1fr;
    }
    .layout-2 .tile-0 { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    .layout-2 .tile-1 { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }

    /* 3 items: left tall, right stacked */
    .layout-3 {
      grid-template-areas:
        "a b"
        "a c";
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 1fr;
    }
    .layout-3 .tile-0 { grid-area: a; border-top-left-radius: 12px; border-bottom-left-radius: 12px; aspect-ratio: auto; }
    .layout-3 .tile-1 { grid-area: b; border-top-right-radius: 12px; }
    .layout-3 .tile-2 { grid-area: c; border-bottom-right-radius: 12px; }

    /* 4 items: 2x2 */
    .layout-4 {
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 1fr;
    }
    .layout-4 .tile-0 { border-top-left-radius: 12px; }
    .layout-4 .tile-1 { border-top-right-radius: 12px; }
    .layout-4 .tile-2 { border-bottom-left-radius: 12px; }
    .layout-4 .tile-3 { border-bottom-right-radius: 12px; }

    /* Tighter height on large screens to mimic X’s compact feel */
    @media (min-width: 768px) {
      .layout-1 .tile-0 { max-height: 680px; }
      .layout-2 .tile,
      .layout-3 .tile,
      .layout-4 .tile { max-height: 330px; }
    }

    /* Small screens */
    @media (max-width: 767px) {
      .layout-1 .tile-0 { max-height: 60vh; }
      .layout-2 .tile,
      .layout-3 .tile,
      .layout-4 .tile { max-height: 40vh; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusCardComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() statusData!: StatusResponse;
  @Input() loading = false;
  @Output() reloadRequested = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<string>();

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
    private activatedRoute: ActivatedRoute,
    private auth: AuthService,
    private statusApi: StatusServices
  ) { }

  /* ====== NEW helpers for X-style media grid ====== */
  get shownMedias() {
    return (this.statusData?.medias ?? []).slice(0, 4);
  }
  get extraMediaCount(): number {
    const total = this.statusData?.medias?.length ?? 0;
    return total > 4 ? total - 4 : 0;
  }
  get mediaLayoutClass(): string {
    const n = Math.min(this.statusData?.medias?.length || 0, 4);
    return `layout-${n}`;
  }
  trackMedia = (_: number, m: MediaResponse) => m.mediaId;
  /* =============================================== */

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['statusData'] || (changes['loading'] && this.loading === false)) && this.statusData && !this.loading) {
      this.statusAction = this.getStatusAction();
      this.processContent();
      setTimeout(() => this.measureOverflow(), 0);
    }
  }



  ngOnDestroy() {
    window.removeEventListener('mentionClick', this.handleMentionClick);
  }

  isOwner(): boolean {
    try { return this.statusData?.userAvatar?.username === this.auth.UserName; }
    catch { return false; }
  }

  onUpdateSettings() {
    const ref = this.dialog.open(EditStatusSettingsDialogComponent, {
      width: '600px',
      data: { status: this.statusData }
    });

    ref.afterClosed().subscribe((changes?: Partial<StatusResponse>) => {
      if (!changes) return;
      this.statusData = {
        ...this.statusData,
        privacy: (changes.privacy ?? this.statusData.privacy) as StatusPrivacy,
        replyAudience: (changes.replyAudience ?? this.statusData.replyAudience) as StatusAudience,
        shareAudience: (changes.shareAudience ?? this.statusData.shareAudience) as StatusAudience
      };
      this.statusAction = this.getStatusAction();
      this.cdr.markForCheck();
    });
  }

  onUpdateContent() {
    const ref = this.dialog.open(EditStatusContentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '100vw',
      maxHeight: 'none',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'fit-content-dialog',
      data: { status: this.statusData }
    });

    ref.afterClosed().subscribe((result?: { updated?: StatusResponse }) => {
      if (!result?.updated) return;
      this.statusData = result.updated;
      this.statusAction = this.getStatusAction();
      this.processContent();
      setTimeout(() => this.measureOverflow(), 0);
      this.cdr.markForCheck();
    });
  }
  // at top with other imports

  // inside class:
  @Output() statusChanged = new EventEmitter<{ statusId: string; isSavedToBookmarks?: boolean }>();

  // inside UpdateStatusAction():
  UpdateStatusAction(statusActionDto: StatusActionDto) {
    if (statusActionDto.numReplies == this.statusAction.numReplies + 1 &&
      this.activatedRoute.snapshot.paramMap.get("statusId") == statusActionDto.statusId) {
      this.reloadRequested.emit(statusActionDto.statusId);
    }
    this.statusAction = statusActionDto;
    this.statusData.isStatusLikedByCurrentUser = statusActionDto.liked;

    // NEW: bubble up bookmark state so Bookmarks screen can remove the item instantly
    if (typeof statusActionDto.isSavedToBookmarks !== 'undefined') {
      this.statusData.isSavedToBookmarks = statusActionDto.isSavedToBookmarks;
      this.statusChanged.emit({ statusId: statusActionDto.statusId, isSavedToBookmarks: statusActionDto.isSavedToBookmarks });
    }

    this.cdr.markForCheck();
  }


  onDeleteStatus() {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { statusId: this.statusData.statusId },
      width: '360px'
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.statusApi.deleteStatus(this.statusData.statusId).subscribe({
        next: () => this.deleted.emit(this.statusData.statusId),
        error: (e) => console.error('Failed to delete status', e)
      });
    });
  }
  privacyIcon(p?: string): string {
    switch (p) { case 'PUBLIC': return 'public'; case 'FOLLOWERS': return 'person'; case 'PRIVATE': return 'lock'; default: return 'help_outline'; }
  }
  privacyColor(p?: string): string {
    switch (p) { case 'PUBLIC': return '#42a5f5'; case 'FOLLOWERS': return '#26a69a'; case 'PRIVATE': return '#ffb300'; default: return '#9aa5b1'; }
  }
  privacyAriaLabel(p?: string): string {
    switch (p) { case 'PUBLIC': return 'Public'; case 'FOLLOWERS': return 'Followers only'; case 'PRIVATE': return 'Private'; default: return 'Privacy'; }
  }

  openMediaViewer(media: MediaResponse) {
    this.dialog.open(MediaViewerComponent, {
      data: { mimeType: media.mimeType, mediaUrl: this.mediaService.getMediaById(media.mediaId) },
      width: '80%', height: '80%', panelClass: 'media-viewer-dialog'
    });
  }

  displayProfile() { this.router.navigate([this.statusData.userAvatar.username]); }
  displayStatus() { this.router.navigate([`${AppRoutes.STATUS}`, this.statusData.statusId]); }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  toggleExpand() { this.isExpanded = !this.isExpanded; this.cdr.markForCheck(); }
  toggleLike() { this.isLiked = !this.isLiked; this.cdr.markForCheck(); }

  processMedia(content: string | undefined, mimeType: string): string {
    if (!content) return '';
    return `data:${mimeType};base64,${content}`;
  }

  private handleMentionClick = (e: any) => { this.router.navigate([e.detail]); };

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
    if (!this.statusData?.content) { this.processedContent = ''; return; }
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
  // add input
  @Input() autoScrollIntoView = false;

  // ngAfterViewInit()
  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.loading) {
        this.measureOverflow();
        // REMOVE the unconditional scroll:
        // this.el.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });

        // If you still want it sometimes (e.g. detail page), keep it behind the flag:
        if (this.autoScrollIntoView) {
          this.el.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }, 0);
  }


  private getStatusAction(): StatusActionDto {
    return {
      statusId: this.statusData.statusId,
      statusOwnerId: this.statusData.userAvatar.userId,
      numLikes: this.statusData.numLikes,
      numReplies: this.statusData.numReplies,
      numShares: this.statusData.numShares,
      liked: this.statusData.isStatusLikedByCurrentUser,
      isSavedToBookmarks: this.statusData.isSavedToBookmarks,
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


}
