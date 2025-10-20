import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService } from '../services/notification.service';
import { NotificationDto } from './models/notification.model';

type TabKey = 'ALL' | 'MENTIONS';
type HeaderStyle = 'pill' | 'underline' | 'segmented';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule],
  template: `
<div class="notif-root">
  <!-- Header -->
  <div class="toolbar toolbar--alt">
    <div class="title-wrap">
      <h2 class="title">Notifications</h2>
      <span class="sub" *ngIf="unreadCount() > 0">{{ unreadCount() }} unread</span>
    </div>

    <!-- Switchable tab styles -->
    <ng-container [ngSwitch]="headerStyle">
      <!-- A) Pill tabs -->
      <div *ngSwitchCase="'pill'" class="tabs tabs--pill" role="tablist" aria-label="Notification filters">
        <button role="tab" class="tab" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')">
          <mat-icon>notifications</mat-icon><span>All</span>
        </button>
        <button role="tab" class="tab" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')">
          <mat-icon>alternate_email</mat-icon><span> Mentions</span>
          <span class="chip" *ngIf="mentionsCount">{{ mentionsCount }}</span>
        </button>
      </div>

      <!-- B) Underline tabs -->
      <div *ngSwitchCase="'underline'" class="tabs tabs--underline">
        <button class="tab" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')">All</button>
        <button class="tab" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')">{{ '@' }} Mentions</button>
        <div class="slider" [style.transform]="activeTab==='ALL' ? 'translateX(0%)' : 'translateX(100%)'"></div>
      </div>

      <!-- C) Segmented control -->
      <div *ngSwitchCase="'segmented'" class="tabs tabs--segmented">
        <button class="seg" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')">All</button>
        <button class="seg" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')">{{ '@' }} Mentions</button>
      </div>
    </ng-container>

    <!-- Right actions -->
    <div class="actions">
      <button mat-button class="mark-all" (click)="markAllAsRead()" [disabled]="unreadCount()===0" aria-label="Mark all as read">
        <mat-icon>done_all</mat-icon>
        Mark all
        <span class="badge" *ngIf="unreadCount()>0">{{ unreadCount() }}</span>
      </button>
      <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="More"><mat-icon>more_horiz</mat-icon></button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="refresh()"><mat-icon>refresh</mat-icon><span>Refresh</span></button>
        <button mat-menu-item (click)="toggleInfinite()">
          <mat-icon>{{ infiniteScroll ? 'swap_vert' : 'vertical_align_bottom' }}</mat-icon>
          <span>{{ infiniteScroll ? 'Disable infinite scroll' : 'Enable infinite scroll' }}</span>
        </button>
      </mat-menu>
    </div>
  </div>

  <!-- Empty state -->
  <div *ngIf="!loadingInitial && filtered().length === 0" class="empty">
    <div class="empty-illustration">🔔</div>
    <div class="empty-title">No notifications yet</div>
    <div class="empty-sub">You’ll see likes, replies, mentions, and follows here.</div>
  </div>

  <!-- Skeletons (initial load) -->
  <div *ngIf="loadingInitial" class="list">
    <div class="card skeleton" *ngFor="let i of skeletonItems">
      <div class="left">
        <div class="type-icon sk"></div>
        <div class="avatar sk"></div>
      </div>
      <div class="content">
        <div class="line sk w-70"></div>
        <div class="line sk w-50"></div>
      </div>
    </div>
  </div>

  <!-- Notifications list -->
  <div class="list" *ngIf="!loadingInitial">
    <article
      class="card"
      *ngFor="let n of filtered(); trackBy: trackById"
      [class.unread]="isUnread(n)"
      role="button"
      tabindex="0"
      (click)="open(n)"
      (keyup.enter)="open(n)"
      (keyup.space)="open(n)"
      [attr.aria-label]="ariaLabel(n)"
    >
      <div class="left">
        <div class="type-icon" [ngClass]="typeClass(n.type)" [matTooltip]="n.type | titlecase">
          <mat-icon>{{ typeIcon(n.type) }}</mat-icon>
        </div>

        <!-- Avatar -> profile -->
        <a class="avatar" (click)="navigateToProfile(n.lastActorUsername); $event.stopPropagation()" tabindex="-1" aria-label="Open profile">
          <img
            [src]="processProfilePicture(n.lastActorProfilePicture)"
            (error)="onImageError($event, 'assets/ProfileAvatar.png')"
            alt="Avatar"
          />
        </a>
      </div>

      <div class="content">
        <div class="row-1">
          <!-- Clickable last actor username -->
          <button class="actor-link" (click)="navigateToProfile(n.lastActorUsername); $event.stopPropagation()" mat-button>
            <strong>{{'@' + n.lastActorUsername }}</strong>
          </button>

          <!-- If multiple actors, summarize after the main handle -->
          <ng-container *ngIf="(n.actorDisplayNames?.length ?? 0) > 1">
            <span class="actors">&nbsp;and {{ n.actorDisplayNames.length - 1 }} others</span>
          </ng-container>

          <span class="action">{{ actionText(n) }}</span>

          <ng-container *ngIf="n.statusId">
            <a class="status-link" [routerLink]="['/status', n.statusId]" (click)="$event.stopPropagation()">
              {{ n.statusContent ? ('“' + clamp(n.statusContent, 120) + '”') : 'your status' }}
            </a>
          </ng-container>
        </div>

        <div class="row-2">
          <span class="time">{{ getRelativeTime(n.lastUpdatedAt) }}</span>
          <span class="dot" *ngIf="isUnread(n)"></span>
          <span class="state">{{ readableState(n.groupingState) }}</span>

          <!-- Quick mark read -->
          <button
            mat-stroked-button
            class="mark-one"
            *ngIf="isUnread(n)"
            (click)="markOneAsRead(n); $event.stopPropagation()"
            aria-label="Mark as read"
          >Mark read</button>
        </div>
      </div>
    </article>

    <!-- Load more / pagination footer -->
    <div class="footer" *ngIf="!allPagesLoaded">
      <button mat-raised-button class="load-more"
        *ngIf="!infiniteScroll"
        (click)="loadNextPage()"
        [disabled]="loadingMore">
        <mat-icon>expand_more</mat-icon>
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
      <div #sentinel class="sentinel" *ngIf="infiniteScroll" aria-hidden="true"></div>
      <div class="foot-note" *ngIf="infiniteScroll">Auto-loading more as you scroll…</div>
    </div>

    <!-- Small spinner while appending -->
    <div class="append-spinner" *ngIf="loadingMore">
      <div class="spinner sk"></div>
      <span>Loading more…</span>
    </div>
  </div>
</div>
  `,
  styles: [`
:host { display:block; }
.notif-root {
  --bg: #fff;
  --fg: #0f1419;
  --muted: #536471;
  --soft: #f2f5f7;
  --border: rgba(0,0,0,0.08);
  --brand: #1d9bf0;
  --brand-weak: rgba(29,155,240,.10);
  --card: #ffffff;
  --like: #f91880;
  --ok: #00ba7c;
  --warn: #ff7a00;

  max-width: 100%;
  color: var(--fg);
  background: var(--bg);
}

/* Modern toolbar: translucent + subtle gradient line */
.toolbar {
  position: sticky; top: 0; z-index: 5;
  display:flex; align-items:center; justify-content: space-between; gap: .75rem; flex-wrap: wrap;
  padding: .75rem 1rem;
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border-bottom: 1px solid var(--border);
}
.toolbar::after{
  content:''; position:absolute; inset:auto 0 0 0; height:2px;
  background: linear-gradient(90deg, transparent, var(--brand), transparent); opacity:.25;
}
.title-wrap { display:flex; align-items:baseline; gap:.5rem; }
.title { margin:0; font-size:1.35rem; font-weight:900; letter-spacing:.2px; }
.sub { color: var(--muted); font-size:.9rem; }

/* Tabs */
.tabs { display:flex; align-items:center; gap:.5rem; }
.tab { border:0; background:transparent; cursor:pointer; font-weight:700; letter-spacing:.2px; }

.tabs--pill .tab {
  display:flex; align-items:center; gap:.45rem;
  padding:.5rem 1rem; border-radius:999px; transition: all .18s;
  color: var(--muted);
}
.tabs--pill .tab:hover { background: var(--brand-weak); color: var(--fg); }
.tabs--pill .tab.active { background: rgba(29,155,240,.18); color: var(--fg); box-shadow: inset 0 0 0 1px rgba(29,155,240,.28); }
.tabs--pill .tab mat-icon { font-size:18px; width:18px; height:18px; }
.tabs--pill .chip {
  margin-left:.25rem; min-width:1.2rem; height:1.2rem; display:inline-grid; place-items:center;
  border-radius:999px; font-size:.72rem; line-height:1;
  background: var(--brand); color:#fff; padding:0 .35rem;
}

/* Underline tabs */
.tabs--underline { position:relative; gap:1.25rem; }
.tabs--underline .tab { padding:.6rem .25rem; color: var(--muted); }
.tabs--underline .tab.active { color: var(--fg); }
.tabs--underline .slider {
  position:absolute; left:0; bottom:0; width:50%; height:2px;
  background: var(--brand); border-radius:2px; transition: transform .2s ease;
}

/* Segmented control */
.tabs--segmented {
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 999px; padding: .2rem; gap:.2rem;
}
.seg {
  border:0; background: transparent; border-radius:999px;
  padding:.38rem 1rem; font-weight:800; color: var(--muted); cursor:pointer;
}
.seg.active { background:#fff; color: var(--fg); box-shadow: 0 2px 8px rgba(0,0,0,.06); }

/* List + Cards */
.list { padding:.25rem 0; }
.card {
  display:flex; gap:.85rem; padding: .9rem 1rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background .15s ease, transform .06s ease;
  background: var(--card);
}
.card:hover { background: rgba(29,155,240,.05); }
.card:active { transform: translateY(1px); }
.card.unread { background: rgba(29,155,240,.08); }

.left { display:flex; align-items:flex-start; gap:.7rem; }
.type-icon {
  width: 38px; height: 38px; min-width:38px; border-radius: 12px; display:grid; place-items:center;
  background: rgba(29,155,240,.12);
}
.type-like   { background: color-mix(in srgb, var(--like) 18%, transparent); }
.type-reply  { background: color-mix(in srgb, var(--brand) 18%, transparent); }
.type-mention{ background: color-mix(in srgb, var(--brand) 18%, transparent); }
.type-follow { background: color-mix(in srgb, var(--ok) 18%, transparent); }
.type-restrict{ background: color-mix(in srgb, var(--warn) 18%, transparent); }

.type-icon mat-icon { font-size:20px; width:20px; height:20px; color: var(--brand); }
.type-like mat-icon { color: var(--like); }
.type-follow mat-icon { color: var(--ok); }
.type-restrict mat-icon { color: var(--warn); }

.avatar img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; display:block; }

.content { flex:1; min-width:0; }
.row-1 { font-size:.96rem; line-height:1.35; word-break: break-word; display:flex; flex-wrap:wrap; gap:.25rem; align-items:baseline; }
.actor-link { padding:0 .1rem; line-height:1; min-height:auto; }
.actor-link strong{ font-weight:900; }
.actors { color: var(--muted); }
.action { color: var(--muted); margin-left:.1rem; }
.status-link { margin-left:.25rem; color: var(--brand); text-decoration: none; }
.status-link:hover { text-decoration: underline; }

.row-2 { margin-top:.35rem; display:flex; align-items:center; gap:.6rem; font-size:.82rem; color: var(--muted); }
.dot { width:6px; height:6px; border-radius:999px; background: var(--brand); }
.mark-one { margin-left:auto; line-height:1.6; padding: 0 .6rem; }

/* Skeletons */
.skeleton { pointer-events: none; }
.sk {
  background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06));
  background-size: 200% 100%; animation: shimmer 1.1s infinite linear;
}
@keyframes shimmer { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }
.skeleton .type-icon { border-radius:12px; }
.skeleton .avatar { width:44px; height:44px; border-radius:12px; background:transparent; }
.skeleton .avatar::before { content:''; display:block; width:44px; height:44px; border-radius:12px; background:rgba(0,0,0,0.08); }
.line { height:12px; border-radius:6px; margin:.35rem 0; }
.w-70{ width:70%; } .w-50{ width:50%; }

/* Footer / pagination */
.footer { display:grid; place-items:center; padding: .75rem 0 1.25rem; }
.load-more { font-weight:800; }
.sentinel { width:100%; height: 1px; }
.foot-note { color: var(--muted); font-size:.8rem; }

.append-spinner {
  display:flex; gap:.6rem; align-items:center; justify-content:center; padding: .8rem 0 1.4rem; color: var(--muted);
}
.append-spinner .spinner { width:14px; height:14px; border-radius:999px; }

@media (prefers-color-scheme: dark){
  .notif-root {
    --bg:#0b1218; --fg:#e6e9ef; --muted:#8b98a5; --soft:#121a22; --border: rgba(255,255,255,0.08);
    --card:#0f1720; --brand:#1d9bf0;
  }
  .seg.active { background: var(--soft); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
  .card:hover{ background: rgba(29,155,240,.07); }
  .card.unread{ background: rgba(29,155,240,.12); }
}
  `]
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() notifications: NotificationDto[] = [];
  @Input() headerStyle: HeaderStyle = 'pill';

  // Paging
  page = 0;
  pageSize = 10;
  allPagesLoaded = false;
  loadingInitial = true;
  loadingMore = false;
  infiniteScroll = true;

  // UI
  activeTab: TabKey = 'ALL';
  skeletonItems = Array.from({ length: 6 });

  private io?: IntersectionObserver;
  private destroyed = false;

  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLDivElement>;

  // OPTIONAL: if using a custom scroll container (not window), add:
  // @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLElement>;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void { this.resetAndLoad(); }

  ngAfterViewInit(): void {
    // Initial attempt (may not find the sentinel yet)
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.io?.disconnect();
  }

  refresh(): void { this.resetAndLoad(); }
  toggleInfinite(): void { this.infiniteScroll = !this.infiniteScroll; this.setupObserver(); }

  get mentionsCount(): number {
    return this.notifications.filter(n => n.type === 'MENTION' && this.isUnread(n)).length;
  }

  /* ---------- Load + Pagination ---------- */
  private resetAndLoad(): void {
    this.loadingInitial = true;
    this.loadingMore = false;
    this.allPagesLoaded = false;
    this.page = 0;
    this.notifications = [];
    this.loadPage(this.page, false);
  }

  loadNextPage(): void {
    if (this.loadingMore || this.allPagesLoaded) return;
    this.page += 1;
    this.loadPage(this.page, true);
  }

  private loadPage(page: number, append: boolean): void {
    if (append) this.loadingMore = true;
    this.notificationService.getNotifications(page).subscribe({
      next: (data) => {
        console.log(data)
        const list = Array.isArray(data) ? data : [];
        // Sort page by lastUpdatedAt DESC
        list.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

        // Merge + de-dup by id
        const merged = append ? [...this.notifications, ...list] : list;
        const dedup = new Map<string | number, NotificationDto>();
        for (const n of merged) dedup.set(n.id as any, n);
        this.notifications = Array.from(dedup.values());

        // If page returned fewer than pageSize, assume end
        if (list.length < this.pageSize) this.allPagesLoaded = true;

        this.loadingInitial = false;
        this.loadingMore = false;

        // Re-attach observer AFTER the list/sentinel renders
        queueMicrotask(() => this.setupObserver());
        // Or: setTimeout(() => this.setupObserver());
      },
      error: (err) => {
        console.error('Failed to fetch notifications', err);
        if (append) this.page = Math.max(0, this.page - 1); // rollback page index on error
        this.loadingInitial = false;
        this.loadingMore = false;
        queueMicrotask(() => this.setupObserver());
      }
    });
  }

  private setupObserver(): void {
    // Always stop previous observer (avoid duplicates/leaks)
    this.io?.disconnect();
    this.io = undefined;

    if (!this.infiniteScroll || this.allPagesLoaded) return;

    // Create fresh observer
    this.io = new IntersectionObserver((entries) => {
      if (this.loadingMore || this.allPagesLoaded) return;
      for (const e of entries) {
        if (e.isIntersecting) {
          this.loadNextPage();
          break;
        }
      }
    }, {
      root: null, // If using a scroll container: this.scrollContainer?.nativeElement ?? null,
      rootMargin: '600px 0px',
      threshold: 0
    });

    // Retry observing until sentinel exists (handles *ngIf timing)
    const tryObserve = (attempt = 0) => {
      if (this.destroyed || !this.io) return;
      const el = this.sentinelRef?.nativeElement;
      if (el) {
        this.io.observe(el);
      } else if (attempt < 10) {
        requestAnimationFrame(() => tryObserve(attempt + 1));
      }
    };
    tryObserve();
  }

  /* ---------- UX helpers ---------- */
  setTab(tab: TabKey) { this.activeTab = tab; }
  filtered(): NotificationDto[] {
    const base = this.activeTab === 'MENTIONS'
      ? this.notifications.filter(n => n.type === 'MENTION')
      : this.notifications;

    // Keep overall order (by lastUpdatedAt desc)
    return [...base].sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
  }
  unreadCount(): number { return this.notifications.filter(n => this.isUnread(n)).length; }
  isUnread(n: NotificationDto): boolean { return n.groupingState !== 'READ'; }

  markAllAsRead(): void {
    const unreadIds = this.notifications.filter(n => this.isUnread(n)).map(n => n.id);
    if (unreadIds.length === 0) return;
    this.notificationService.markAsRead(unreadIds).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => this.isUnread(n) ? { ...n, groupingState: 'READ' } : n);
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  markOneAsRead(n: NotificationDto): void {
    if (!this.isUnread(n)) return;
    this.notificationService.markAsRead([n.id]).subscribe({
      next: () => { n.groupingState = 'READ'; },
      error: (err) => console.error('Failed to mark notification as read', err)
    });
  }

  /* ---------- Navigation ---------- */
  open(n: NotificationDto): void {
    if (n.statusId) { this.router.navigate(['/status', n.statusId]); }
    else if (n.lastActorUsername) { this.navigateToProfile(n.lastActorUsername); }
    if (this.isUnread(n)) this.markOneAsRead(n);
  }

  navigateToProfile(username?: string | null): void {
    if (!username) return;
    this.router.navigate(['/', username]); // adjust if your route differs
  }

  /* ---------- Display helpers ---------- */
  trackById(_: number, n: NotificationDto) { return n.id; }

  processProfilePicture(base64: string | null): string {
    if (!base64 || base64.trim().length === 0) return 'assets/ProfileAvatar.png';
    return base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
  }
  onImageError(event: Event, fallback: string): void { (event.target as HTMLImageElement).src = fallback; }

  ariaLabel(n: NotificationDto): string {
    const who = n.lastActorUsername ? '@' + n.lastActorUsername : (n.actorDisplayNames?.[0] ?? 'Someone');
    return `${who} ${this.actionText(n)}`;
  }

  actionText(n: NotificationDto): string {
    switch (n.type) {
      case 'LIKE': return 'liked your post';
      case 'REPLY': return 'replied to your post';
      case 'MENTION': return 'mentioned you in';
      case 'FOLLOW': return 'followed you';
      case 'RESTRICT': return 'restricted your account for 3 days';
      default: return n.type?.toLowerCase() ?? 'activity';
    }
  }

  readableState(state: NotificationDto['groupingState']): string {
    switch (state) {
      case 'UNREAD_YET': return 'Unread';
      case 'HAS_NEW_ACTIVITY': return 'New activity';
      case 'READ': return 'Read';
      default: return '';
    }
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'LIKE': return 'favorite';
      case 'REPLY': return 'chat_bubble';
      case 'MENTION': return 'alternate_email';
      case 'FOLLOW': return 'person_add';
      case 'RESTRICT': return 'report';
      default: return 'notifications';
    }
  }

  typeClass(type: string): string {
    switch (type) {
      case 'LIKE': return 'type-like';
      case 'REPLY': return 'type-reply';
      case 'MENTION': return 'type-mention';
      case 'FOLLOW': return 'type-follow';
      case 'RESTRICT': return 'type-restrict';
      default: return '';
    }
  }

  getRelativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const s = Math.floor(diff / 1000); if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7); if (w < 4) return `${w}w`;
    const mos = Math.floor(d / 30); if (mos < 12) return `${mos}mo`;
    const y = Math.floor(d / 365); return `${y}y`;
  }

  clamp(text: string, max = 120): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
}
