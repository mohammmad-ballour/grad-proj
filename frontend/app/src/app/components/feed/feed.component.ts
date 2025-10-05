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
import { StatusResponse, StatusWithRepliesResponse } from './models/StatusWithRepliesResponseDto';
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
    MatInputModule
  ],
  template: `
    <div class="feed w-100 rounded" #scrollContainer (scroll)="onScroll()" style="overflow-y: auto;">
      <ng-container *ngIf="feedMode; else singleStatus">
        <div class="compose-box">
          <div class="avatar">
            <img src="placeholder-avatar.png" alt="User Avatar">
          </div>
          <div class="compose-content">
            <textarea [(ngModel)]="newStatusText" placeholder="What's happening?" rows="3"></textarea>
             <div class="media-preview" *ngIf="selectedFiles.length > 0">
              <div class="preview-grid" [ngClass]="getGridClass()">
                <div *ngFor="let file of selectedFiles; let i = index" class="preview-item">
                  <img *ngIf="isImage(file)" [src]="getFilePreview(file)" class="preview-media" alt="Preview">
                  <video *ngIf="isVideo(file)" [src]="getFilePreview(file)" class="preview-media" muted loop playsinline></video>
                  <mat-icon class="remove-icon" (click)="removeFile(i)">close</mat-icon>
                  <div *ngIf="i === selectedFiles.length - 1 && selectedFiles.length < 4" class="add-more-overlay" (click)="fileInput.click()">
                    <mat-icon>add_photo_alternate</mat-icon>
                  </div>
                </div>
              </div>
            </div>
            <div class="options">
              <input #fileInput type="file" multiple accept="image/*,video/*" style="display: none;" (change)="onFileSelected($event)">
              <mat-icon (click)="fileInput.click()">image</mat-icon>
              <mat-icon>emoji_emotions</mat-icon>
            </div>
            <button mat-raised-button color="primary" [disabled]="!newStatusText && selectedFiles.length === 0" (click)="createNewStatus()">Post</button>
          </div>
        </div>

        <div class="feed-inner">
          <div *ngIf="isLoading && feed.length === 0" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
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
    }

    .feed-inner {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 10px;
    }

    .unavailable-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background-color: white;
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
      background-color: #fff;
      border-bottom: 1px solid #eee;
    }

    .avatar {
      margin-right: 12px;
    }

    .avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .compose-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    textarea {
      border: none;
      resize: none;
      font-size: 18px;
      outline: none;
      width: 100%;
      margin-bottom: 8px;
    }

    .reply-settings {
      color: #1da1f2;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .media-preview {
      margin-bottom: 12px;
      max-width: 600px; /* Constrain width for better layout */
    }

    .preview-grid {
      display: grid;
      gap: 8px;
      border-radius: 12px;
      overflow: hidden;
      background: #f0f0f0;
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
      grid-column: 1 / -1; /* Span full width for 3rd item */
    }

    .preview-item {
      position: relative;
      aspect-ratio: 16 / 9; /* Consistent aspect ratio */
      border-radius: 8px;
      overflow: hidden;
      background: #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .preview-item:hover {
      transform: scale(1.02);
    }

    .preview-media {
      width: 100%;
      height: 100%;
      object-fit: cover; /* Maintain aspect ratio, cover container */
      display: block;
    }

    .remove-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .preview-item:hover .remove-icon {
      opacity: 1;
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
      border-radius: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .preview-item:hover .add-more-overlay {
      opacity: 1;
    }

    .add-more-overlay mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .options {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .options mat-icon {
      cursor: pointer;
      color: #1da1f2;
    }

    button {
      align-self: flex-end;
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

  private isAutoScrolling = false;
  private readonly debug = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusServices: StatusServices,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFeed());
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
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateFilePreviews();
  }

  private updateFilePreviews(): void {
    this.filePreviews.forEach(url => URL.revokeObjectURL(url));
    this.filePreviews = this.selectedFiles.map(file => URL.createObjectURL(file));
    this.cdr.detectChanges();
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

  createNewStatus(): void {
    if (!this.newStatusText && this.selectedFiles.length === 0) return;

    const toCreate = { text: this.newStatusText };

    this.statusServices.createStatus(toCreate, this.selectedFiles).subscribe({
      next: (statusId) => {
        this.newStatusText = '';
        this.selectedFiles = [];
        this.updateFilePreviews();
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