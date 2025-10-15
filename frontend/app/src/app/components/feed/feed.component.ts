import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { CreateStatusRequest, StatusResponse, StatusWithRepliesResponse, StatusAudience, StatusPrivacy } from './models/StatusWithRepliesResponseDto';
import { ActivatedRoute } from '@angular/router';
import { StatusDetailComponent } from './status-detail/status-detail.component';
import { Subject, takeUntil } from 'rxjs';
import { StatusServices } from './services/status.services';
import { MatIconModule } from '@angular/material/icon';
import { StatusCardComponent } from './status-card/status-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { ProfileServices } from '../profile/services/profile.services';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    StatusDetailComponent,
    MatIconModule,
    StatusCardComponent,
    MatProgressSpinnerModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="feed w-100 rounded" #scrollContainer (scroll)="onScroll()" style="overflow-y: auto;">
      <ng-container *ngIf="feedMode; else singleStatus">
        <div class="compose-box">
          <div class="avatar">
            <img [src]="profilePicture" (error)="onImageError($event,'assets/ProfileAvatar.png')" alt="User Avatar">
          </div>
          <div class="compose-content">
            <div class="compose-header">
              <span class="header-text"></span>
               <button mat-icon-button class="more-options" [matMenuTriggerFor]="moreMenu">
                <mat-icon>more_horiz</mat-icon>
              </button>
              <mat-menu #moreMenu="matMenu">
                <button mat-menu-item [matMenuTriggerFor]="privacyMenu">Post visibility</button>
                <mat-divider></mat-divider>
                <button mat-menu-item [matMenuTriggerFor]="replyAudienceMenu">Who can reply?</button>
                <mat-divider></mat-divider>
                <button mat-menu-item [matMenuTriggerFor]="shareAudienceMenu">Who can share?</button>
                <mat-divider></mat-divider>
              </mat-menu>
              
              <mat-menu #privacyMenu="matMenu">
                <button mat-menu-item (click)="setPrivacy(StatusPrivacy.PUBLIC)">
                  <span class="menu-icon">
                    <mat-icon>public</mat-icon>
                  </span>
                  <span>Public</span>
                </button>
                <button mat-menu-item (click)="setPrivacy(StatusPrivacy.FOLLOWERS)">
                  <span class="menu-icon">
                    <mat-icon>people</mat-icon>
                  </span>
                  <span>Followers only</span>
                </button>
                <button mat-menu-item (click)="setPrivacy(StatusPrivacy.PRIVATE)">
                  <span class="menu-icon">
                    <mat-icon>lock</mat-icon>
                  </span>
                  <span>Private</span>
                </button>
              </mat-menu>

              <mat-menu #replyAudienceMenu="matMenu">
                <button mat-menu-item (click)="setReplyAudience(StatusAudience.EVERYONE)">
                  <span class="menu-icon">
                    <mat-icon>public</mat-icon>
                  </span>
                  <span>Everyone can reply</span>
                </button>
                <button mat-menu-item (click)="setReplyAudience(StatusAudience.FOLLOWERS)">
                  <span class="menu-icon">
                    <mat-icon>people</mat-icon>
                  </span>
                  <span>People you follow</span>
                </button>
                <button mat-menu-item (click)="setReplyAudience(StatusAudience.ONLY_ME)">
                  <span class="menu-icon">
                    <mat-icon>lock</mat-icon>
                  </span>
                  <span>Only me</span>
                </button>
              </mat-menu>

              <mat-menu #shareAudienceMenu="matMenu">
                <button mat-menu-item (click)="setShareAudience(StatusAudience.EVERYONE)">
                  <span class="menu-icon">
                    <mat-icon>public</mat-icon>
                  </span>
                  <span>Everyone can share</span>
                </button>
                <button mat-menu-item (click)="setShareAudience(StatusAudience.FOLLOWERS)">
                  <span class="menu-icon">
                    <mat-icon>people</mat-icon>
                  </span>
                  <span>People you follow</span>
                </button>
                <button mat-menu-item (click)="setShareAudience(StatusAudience.ONLY_ME)">
                  <span class="menu-icon">
                    <mat-icon>lock</mat-icon>
                  </span>
                  <span>Only me</span>
                </button>
              </mat-menu>
            </div>
            <textarea 
              [(ngModel)]="newStatusText" 
              placeholder="What is happening?!" 
              rows="3"
              class="compose-textarea"
              #textarea
              (input)="onTextInput($event)"
              maxlength="280">
            </textarea>
            <div class="counter" *ngIf="showCounter">{{ getRemainingChars() }}</div>
            <div class="media-preview" *ngIf="selectedFiles.length > 0">
              <div class="preview-grid" [ngClass]="getGridClass()">
                <div *ngFor="let file of selectedFiles; let i = index" class="preview-item">
                  <img *ngIf="isImage(file)" [src]="getFilePreview(file)" class="preview-media" alt="Preview">
                  <video *ngIf="isVideo(file)" [src]="getFilePreview(file)" class="preview-media" muted loop playsinline></video>
                  <mat-icon class="remove-icon" (click)="removeFile(i)">close</mat-icon>
                  <!-- <div *ngIf="i === selectedFiles.length - 1 && selectedFiles.length < 4" class="add-more-overlay" (click)="fileInput.click()">
                    <mat-icon>add_photo_alternate</mat-icon>
                  </div> -->
                </div>
              </div>
            </div>
            <div class="compose-actions">
              <div class="action-icons">
                <input #fileInput type="file" multiple accept="image/*,video/*" style="display: none;" (change)="onFileSelected($event)">
                <button mat-icon-button class="action-btn" aria-label="Photo" (click)="fileInput.click()" matTooltip="Photo">
                  <mat-icon>photo</mat-icon>
                </button>
              </div>
              <div class="post-section">
                <button 
                  mat-raised-button 
                  class="post-btn"
                  color="primary" 
                  [disabled]="!canPost()"
                  (click)="createNewStatus()">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="feed-inner">
          <div *ngIf="isLoading && feed.length === 0" class="loading-spinner">
            <!-- <mat-spinner diameter="40"></mat-spinner> -->
          </div>

          <ng-container *ngIf="!(isLoading && feed.length === 0)">
            <app-status-card
              *ngFor="let post of feed; trackBy: trackByStatusId"
              [statusData]="post">
            </app-status-card>
          </ng-container>
        </div>

        <div *ngIf="isLoading && feed.length > 0" class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      </ng-container>

      <ng-template #singleStatus>
        <div *ngIf="statusNotFound; else detail">
          <div class="unavailable-content rounded">
            <mat-icon class="lock-icon">lock</mat-icon>
            <h3>This content isn't available at the moment</h3>
            <p>When this happens, it's usually because the owner only shared it with a small group of people, changed who can see it, or it's been deleted.</p>
          </div>
        </div>

        <ng-template #detail>
          <div class="feed-inner">
            <app-status-detail [statusData]="statusData"></app-status-detail>
          </div>
        </ng-template>
      </ng-template>
    </div>
  `,
  styles: [`
    .feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
      --bg-color: #000;
      --text-primary: #fff;
      --text-secondary: #71767b;
      --border-color: #2f3336;
      --primary-color: #1d9bf0;
      --primary-hover: #1a8cd8;
      --card-bg: #16181c;
      --success-color: #00ba7c;
    }

    .feed-inner {
      display: flex;
      flex-direction: column;
      gap: 16px;
     }

    .unavailable-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background-color: var(--bg-color);
      color: var(--text-primary);
      padding: 20px;
      margin: auto;
      max-width: 600px;
      border-radius: 8px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    .compose-box {
      display: flex;
      padding: 16px;
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      border-radius: 0;
    }

    .avatar {
      margin-right: 12px;
      flex-shrink: 0;
    }

    .avatar img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--border-color);
    }

    .compose-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .compose-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .header-text {
      font-weight: bold;
      font-size: 20px;
      color: var(--text-primary);
    }

    .more-options {
      color: var(--text-secondary);
    }

    .more-options:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .compose-textarea {
      border: none;
      resize: none;
      font-size: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      outline: none;
      width: 100%;
      margin-bottom: 8px;
      background: transparent;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .compose-textarea::placeholder {
      color: var(--text-secondary);
    }

    .counter {
      align-self: flex-end;
      color: var(--text-secondary);
      font-size: 13px;
      margin-bottom: 8px;
    }

    .counter.warning {
      color: #f4212e;
    }

    .media-preview {
      margin-bottom: 12px;
      max-width: 504px;
      border-radius: 16px;
      overflow: hidden;
      background: var(--border-color);
    }

    .preview-grid {
      display: grid;
      gap: 0;
      border-radius: 16px;
      overflow: hidden;
    }

    .preview-grid.grid-1 {
      grid-template-columns: 1fr;
    }

    .preview-grid.grid-2 {
      grid-template-columns: 1fr 1fr;
    }

    .preview-grid.grid-3,
    .preview-grid.grid-4 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    }

    .preview-grid.grid-3 .preview-item:nth-child(3) {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .preview-item {
      position: relative;
      aspect-ratio: 16 / 9;
      border-radius: 0;
      overflow: hidden;
      background: #000;
    }

    .preview-media {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .remove-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(29, 155, 240, 0.9);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      z-index: 1;
    }

    .add-more-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      font-size: 32px;
      z-index: 1;
    }

    .add-more-overlay mat-icon {
      width: 32px;
      height: 32px;
    }

    .compose-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--border-color);
    }

    .action-icons {
      display: flex;
      gap: 16px;
    }

    .action-btn {
      color: var(--primary-color);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .action-btn:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    .action-btn:disabled {
      color: var(--text-secondary);
    }

    .post-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .post-btn {
      border-radius: 20px;
      padding: 8px 16px;
      font-weight: bold;
      text-transform: none;
      min-width: 60px;
      height: 36px;
    }

    .post-btn:not(:disabled) {
      background-color: var(--primary-color);
      color: white;
    }

    .post-btn:not(:disabled):hover {
      background-color: var(--primary-hover);
    }

    .post-btn:disabled {
      background-color: var(--text-secondary);
      color: white;
    }

    mat-menu {
      background-color: var(--card-bg);
      color: var(--text-primary);
    }

    mat-menu-item {
      color: var(--text-primary);
    }

    mat-menu-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .menu-icon {
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: var(--text-secondary);
    }

    @media (prefers-color-scheme: light) {
      .feed {
        --bg-color: #fff;
        --text-primary: #0f1419;
        --text-secondary: #536471;
        --border-color: #e7e9ea;
        --card-bg: #fff;
        --primary-color: #1d9bf0;
        --primary-hover: #1a8cd8;
      }

      .compose-textarea::placeholder {
        color: var(--text-secondary);
      }

      .compose-box {
        background-color: var(--card-bg);
        border-bottom: 1px solid var(--border-color);
      }
    }
  `]
})
export class FeedComponent implements OnInit, AfterViewInit, OnDestroy {
  feedMode = false;
  private destroy$ = new Subject<void>();
  statusId!: string;
  statusNotFound = false;

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef<HTMLDivElement>;

  feed: StatusResponse[] = [];
  page = 0;
  isLoading = false;
  hasMoreFeed = true;

  newStatusText: string = '';
  selectedFiles: File[] = [];
  filePreviews: string[] = [];

  privacy: StatusPrivacy = StatusPrivacy.PUBLIC;
  replyAudience: StatusAudience = StatusAudience.EVERYONE;
  shareAudience: StatusAudience = StatusAudience.EVERYONE;

  showCounter = false;

  private isAutoScrolling = false;
  private readonly debug = false;
  StatusAudience = StatusAudience;
  StatusPrivacy = StatusPrivacy;
  profilePicture!: string | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusServices: StatusServices,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private profileServices: ProfileServices,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFeed());

    this.profileServices.GetDataOfProfile(this.auth.UserName).subscribe({
      next: (res) => {
        this.profilePicture = `data:image/png;base64,${res?.userAvatar.profilePicture}`;

      }
    })
  }

  ngAfterViewInit(): void {
    this.safeSetScrollTop(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filePreviews.forEach(url => URL.revokeObjectURL(url));
  }

  statusData!: StatusWithRepliesResponse;
  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }
  private initFeed(): void {
    const statusId = this.activatedRoute.snapshot.paramMap.get('statusId');
    if (statusId) {
      this.statusServices.getStatusById(statusId).subscribe({
        next: (res) => {
          this.statusId = statusId;
          this.statusData = res;
        },
        error: () => (this.statusNotFound = true)
      });
    } else {
      this.feedMode = true;
      this.loadFeed();
    }
  }

  loadFeed(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    const el = this.getScrollContainer();
    const prevScrollTop = el ? el.scrollTop : 0;

    this.statusServices.fetchUserFeed(this.page).subscribe({
      next: (res) => {
        (async () => {
          if (this.debug) console.log('[feed] fetched', { page: this.page, count: res.statuses.length });

          if (this.page === 0) {
            console.log(res)
            this.feed = res.statuses;
            this.cdr.detectChanges();
            await this.waitForStableScrollHeight();
            this.safeSetScrollTop(0);
          } else {
            this.feed = [...this.feed, ...res.statuses];
            this.cdr.detectChanges();
            await this.waitForStableScrollHeight();
            const container = this.getScrollContainer();
            if (container) {
              this.safeSetScrollTop(prevScrollTop);
            }
          }

          if (res.statuses.length > 0) this.page++;
          this.notificationService.updateUnreadCounts(res.unreadMessagesCount, res.unreadNotificationsCount);
          this.hasMoreFeed = res.statuses.length > 0;

          if (this.debug) {
            const c = this.getScrollContainer();
            console.log('[feed] after update', c ? { scrollTop: c.scrollTop, scrollHeight: c.scrollHeight } : null);
          }
        })();
      },
      error: (err) => {
        console.error('Failed to load feed', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onScroll(): void {
    if (this.isAutoScrolling) return;

    const container = this.getScrollContainer();
    if (!container) return;

    const threshold = 150;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;

    if (position >= height - threshold && !this.isLoading && this.hasMoreFeed) {
      this.loadFeed();
    }
  }

  trackByStatusId(index: number, item: StatusResponse) {
    return item?.statusId ?? index;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      const remainingSlots = 4 - this.selectedFiles.length;
      const filesToAdd = newFiles.slice(0, remainingSlots);
      this.selectedFiles = [...this.selectedFiles, ...filesToAdd];
      this.updateFilePreviews();
      this.cdr.detectChanges();
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateFilePreviews();
    this.cdr.detectChanges();
  }

  private updateFilePreviews(): void {
    this.filePreviews.forEach(url => URL.revokeObjectURL(url));
    this.filePreviews = this.selectedFiles.map(file => URL.createObjectURL(file));
  }

  getFilePreview(file: File): string {
    const index = this.selectedFiles.indexOf(file);
    return this.filePreviews[index] || '';
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  getGridClass(): string {
    return `grid-${this.selectedFiles.length}`;
  }

  onTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.showCounter = target.value.length > 0;
    this.cdr.detectChanges();
  }

  getRemainingChars(): number {
    const remaining = 280 - this.newStatusText.length;
    return remaining;
  }

  canPost(): boolean {
    return this.newStatusText.trim().length > 0 || this.selectedFiles.length > 0;
  }


  setPrivacy(privacy: StatusPrivacy): void {
    this.privacy = privacy;
  }

  setReplyAudience(audience: StatusAudience): void {
    this.replyAudience = audience;
  }

  setShareAudience(audience: StatusAudience): void {
    this.shareAudience = audience;
  }

  createNewStatus(): void {
    if (!this.canPost()) return;

    const toCreate: CreateStatusRequest = {
      content: this.newStatusText,
      privacy: this.privacy,
      replyAudience: this.replyAudience,
      shareAudience: this.shareAudience
    };

    this.statusServices.createStatus(toCreate, this.selectedFiles).subscribe({
      next: (statusId) => {
        this.newStatusText = '';
        this.selectedFiles = [];
        this.updateFilePreviews();
        this.showCounter = false;
        this.page = 0;
        this.feed = [];
        this.loadFeed();
      },
      error: (err) => {
        console.error('Failed to create status', err);
      }
    });
  }

  private getScrollContainer(): HTMLElement | null {
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      return this.scrollContainer.nativeElement;
    }
    return document.querySelector('.feed') as HTMLElement | null;
  }

  private safeSetScrollTop(value: number) {
    const el = this.getScrollContainer();
    if (!el) return;
    this.isAutoScrolling = true;
    requestAnimationFrame(() => {
      try { el.scrollTop = value; } catch { }
      setTimeout(() => (this.isAutoScrolling = false), 80);
    });
  }

  private waitForStableScrollHeight(stableForMs = 120, timeoutMs = 3000): Promise<void> {
    const el = this.getScrollContainer();
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      let finished = false;
      let lastHeight = el.scrollHeight;
      let stableTimer: any = null;
      let timeoutTimer: any = null;
      let ro: ResizeObserver | null = null;

      const finish = () => {
        if (finished) return;
        finished = true;
        if (ro) ro.disconnect();
        clearTimeout(stableTimer);
        clearTimeout(timeoutTimer);
        resolve();
      };

      if ((window as any).ResizeObserver) {
        ro = new (window as any).ResizeObserver(() => {
          const h = el.scrollHeight;
          if (h !== lastHeight) {
            lastHeight = h;
            clearTimeout(stableTimer);
            stableTimer = setTimeout(() => finish(), stableForMs);
          }
        });
        ro?.observe(el);
        stableTimer = setTimeout(() => finish(), stableForMs);
        timeoutTimer = setTimeout(() => finish(), timeoutMs);
      } else {
        const interval = setInterval(() => {
          const h = el.scrollHeight;
          if (h !== lastHeight) {
            lastHeight = h;
            clearTimeout(stableTimer);
            stableTimer = setTimeout(() => {
              clearInterval(interval);
              finish();
            }, stableForMs);
          }
        }, 60);

        timeoutTimer = setTimeout(() => {
          clearInterval(interval);
          finish();
        }, timeoutMs);
      }
    });
  }
}