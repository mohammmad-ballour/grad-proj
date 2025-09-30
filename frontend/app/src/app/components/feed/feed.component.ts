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
import { StatusDetailComponent } from "./status-detail/status-detail.component";
import { Subject, takeUntil } from 'rxjs';
import { StatusServices } from './services/status.services';
import { MatIconModule } from "@angular/material/icon";
import { StatusCardComponent } from "./status-card/status-card.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    StatusDetailComponent,
    MatIconModule,
    StatusCardComponent,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="feed w-100 rounded" #scrollContainer (scroll)="onScroll()" style="overflow-y: auto;">
      <ng-container *ngIf="feedMode; else singleStatus">
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
    // safety: start at top if view exists
    this.safeSetScrollTop(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

        // wrap async logic so we can await stable DOM
        (async () => {
          console.log(res)
          if (this.debug) console.log('[feed] fetched', { page: this.page, count: res.statuses.length });

          if (this.page === 0) {
            // initial load: replace feed
            this.feed = res.statuses;
            this.cdr.detectChanges();

            // wait until scrollHeight is stable (handles images/child renders)
            await this.waitForStableScrollHeight();

            // set top after DOM has settled
            this.safeSetScrollTop(0);
          } else {
            // subsequent loads: append at bottom and restore previous scrollTop (in case browser moved it)
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

  /** UTIL: get scroll container safely */
  private getScrollContainer(): HTMLElement | null {
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      return this.scrollContainer.nativeElement;
    }
    return document.querySelector('.feed') as HTMLElement | null;
  }

  /** UTIL: set scrollTop programmatically while ignoring scroll events for a short period */
  private safeSetScrollTop(value: number) {
    const el = this.getScrollContainer();
    if (!el) return;
    this.isAutoScrolling = true;
    requestAnimationFrame(() => {
      try { el.scrollTop = value; } catch { }
      // ignore scroll events produced by this programmatic change
      setTimeout(() => (this.isAutoScrolling = false), 80);
    });
  }

  /**
   * Wait until the scrollHeight is stable for a short period.
   * Uses ResizeObserver when available (recommended). Falls back to polling.
   */
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

      // If ResizeObserver supported — observe container (it triggers when content size changes)
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
        // start a timer in case nothing changes
        stableTimer = setTimeout(() => finish(), stableForMs);
        timeoutTimer = setTimeout(() => finish(), timeoutMs);
      } else {
        // fallback: poll every 60ms
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
