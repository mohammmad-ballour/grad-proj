import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusActionDto } from '../../models/ReactToStatusRequestDto';
import { StatusServices } from '../../services/status.services';
import { StatusAudience, StatusPrivacy } from '../../models/StatusWithRepliesResponseDto';

type MediaKind = 'image' | 'video';
interface MediaPreview { kind: MediaKind; url: string; name: string; }

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="share-dialog">
      <!-- Header -->
      <div class="header">
        <button mat-icon-button (click)="close()" matTooltip="Close"><mat-icon>close</mat-icon></button>
        <h2>Add a comment</h2>
        <div class="header-right">
          <button mat-raised-button color="primary"
                  (click)="postQuote()"
                  [disabled]="posting || (!content.trim() && selectedFiles.length === 0)">
            Post
          </button>
        </div>
      </div>

      <!-- Chips row (same style/placement as feed) -->
      <div class="chip-row">
        <!-- Visibility -->
        <button mat-button class="chip-btn" [matMenuTriggerFor]="privacyMenu" matTooltip="Post visibility">
          <mat-icon class="chip-icon">{{ getPrivacyIcon(privacy) }}</mat-icon>
          {{ privacyLabel }}
          <mat-icon class="chev">expand_more</mat-icon>
        </button>
        <mat-menu #privacyMenu="matMenu">
          <button mat-menu-item
                  (click)="setPrivacy(StatusPrivacy.PUBLIC)"
                  [disabled]="!isPrivacyOptionAllowed(StatusPrivacy.PUBLIC)">
            <mat-icon>public</mat-icon><span>Public</span>
          </button>
          <button mat-menu-item
                  (click)="setPrivacy(StatusPrivacy.FOLLOWERS)"
                  [disabled]="!isPrivacyOptionAllowed(StatusPrivacy.FOLLOWERS)">
            <mat-icon>people</mat-icon><span>Followers only</span>
          </button>
          <button mat-menu-item
                  (click)="setPrivacy(StatusPrivacy.PRIVATE)"
                  [disabled]="!isPrivacyOptionAllowed(StatusPrivacy.PRIVATE)">
            <mat-icon>lock</mat-icon><span>Private</span>
          </button>
        </mat-menu>

        <span class="dot">•</span>

        <!-- Who can reply -->
        <button mat-button class="chip-btn" [matMenuTriggerFor]="replyMenu" matTooltip="Who can reply">
          <mat-icon class="chip-icon">{{ getAudienceIcon(replyAudience) }}</mat-icon>
          {{ replyLabel }}
          <mat-icon class="chev">expand_more</mat-icon>
        </button>
        <mat-menu #replyMenu="matMenu">
          <button mat-menu-item
                  (click)="setReplyAudience(StatusAudience.EVERYONE)"
                  [disabled]="!isReplyOptionAllowed(StatusAudience.EVERYONE)">
            <mat-icon>public</mat-icon><span>Everyone can reply</span>
          </button>
          <button mat-menu-item
                  (click)="setReplyAudience(StatusAudience.FOLLOWERS)"
                  [disabled]="!isReplyOptionAllowed(StatusAudience.FOLLOWERS)">
            <mat-icon>people</mat-icon><span>People follow you can reply</span>
          </button>
          <button mat-menu-item
                  (click)="setReplyAudience(StatusAudience.ONLY_ME)"
                  [disabled]="!isReplyOptionAllowed(StatusAudience.ONLY_ME)">
            <mat-icon>lock</mat-icon><span>Only me can reply</span>
          </button>
        </mat-menu>

        <span class="dot">•</span>

        <!-- Who can share -->
        <button mat-button class="chip-btn" [matMenuTriggerFor]="shareMenu" matTooltip="Who can share">
          <mat-icon class="chip-icon">{{ getAudienceIcon(shareAudience) }}</mat-icon>
          {{ shareLabel }}
          <mat-icon class="chev">expand_more</mat-icon>
        </button>
        <mat-menu #shareMenu="matMenu">
          <button mat-menu-item
                  (click)="setShareAudience(StatusAudience.EVERYONE)"
                  [disabled]="!isShareOptionAllowed(StatusAudience.EVERYONE)">
            <mat-icon>public</mat-icon><span>Everyone can share</span>
          </button>
          <button mat-menu-item
                  (click)="setShareAudience(StatusAudience.FOLLOWERS)"
                  [disabled]="!isShareOptionAllowed(StatusAudience.FOLLOWERS)">
            <mat-icon>people</mat-icon><span>People follow you can share</span>
          </button>
          <button mat-menu-item
                  (click)="setShareAudience(StatusAudience.ONLY_ME)"
                  [disabled]="!isShareOptionAllowed(StatusAudience.ONLY_ME)">
            <mat-icon>lock</mat-icon><span>Only me can share</span>
          </button>
        </mat-menu>
      </div>

      <!-- Composer -->
      <div class="composer">
        <textarea [(ngModel)]="content" placeholder="Add a comment" rows="4"></textarea>
      </div>

      <!-- Media previews -->
      <div class="previews" *ngIf="previews.length > 0">
        <div class="preview" *ngFor="let p of previews; let i = index">
          <ng-container [ngSwitch]="p.kind">
            <img *ngSwitchCase="'image'" [src]="p.url" [alt]="p.name">
            <video *ngSwitchCase="'video'" [src]="p.url" controls playsinline></video>
          </ng-container>
          <button mat-icon-button class="remove" (click)="remove(i)" matTooltip="Remove">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Quoted card -->
      <div class="quoted original-post">
        <div class="user-info">
          <div class="avatar">
            <span class="avatar-img" [style.backgroundImage]="'url(' + toImageSrc(data.statusAction.profilePicture) + ')'"></span>
          </div>
          <span class="username">{{ data.statusAction.username }}</span>
          <span class="handle">{{ '@' + data.statusAction.username }}</span>
          <span class="dot">·</span>
          <span class="timestamp">{{ relativeTime(data.statusAction.postedAt) }}</span>
        </div>
        <p class="content">{{ data.statusAction.content }}</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="left">
          <button mat-icon-button (click)="triggerFileInput()"
                  [disabled]="selectedFiles.length >= MAX_MEDIA"
                  aria-label="Add media"
                  matTooltip="Add images or videos">
            <mat-icon>image</mat-icon>
          </button>
          <input #fileInput type="file" multiple accept="image/*,video/*"
                 (change)="onFileSelected($event)" style="display:none">
          <span class="hint" *ngIf="selectedFiles.length > 0">{{selectedFiles.length}} / {{MAX_MEDIA}}</span>
        </div>
        <span class="error" *ngIf="error">{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .share-dialog { padding:16px; background:#000; color:#fff; max-height:80vh; display:flex; flex-direction:column; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .header h2 { margin:0; font-size:18px; font-weight:600; }
    .header-right { display:flex; align-items:center; gap:8px; }

    /* single-row chips like feed */
    .chip-row {
      display:flex; align-items:center; gap:8px; flex-wrap:wrap;
      margin:8px 0 4px;
    }
    .chip-btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:4px 12px; height:34px; line-height:34px; border-radius:999px;
      background:rgba(255,255,255,0.06); border:1px solid #2a2a2a; color:#fff;
      text-transform:none;
    }
    .chip-btn:hover { background:rgba(255,255,255,0.12); }
    .chip-icon { font-size:18px; height:18px; width:18px; }
    .chev { font-size:18px; opacity:.9; }
    .dot { color:#657786; }

    .composer textarea { width:100%; border:none; background:transparent; color:#fff; resize:none; outline:none; font-size:15px; }

    .previews { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin:8px 0 12px; }
    .preview { position:relative; border-radius:12px; overflow:hidden; border:1px solid #2a2a2a; background:#0a0a0a; }
    .preview img, .preview video { width:100%; height:100%; display:block; object-fit:cover; aspect-ratio:1/1; }
    .preview .remove { position:absolute; top:4px; right:4px; background:rgba(0,0,0,.6); color:#fff; }

    .quoted.original-post { padding:8px; margin-top:8px; border:1px solid #2a2a2a; border-radius:12px; background:#0a0a0a; }
    .original-post .user-info { display:flex; align-items:center; gap:4px; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .original-post .avatar { margin-right:12px; flex-shrink:0; }
    .original-post .avatar .avatar-img {
      width:40px; height:40px; border-radius:50%; border:1px solid #2a2a2a;
      background:#111; background-size:cover; background-position:center; background-repeat:no-repeat; display:block;
    }
    .original-post .username { font-weight:bold; color:#fff; display:inline-flex; }
    .original-post .handle, .original-post .dot, .original-post .timestamp { color:#657786; }
    .original-post .handle { margin-left:4px; }
    .original-post .dot { margin:0 4px; }
    .original-post .content { margin:6px 0 0; white-space:pre-wrap; line-height:1.4; }

    .footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:10px; margin-top:12px; border-top:1px solid #1f1f1f; }
    .left { display:flex; align-items:center; gap:10px; }
    .hint { color:#8b98a5; font-size:12px; }
    .error { color:#ff6b6b; font-size:12px; }

    mat-menu { background:#0a0a0a; color:#fff; }
    mat-menu-item { color:#fff; }
    mat-menu-item[disabled] { opacity:.5; }
    mat-menu-item:hover { background-color:rgba(255,255,255,0.08); }
  `]
})
export class ShareDialogComponent {
  content = '';
  posting = false;
  error = '';

  readonly MAX_MEDIA = 4;
  readonly MAX_IMG_MB = 10;
  readonly MAX_VID_MB = 50;

  selectedFiles: File[] = [];
  previews: MediaPreview[] = [];

  readonly parentPrivacy: StatusPrivacy;
  privacy: StatusPrivacy = StatusPrivacy.PUBLIC;
  replyAudience: StatusAudience = StatusAudience.EVERYONE;
  shareAudience: StatusAudience = StatusAudience.EVERYONE;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  fallbackAvatar = 'assets/ProfileAvatar.png';

  StatusPrivacy = StatusPrivacy;
  StatusAudience = StatusAudience;

  constructor(
    private dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { statusAction: StatusActionDto },
    private statusServices: StatusServices
  ) {
    this.parentPrivacy = data.statusAction.privacy;
    this.privacy = this.parentPrivacy;
    this.replyAudience = data.statusAction.replyAudience;
    this.shareAudience = data.statusAction.shareAudience;

    this.applyParentCapToPrivacy();
    this.clampAudiencesForPrivacy();
  }

  // Labels & icons
  get privacyLabel() {
    return this.privacy === StatusPrivacy.PUBLIC ? 'Public'
      : this.privacy === StatusPrivacy.FOLLOWERS ? 'Followers only' : 'Private';
  }
  get replyLabel() {
    return this.replyAudience === StatusAudience.EVERYONE ? 'Everyone can reply'
      : this.replyAudience === StatusAudience.FOLLOWERS ? 'People follow you can reply' : 'Only me can reply';
  }
  get shareLabel() {
    return this.shareAudience === StatusAudience.EVERYONE ? 'Everyone can share'
      : this.shareAudience === StatusAudience.FOLLOWERS ? 'People follow you can share' : 'Only me can share';
  }
  getPrivacyIcon(p: StatusPrivacy) {
    return p === StatusPrivacy.PUBLIC ? 'public' : p === StatusPrivacy.FOLLOWERS ? 'people' : 'lock';
  }
  getAudienceIcon(a: StatusAudience) {
    return a === StatusAudience.EVERYONE ? 'public' : a === StatusAudience.FOLLOWERS ? 'people' : 'lock';
  }

  // Image/base64/url
  toImageSrc(input?: string): string {
    if (!input) return this.fallbackAvatar;
    const src = ('' + input).trim();
    if (!src) return this.fallbackAvatar;
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    return `data:image/png;base64,${src}`;
  }
  onImgErr(ev: Event) { (ev.target as HTMLImageElement).src = this.fallbackAvatar; }

  triggerFileInput() { this.fileInput.nativeElement.click(); }
  close() { this.dialogRef.close(false); }

  relativeTime(postedAt: string): string {
    const now = new Date(), t = new Date(postedAt);
    const diff = (now.getTime() - t.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    const m = diff / 60; if (m < 60) return `${Math.floor(m)}m`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h`;
    return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Policy helpers
  private privacyRank(p: StatusPrivacy): number { return p === StatusPrivacy.PRIVATE ? 0 : p === StatusPrivacy.FOLLOWERS ? 1 : 2; }
  private audienceRank(a: StatusAudience): number { return a === StatusAudience.ONLY_ME ? 0 : a === StatusAudience.FOLLOWERS ? 1 : 2; }
  private privacyCap(p: StatusPrivacy): StatusAudience {
    return p === StatusPrivacy.PRIVATE ? StatusAudience.ONLY_ME
      : p === StatusPrivacy.FOLLOWERS ? StatusAudience.FOLLOWERS
        : StatusAudience.EVERYONE;
  }

  isPrivacyOptionAllowed(p: StatusPrivacy): boolean {
    return this.privacyRank(p) <= this.privacyRank(this.parentPrivacy);
  }
  isReplyOptionAllowed(a: StatusAudience): boolean {
    return this.audienceRank(a) <= this.audienceRank(this.privacyCap(this.privacy));
  }
  isShareOptionAllowed(a: StatusAudience): boolean {
    return this.audienceRank(a) <= this.audienceRank(this.privacyCap(this.privacy));
  }

  private applyParentCapToPrivacy() {
    if (this.privacyRank(this.privacy) > this.privacyRank(this.parentPrivacy)) {
      this.privacy = this.parentPrivacy;
    }
  }
  private clampAudiencesForPrivacy(): void {
    const cap = this.privacyCap(this.privacy);
    if (this.audienceRank(this.replyAudience) > this.audienceRank(cap)) this.replyAudience = cap;
    if (this.audienceRank(this.shareAudience) > this.audienceRank(cap)) this.shareAudience = cap;
  }

  setPrivacy(p: StatusPrivacy) { this.privacy = p; this.applyParentCapToPrivacy(); this.clampAudiencesForPrivacy(); }
  setReplyAudience(a: StatusAudience) {
    const cap = this.privacyCap(this.privacy);
    this.replyAudience = (this.audienceRank(a) > this.audienceRank(cap)) ? cap : a;
  }
  setShareAudience(a: StatusAudience) {
    const cap = this.privacyCap(this.privacy);
    this.shareAudience = (this.audienceRank(a) > this.audienceRank(cap)) ? cap : a;
  }

  // Media
  onFileSelected(ev: Event) {
    this.error = '';
    const input = ev.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []);
    if (!newFiles.length) return;

    if (this.selectedFiles.length + newFiles.length > this.MAX_MEDIA) this.error = `Max ${this.MAX_MEDIA} media items.`;

    for (const f of newFiles) {
      if (this.selectedFiles.length >= this.MAX_MEDIA) break;
      const isImg = f.type.startsWith('image/'); const isVid = f.type.startsWith('video/');
      if (!isImg && !isVid) { this.error = 'Only images or videos allowed.'; continue; }
      const sizeMB = f.size / (1024 * 1024);
      if (isImg && sizeMB > this.MAX_IMG_MB) { this.error = `Image ≤ ${this.MAX_IMG_MB}MB.`; continue; }
      if (isVid && sizeMB > this.MAX_VID_MB) { this.error = `Video ≤ ${this.MAX_VID_MB}MB.`; continue; }
      this.selectedFiles.push(f);
      this.previews.push({ kind: isVid ? 'video' : 'image', url: URL.createObjectURL(f), name: f.name });
    }
    input.value = '';
  }

  remove(i: number) {
    URL.revokeObjectURL(this.previews[i].url);
    this.previews.splice(i, 1);
    this.selectedFiles.splice(i, 1);
  }

  // Submit
  postQuote() {
    if (this.posting) return;
    if (!this.content.trim() && this.selectedFiles.length === 0) { this.error = 'Add a comment or media.'; return; }

    this.applyParentCapToPrivacy();
    this.clampAudiencesForPrivacy();

    this.posting = true;
    this.statusServices.createStatus({
      content: this.content.trim(),
      privacy: this.privacy,
      replyAudience: this.replyAudience,
      shareAudience: this.shareAudience,
      parentStatus: {
        statusId: this.data.statusAction.statusId,
        statusOwnerId: this.data.statusAction.statusOwnerId,
        parentAssociation: 'SHARE'
      }
    }, this.selectedFiles).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.posting = false
    });
  }
}
