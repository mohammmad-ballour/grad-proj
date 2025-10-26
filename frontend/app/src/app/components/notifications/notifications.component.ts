import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../services/notification.service';
import { NotificationDto } from './models/notification.model';
import { TimeAgoPipe } from "../../core/Pipes/TimeAgoPipe";

type TabKey = 'ALL' | 'MENTIONS';
type HeaderStyle = 'pill' | 'underline' | 'segmented';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatSnackBarModule, TimeAgoPipe],
  template: `
<div class="notif-root" (keydown.escape)="onEsc()">
  <div class="toolbar toolbar--alt">
    <div class="title-wrap">
      <h2 class="title">
        <mat-icon class="title-icon" aria-hidden="true">notifications</mat-icon>
        Notifications
      </h2>
      <span class="sub" *ngIf="unreadCount() > 0" aria-live="polite">{{ unreadCount() }} unread</span>
    </div>

    <ng-container [ngSwitch]="headerStyle">
      <div *ngSwitchCase="'pill'" class="tabs tabs--pill" role="tablist" aria-label="Notification filters">
        <button role="tab" class="tab" [attr.aria-selected]="activeTab==='ALL'" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')" (keydown)="onTabKey($event, 'ALL')">
          <mat-icon>notifications_active</mat-icon><span>All</span>
        </button>
        <button role="tab" class="tab" [attr.aria-selected]="activeTab==='MENTIONS'" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')" (keydown)="onTabKey($event, 'MENTIONS')">
          <mat-icon>alternate_email</mat-icon><span> Mentions</span>
          <span class="chip" *ngIf="mentionsCount">{{ mentionsCount }}</span>
        </button>
      </div>

      <div *ngSwitchCase="'underline'" class="tabs tabs--underline" role="tablist" aria-label="Notification filters">
        <button role="tab" class="tab" [attr.aria-selected]="activeTab==='ALL'" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')" (keydown)="onTabKey($event, 'ALL')">
          <mat-icon>notifications_active</mat-icon><span> All</span>
        </button>
        <button role="tab" class="tab" [attr.aria-selected]="activeTab==='MENTIONS'" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')" (keydown)="onTabKey($event, 'MENTIONS')">
          <mat-icon>alternate_email</mat-icon><span> Mentions</span>
        </button>
        <div class="slider" [style.transform]="activeTab==='ALL' ? 'translateX(0%)' : 'translateX(100%)'"></div>
      </div>

      <div *ngSwitchCase="'segmented'" class="tabs tabs--segmented" role="tablist" aria-label="Notification filters">
        <button role="tab" class="seg" [attr.aria-selected]="activeTab==='ALL'" [class.active]="activeTab==='ALL'" (click)="setTab('ALL')" (keydown)="onTabKey($event, 'ALL')">
          <mat-icon>notifications_active</mat-icon><span> All</span>
        </button>
        <button role="tab" class="seg" [attr.aria-selected]="activeTab==='MENTIONS'" [class.active]="activeTab==='MENTIONS'" (click)="setTab('MENTIONS')" (keydown)="onTabKey($event, 'MENTIONS')">
          <mat-icon>alternate_email</mat-icon><span> Mentions</span>
        </button>
      </div>
    </ng-container>

    <div class="actions">
      <button mat-button class="mark-all" (click)="markAllAsRead()" [disabled]="unreadCount()===0" aria-label="Mark all as read">
        <mat-icon>done_all</mat-icon>
        Mark all
        <span class="badge" *ngIf="unreadCount()>0">{{ unreadCount() }}</span>
      </button>
      <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="More options"><mat-icon>more_horiz</mat-icon></button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="refresh()"><mat-icon>refresh</mat-icon><span>Refresh</span></button>
        <button mat-menu-item (click)="toggleInfinite()">
          <mat-icon>{{ infiniteScroll ? 'swap_vert' : 'vertical_align_bottom' }}</mat-icon>
          <span>{{ infiniteScroll ? 'Disable infinite scroll' : 'Enable infinite scroll' }}</span>
        </button>
      </mat-menu>
    </div>
  </div>

  <ng-container *ngIf="!loadingInitial && filtered().length === 0">
    <div class="empty" role="status" aria-live="polite">
      <div class="empty-illustration">
        <mat-icon class="empty-icon">{{ emptyState.icon }}</mat-icon>
      </div>
      <div class="empty-title">{{ emptyState.title }}</div>
      <div class="empty-sub">{{ emptyState.sub }}</div>
      <div class="empty-cta">
        <button mat-stroked-button (click)="refresh()"><mat-icon>refresh</mat-icon>Refresh</button>
        <button mat-stroked-button color="primary" (click)="goExplore()"><mat-icon>travel_explore</mat-icon>Explore</button>
      </div>
    </div>
  </ng-container>

  <div *ngIf="loadingInitial" class="list" aria-busy="true" aria-live="polite">
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

        <a class="avatar" *ngIf="n.type !== 'RESTRICT'"
           (click)="navigateToProfile(n.lastActorUsername); $event.stopPropagation()"
           tabindex="-1" aria-label="Open profile">
          <img
            [src]="processProfilePicture(n.lastActorProfilePicture)"
            (error)="onImageError($event, 'assets/ProfileAvatar.png')"
            alt="Avatar"
            loading="lazy"
          />
        </a>
      </div>

      <div class="content">
        <div class="row-1" *ngIf="n.type === 'RESTRICT'; else normalLine">
          <span class="sys-badge">System</span>
          <span class="action">&nbsp;We decided to restrict your account due to your violations.</span>
        </div>

        <ng-template #normalLine>
          <div class="row-1">
            <button
              class="actor-link"
              *ngIf="n.actorDisplayNames?.length; else fallbackHandle"
              mat-button
              (click)="navigateToProfile(n.lastActorUsername); $event.stopPropagation()"
              aria-label="Open profile"
            >
              <mat-icon aria-hidden="true">person</mat-icon>
              <strong>{{ n.actorDisplayNames[0] }}</strong>
            </button>

            <ng-template #fallbackHandle>
              <button
                class="actor-link"
                *ngIf="n.lastActorUsername"
                mat-button
                (click)="navigateToProfile(n.lastActorUsername); $event.stopPropagation()"
                aria-label="Open profile"
              >
                <mat-icon aria-hidden="true">person</mat-icon>
                <strong>{{ '@'+n.lastActorUsername }}</strong>
              </button>
            </ng-template>

            <span class="co-actors" *ngIf="coActorsText(n)">&nbsp;{{ coActorsText(n) }}</span>

            <span class="action">&nbsp;{{ actionText(n) }}</span>

            <ng-container *ngIf="n.statusId">
              <a class="status-link" [routerLink]="['/status', n.statusId]" (click)="$event.stopPropagation()">
                {{ n.statusContent ? ('“' + clamp(n.statusContent, 120) + '”') : 'your status' }}
              </a>
            </ng-container>
          </div>
        </ng-template>

        <div class="row-2">
          <mat-icon class="time-icon" aria-hidden="true">schedule</mat-icon>
          <span class="time">{{  n.lastUpdatedAt  |  timeAgo  }}</span>
          <span class="dot" *ngIf="isUnread(n)"></span>

          <button
            mat-stroked-button
            class="mark-one"
            *ngIf="isUnread(n)"
            (click)="markOneAsRead(n); $event.stopPropagation()"
            aria-label="Mark as read"
          ><mat-icon>done</mat-icon>Mark read</button>
        </div>
      </div>
    </article>
  </div>
</div>
  `,
  styles: [`
:host { display:block; }
.notif-root {
  --bg: #fff; --fg: #0f1419; --muted: #536471; --soft: #f2f5f7; --border: rgba(0,0,0,0.08);
  --brand: #1d9bf0; --brand-weak: rgba(29,155,240,.10); --card:#ffffff; --like:#f91880; --ok:#00ba7c; --warn:#ff7a00;
  width: 100%; height: 100%; color: var(--fg); background: var(--bg);
}
.toolbar { position: sticky; top: 0; z-index: 5; display:flex; align-items:center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; padding: .75rem 1rem; backdrop-filter: blur(10px); background: color-mix(in srgb, var(--bg) 82%, transparent); border-bottom: 1px solid var(--border); }
.toolbar::after{ content:''; position:absolute; inset:auto 0 0 0; height:2px; background: linear-gradient(90deg, transparent, var(--brand), transparent); opacity:.25; }
.title-wrap { display:flex; align-items:baseline; gap:.5rem; }
.title { margin:0; font-size:1.35rem; font-weight:900; letter-spacing:.2px; display:flex; align-items:center; gap:.4rem; }
.title-icon { transform: translateY(1px); }
.sub { color: var(--muted); font-size:.9rem; }
.tabs { display:flex; align-items:center; gap:.5rem; }
.tab, .seg { border:0; background:transparent; cursor:pointer; font-weight:700; letter-spacing:.2px; display:flex; align-items:center; gap:.45rem; }
.tab:focus-visible, .seg:focus-visible, .mark-all:focus-visible, .load-more:focus-visible, .actor-link:focus-visible { outline: 3px solid color-mix(in srgb, var(--brand) 50%, transparent); outline-offset: 2px; border-radius: 10px; }
.tabs--pill .tab { padding:.5rem 1rem; border-radius:999px; transition: all .18s; color: var(--muted); }
.tabs--pill .tab:hover { background: var(--brand-weak); color: var(--fg); }
.tabs--pill .tab.active { background: rgba(29,155,240,.18); color: var(--fg); box-shadow: inset 0 0 0 1px rgba(29,155,240,.28); }
.tabs--underline { position:relative; gap:1.25rem; }
.tabs--underline .tab { padding:.6rem .5rem; color: var(--muted); }
.tabs--underline .tab.active { color: var(--fg); }
.tabs--underline .slider { position:absolute; left:0; bottom:0; width:50%; height:2px; background: var(--brand); border-radius:2px; transition: transform .2s ease; }
.tabs--segmented { background: var(--soft); border: 1px solid var(--border); border-radius: 999px; padding: .2rem; gap:.2rem; }
.seg { border-radius:999px; padding:.38rem 1rem; font-weight:800; color: var(--muted); }
.seg.active { background:#fff; color: var(--fg); box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.list { padding:.25rem 0; }
.card { display:flex; gap:.85rem; padding: .9rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .15s ease, transform .06s ease; background: var(--card); }
.card:hover { background: rgba(29,155,240,.05); }
.card:active { transform: translateY(1px); }
.card.unread { background: rgba(29,155,240,.08); }
.left { display:flex; align-items:flex-start; gap:.7rem; }
.type-icon { width: 38px; height: 38px; min-width:38px; border-radius: 12px; display:grid; place-items:center; background: rgba(29,155,240,.12); }
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
.co-actors { color: var(--muted); }
.action { color: var(--muted); margin-left:.1rem; }
.status-link { margin-left:.25rem; color: var(--brand); text-decoration: none; }
.status-link:hover { text-decoration: underline; }
.sys-badge{margin-right:.35rem;padding:.1rem .4rem;border-radius:6px;font-size:.72rem;background:var(--warn);color:#000;font-weight:800;}
.row-2 { margin-top:.35rem; display:flex; align-items:center; gap:.35rem; font-size:.82rem; color: var(--muted); }
.time-icon { font-size:16px; width:16px; height:16px; }
.dot { width:6px; height:6px; border-radius:999px; background: var(--brand); margin: 0 .25rem; }
.mark-one { margin-left:auto; line-height:1.6; padding: 0 .6rem; }
.empty { padding: 3rem 1rem; display:grid; place-items:center; text-align:center; gap:.75rem; }
.empty-icon { font-size:56px; width:56px; height:56px; opacity:.8; }
.empty-title { font-weight:900; font-size:1.1rem; }
.empty-sub { color: var(--muted); }
.empty-cta { display:flex; gap:.5rem; margin-top:.5rem; justify-content:center; }
.skeleton { pointer-events: none; }
.sk { background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06)); background-size: 200% 100%; animation: shimmer 1.1s infinite linear; }
@keyframes shimmer { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }
.skeleton .type-icon { border-radius:12px; }
.skeleton .avatar { width:44px; height:44px; border-radius:12px; background:transparent; }
.skeleton .avatar::before { content:''; display:block; width:44px; height:44px; border-radius:12px; background:rgba(0,0,0,0.08); }
.line { height:12px; border-radius:6px; margin:.35rem 0; }
.w-70{ width:70%; } .w-50{ width:50%; }
.footer { display:grid; place-items:center; padding: .75rem 0 1.25rem; }
.load-more { font-weight:800; }
.sentinel { width:100%; height: 1px; }
.foot-note { color: var(--muted); font-size:.8rem; display:flex; align-items:center; gap:.35rem; }
.append-spinner { display:flex; gap:.6rem; align-items:center; justify-content:center; padding: .8rem 0 1.4rem; color: var(--muted); }
.append-spinner .spinner { width:14px; height:14px; border-radius:999px; }
@media (prefers-color-scheme: dark){
  .notif-root { --bg:#0b1218; --fg:#e6e9ef; --muted:#8b98a5; --soft:#121a22; --border: rgba(255,255,255,0.08); --card:#0f1720; --brand:#1d9bf0; }
  .seg.active { background: var(--soft); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
  .card:hover{ background: rgba(29,155,240,.07); }
  .card.unread{ background: rgba(29,155,240,.12); }
}
  `]
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() notifications: NotificationDto[] = [];
  @Input() headerStyle: HeaderStyle = 'pill';

  page = 0;
  pageSize = 10;
  allPagesLoaded = false;
  loadingInitial = true;
  loadingMore = false;
  infiniteScroll = true;
  activeTab: TabKey = 'ALL';
  skeletonItems = Array.from({ length: 6 });

  private io?: IntersectionObserver;
  private destroyed = false;

  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLDivElement>;
  private snack = inject(MatSnackBar);

  constructor(private notificationService: NotificationService, private router: Router) { }

  ngOnInit(): void { this.resetAndLoad(); }
  ngAfterViewInit(): void { this.setupObserver(); }
  ngOnDestroy(): void { this.destroyed = true; this.io?.disconnect(); }

  @HostListener('window:keydown', ['$event'])
  handleArrowSwitch(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const next: TabKey = (this.activeTab === 'ALL') ? 'MENTIONS' : 'ALL';
      this.setTab(next);
    }
  }
  onEsc() { }
  onTabKey(e: KeyboardEvent, tab: TabKey) { if (e.key === 'Enter' || e.key === ' ') this.setTab(tab); }

  refresh(): void { this.resetAndLoad(true); }
  toggleInfinite(): void { this.infiniteScroll = !this.infiniteScroll; this.setupObserver(); }

  get mentionsCount(): number {
    return this.notifications.filter(n => n.type === 'MENTION' && this.isUnread(n)).length;
  }

  get emptyState() {
    return this.activeTab === 'MENTIONS'
      ? { icon: 'alternate_email', title: 'No mentions yet', sub: 'When someone @mentions you, it’ll show up here.' }
      : { icon: 'notifications_none', title: 'You’re all caught up', sub: 'Likes, replies, follows, and other activity will appear here.' };
  }

  private resetAndLoad(showToast = false): void {
    this.loadingInitial = true;
    this.loadingMore = false;
    this.allPagesLoaded = false;
    this.page = 0;
    this.notifications = [];
    this.loadPage(this.page, false, showToast);
  }

  loadNextPage(): void {
    if (this.loadingMore || this.allPagesLoaded) return;
    this.page += 1;
    this.loadPage(this.page, true);
  }

  private loadPage(page: number, append: boolean, showToast = false): void {
    if (append) this.loadingMore = true;
    this.notificationService.getNotifications(page).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
        const merged = append ? [...this.notifications, ...list] : list;
        const dedup = new Map<string | number, NotificationDto>();
        for (const n of merged) dedup.set(n.id as any, n);
        this.notifications = Array.from(dedup.values());
        if (list.length < this.pageSize) this.allPagesLoaded = true;
        this.loadingInitial = false;
        this.loadingMore = false;
        queueMicrotask(() => this.setupObserver());
        if (showToast) this.snack.open('Feed refreshed', 'OK', { duration: 1500 });
      },
      error: (err) => {
        console.error('Failed to fetch notifications', err);
        if (append) this.page = Math.max(0, this.page - 1);
        this.loadingInitial = false;
        this.loadingMore = false;
        queueMicrotask(() => this.setupObserver());
        this.snack.open('Couldn’t load notifications', 'Dismiss', { duration: 2500 });
      }
    });
  }

  private setupObserver(): void {
    this.io?.disconnect();
    this.io = undefined;
    if (!this.infiniteScroll || this.allPagesLoaded) return;
    this.io = new IntersectionObserver((entries) => {
      if (this.loadingMore || this.allPagesLoaded) return;
      for (const e of entries) {
        if (e.isIntersecting) { this.loadNextPage(); break; }
      }
    }, { root: null, rootMargin: '600px 0px', threshold: 0 });
    const tryObserve = (attempt = 0) => {
      if (this.destroyed || !this.io) return;
      const el = this.sentinelRef?.nativeElement;
      if (el) { this.io.observe(el); }
      else if (attempt < 20) { requestAnimationFrame(() => tryObserve(attempt + 1)); }
    };
    tryObserve();
  }

  setTab(tab: TabKey) { if (this.activeTab !== tab) this.activeTab = tab; }
  filtered(): NotificationDto[] {
    const base = this.activeTab === 'MENTIONS'
      ? this.notifications.filter(n => n.type === 'MENTION')
      : this.notifications;
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
        this.snack.open('All notifications marked as read', 'OK', { duration: 1800 });
      },
      error: () => this.snack.open('Failed to mark all as read', 'Dismiss', { duration: 2200 })
    });
  }

  markOneAsRead(n: NotificationDto): void {
    if (!this.isUnread(n)) return;
    this.notificationService.markAsRead([n.id]).subscribe({
      next: () => { n.groupingState = 'READ'; },
      error: () => this.snack.open('Failed to mark as read', 'Dismiss', { duration: 2000 })
    });
  }

  open(n: NotificationDto): void {
    if (n.type === 'RESTRICT') {
      if (this.isUnread(n)) this.markOneAsRead(n);
      return;
    }
    if (n.statusId) { this.router.navigate(['/status', n.statusId]); }
    else if (n.lastActorUsername) { this.navigateToProfile(n.lastActorUsername); }
    if (this.isUnread(n)) this.markOneAsRead(n);
  }

  navigateToProfile(username?: string | null): void {
    if (!username) return;
    this.router.navigate(['/', username]);
  }

  goExplore() { this.router.navigate(['/explore']); }

  trackById(_: number, n: NotificationDto) { return n.id; }

  processProfilePicture(base64: string | null): string {
    if (!base64 || base64.trim().length === 0) return 'assets/ProfileAvatar.png';
    return base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
  }
  onImageError(event: Event, fallback: string): void { (event.target as HTMLImageElement).src = fallback; }

  ariaLabel(n: NotificationDto): string {
    if (n.type === 'RESTRICT') return 'We decided to restrict your account due to your violations.';
    const first = n.actorDisplayNames?.[0] ? n.actorDisplayNames[0] : (n.lastActorUsername ? `@${n.lastActorUsername}` : 'Someone');
    const rest = this.coActorsText(n);
    return `${[first, rest].filter(Boolean).join(' ')} ${this.actionText(n)}`.trim();
  }

  actionText(n: NotificationDto): string {
    switch (n.type) {
      case 'LIKE': return 'liked your post';
      case 'REPLY': return 'replied to your post';
      case 'MENTION': return 'mentioned you in';
      case 'FOLLOW': return 'followed you';
      case 'RESTRICT': return 'system notice';
      default: return n.type?.toLowerCase() ?? 'activity';
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

  coActorsText(n: NotificationDto): string {
    const names = (n.actorDisplayNames ?? []).filter(Boolean).map(s => String(s).trim());
    if (names.length === 0) return '';

    const total = Number.isFinite(n.actorCount as any) ? Math.max(0, n.actorCount) : names.length;

    // we already show names[0] as the main actor; show up to two more
    const remaining = names.slice(1, 3);
    const others = Math.max(0, total - 3);
    const otherLabel = others === 1 ? 'other' : 'others';

    // build the "and ..." phrase
    let base =
      remaining.length === 0 ? '' :
        remaining.length === 1 ? `, ${remaining[0]}` :
          `, ${remaining[0]}, ${remaining[1]}`;

    // append the "+ N others" suffix if there are more than 3 total
    if (others > 0) {
      // if no remaining names (edge case), still show the others
      base = base ? `${base} + ${others} ${otherLabel}` : `and ${others} ${otherLabel}`;
    }

    return base;
  }

  clamp(text: string, max = 120): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
}
