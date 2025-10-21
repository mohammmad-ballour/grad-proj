import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusResponse } from '../feed/models/StatusWithRepliesResponseDto';
import { StatusCardComponent } from '../feed/status-card/status-card.component';
import { BookmarkService } from './services/bookmark.service';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, StatusCardComponent],
  template: `
  <section class="shell" #scrollHost>
    <header class="header">
      <h2>Bookmarks</h2>
      <span class="sub" *ngIf="totalCount() !== null">{{ totalCount() }} saved</span>
    </header>

    <ng-container *ngIf="items().length; else emptyState">
      <div class="list">
        <div class="item" *ngFor="let s of items(); trackBy: trackById">
          <app-status-card
            [statusData]="s"
            (deleted)="removeById($event)"
            (reloadRequested)="reloadOne($event)"
            (statusChanged)="onStatusChanged($event)">
          </app-status-card>
        </div>
      </div>

      <div class="spinner" *ngIf="loadingMore()">
        <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
      </div>

      <!-- Sentinel lives inside the scrolling container -->
      <div #infiniteAnchor class="infinite-anchor" aria-hidden="true"></div>
    </ng-container>

    <ng-template #emptyState>
      <div class="empty">
        <h3>No bookmarks yet</h3>
        <p>Save posts to read or reference later. Your saved posts will show up here.</p>
      </div>
    </ng-template>
  </section>
  `,
  styles: [`
    :host { display:block; background:#000; color:#e6e9ef; }
    .shell {
      width:100%;
      height:100dvh;                  /* make this the scroll container */
      overflow-y:auto;                /* <-- important */
      border-left:1px solid #2f3336; border-right:1px solid #2f3336;
    }
    .header {
      position:sticky; top:0; z-index:100;
      background:rgba(0,0,0,.85); backdrop-filter:blur(8px);
      padding:10px 16px; border-bottom:1px solid #2f3336;
      display:flex; align-items:baseline; gap:8px;
    }
    .header h2 { margin:0; font-size:20px; font-weight:800; color:#e7e9ea; }
    .sub { color:#8b98a5; font-size:12px; }
    .list { display:flex; flex-direction:column; }
    .item { border-bottom:1px solid #2f3336; }
    .empty { text-align:center; padding:48px 16px; color:#9aa5b1; }
    .spinner { display:flex; justify-content:center; padding:16px; }
    .infinite-anchor { height:1px; }
  `]
})
export class BookmarksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('infiniteAnchor') anchorEl?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollHost') scrollHost?: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;

  private page = 0;
  private done = false;
  private readonly PAGE_SIZE = 10;

  private hasUserScrolled = false;
  private readonly bottomEpsilonPx = 4;
  private raf = 0;

  items = signal<StatusResponse[]>([]);
  totalCount = signal<number | null>(null);
  loadingMore = signal<boolean>(false);

  constructor(private bookmarks: BookmarkService) { }

  ngOnInit(): void {
    this.loadPage(0);
  }

  ngAfterViewInit(): void {
    const rootEl = this.scrollHost?.nativeElement ?? null;

    // Listen to the *container's* scroll (not window)
    if (rootEl) {
      fromEvent(rootEl, 'scroll')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onContainerScroll());
    }

    // IO should also use the container as its root
    this.observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (!this.hasUserScrolled) return;            // don't auto-load before real scroll
        if (this.loadingMore() || this.done) return;
        this.loadPage(this.page + 1);
      },
      {
        root: rootEl,                                  // <-- key change
        rootMargin: '0px 0px 1px 0px',
        threshold: 0
      }
    );

    const node = this.anchorEl?.nativeElement;
    if (node) this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
  }

  /** Window resize can change visible height; re-check bottom. */
  @HostListener('window:resize')
  onWindowResize() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.checkBottomAndLoad());
  }

  /** If your layout *does* scroll the window, this still supports it. */
  @HostListener('window:scroll')
  onWindowScroll() {
    // This won’t fire if the container handles scrolling — that’s fine.
    if (!this.hasUserScrolled) this.hasUserScrolled = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.checkBottomAndLoad());
  }

  /** Main scroll handler for the container */
  private onContainerScroll() {
    if (!this.hasUserScrolled) this.hasUserScrolled = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.checkBottomAndLoad());
  }

  /** Compute scroll metrics for either window or the container */
  private getScrollMetrics() {
    const host = this.scrollHost?.nativeElement;
    if (host) {
      const scrollTop = host.scrollTop;
      const viewportBottom = scrollTop + host.clientHeight;
      const docHeight = host.scrollHeight;
      return { scrollTop, viewportBottom, docHeight };
    }
    const se = document.scrollingElement || document.documentElement;
    const scrollTop = se.scrollTop;
    const viewportBottom = scrollTop + window.innerHeight;
    const docHeight = se.scrollHeight;
    return { scrollTop, viewportBottom, docHeight };
  }

  /** Fallback: if we are at (or within epsilon of) the bottom, fetch next page */
  private checkBottomAndLoad() {
    if (!this.hasUserScrolled || this.loadingMore() || this.done) return;

    const { viewportBottom, docHeight } = this.getScrollMetrics();

    if (viewportBottom + this.bottomEpsilonPx >= docHeight) {
      this.loadPage(this.page + 1);
    }
  }

  trackById = (_: number, s: StatusResponse) => s.statusId;

  removeById = (statusId: string) => {
    const before = this.items().length;
    this.items.update(list => list.filter(s => s.statusId !== statusId));
    if (before !== this.items().length) {
      this.totalCount.set(Math.max(0, (this.totalCount() ?? 1) - 1));
    }
    if (this.hasUserScrolled) this.checkBottomAndLoad();
  };

  reloadOne = (_: string) => { /* no-op for now */ };

  onStatusChanged = (dto: { statusId: string; isSavedToBookmarks?: boolean }) => {
    if (dto?.isSavedToBookmarks === false) this.removeById(dto.statusId);
  };

  private loadPage(p: number) {
    if (this.loadingMore() || (this.done && p > 0)) return;

    this.loadingMore.set(true);
    this.bookmarks.list(p).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        console.log(data)
        if (p === 0) {
          this.items.set(data);
          this.totalCount.set(data.length);
          // Do NOT scroll programmatically to keep hasUserScrolled=false
        } else {
          this.items.update(arr => arr.concat(data));
          this.totalCount.set((this.totalCount() ?? 0) + data.length);
        }

        this.page = p;
        if (data.length === 0 || data.length < this.PAGE_SIZE) this.done = true;
      },
      error: (err) => {
        console.error('Failed to fetch bookmarks page', err);
      },
      complete: () => {
        this.loadingMore.set(false);
        // IO will trigger again when the sentinel comes into view after append.
      },
    });
  }
}
