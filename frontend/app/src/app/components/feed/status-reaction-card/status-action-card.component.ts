import { Component, Input, Output, EventEmitter, SimpleChanges, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, EMPTY, Subscription } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';

import { StatusReactionService } from '../services/status-reaction.service';
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { StatusServices } from '../services/status.services';
import { ReplySnippet, StatusResponse } from '../models/StatusWithRepliesResponseDto';
import { ReplyDialogComponent } from './reply-dialog-component/reply-dialog-component.component';
import { ShareDialogComponent } from './share-dialog.component/share-dialog.component.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-status-action-card',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <mat-card-actions class="actions">
      <!-- like -->
      <button mat-button class="action-btn" (click)="toggleLike()">
        <i class="bi" [ngClass]="statusAction.liked ? 'bi-heart-fill liked' : 'bi-heart'"></i>
        {{ statusAction.numLikes }}
      </button>

      <!-- reply -->
      @if (statusAction.isCurrentUserAllowedToReply) {
        <button mat-button class="action-btn" (click)="openReplyDialog()">
          <i class="bi bi-chat"></i> {{ statusAction.numReplies }}
        </button>
      }

      <!-- share (X-style) -->
      @if (statusAction.isCurrentUserAllowedToShare) {
        <button mat-button class="action-btn" [matMenuTriggerFor]="reshareMenu">
          <i class="bi bi-repeat"></i> {{ statusAction.numShares }}
        </button>
        <mat-menu #reshareMenu="matMenu">
          <button mat-menu-item (click)="repost()"><i class="bi bi-arrow-repeat"></i> Repost</button>
          <button mat-menu-item (click)="openShareDialog()"><i class="bi bi-chat-square-quote"></i> Quote</button>
        </mat-menu>
      }

      <!-- X-like Bookmarks -->
      <button
        mat-button
        class="action-btn bookmark-btn"
        [class.bump]="saveBump"
        (click)="onSaveClick()"
        
        [matTooltip]="statusAction.isSavedToBookmarks ? 'Remove Bookmark' : 'Bookmark'"
        [attr.aria-label]="statusAction.isSavedToBookmarks ? 'Remove Bookmark' : 'Bookmark'">
        <i class="bi" [ngClass]="statusAction.isSavedToBookmarks ? 'bi-bookmark-fill saved' : 'bi-bookmark'"></i>
      </button>

      <!-- external share -->
      <button mat-button class="action-btn" [matMenuTriggerFor]="shareMenu">
        <i class="bi bi-upload"></i>
      </button>
      <mat-menu #shareMenu="matMenu">
        <button mat-menu-item (click)="copyLink()"><i class="bi bi-link-45deg"></i> Copy link</button>
        <button mat-menu-item (click)="shareVia()"><i class="bi bi-share-fill"></i> Share via DM</button>
      </mat-menu>
    </mat-card-actions>
  `,
  styles: [`
    .actions { display:flex; justify-content: space-around; padding:8px 0 0; border-top:1px solid #e6ecf0; margin-top:8px; }
    .action-btn { font-size:13px; color:#657786; display:flex; align-items:center; gap:4px; }
    .action-btn:hover { color:#1da1f2; background:none; }
    .liked { color:#e0245e !important; }
    .saved { color:#1da1f2 !important; }

    /* subtle pop like X when toggling bookmark */
    .bookmark-btn.bump { animation: bump 160ms ease-out; }
    @keyframes bump {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `],
})
export class StatusActionCardComponent implements OnInit, OnDestroy {
  @Input() statusAction!: StatusActionDto;
  @Input() parentStatus!: StatusResponse;
  @Input() reply!: ReplySnippet;
  @Output() statusActionChange = new EventEmitter<StatusActionDto>();

  isSaving = false;
  private saveIntent$ = new Subject<boolean>();   // latest desired saved state
  private saveSub?: Subscription;
  saveBump = false;                               // tiny animation flag

  constructor(
    public reactionService: StatusReactionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private statusServices: StatusServices
  ) { }

  ngOnInit(): void {
    // Coalesce rapid taps: always perform the LAST intent
    this.saveSub = this.saveIntent$
      .pipe(
        switchMap((desired: boolean) => {
          // already in desired state? nothing to do.
          if (this.statusAction.isSavedToBookmarks === desired) return EMPTY;

          this.isSaving = true;

          const req$ = desired
            ? this.reactionService.bookmarkStatus(this.statusAction.statusId)   // POST /api/bookmarks/{statusId}
            : this.reactionService.unbookmarkStatus(this.statusAction.statusId) // DELETE /api/bookmarks/{statusId}
            ;

          return req$.pipe(
            catchError((err: HttpErrorResponse) => {
              // Treat idempotent conditions as success to mimic X:
              //  - trying to bookmark an already-bookmarked post → 409
              //  - trying to unbookmark a non-bookmarked post → 404
              if (err?.status === 409 || err?.status === 404) {
                return EMPTY; // swallow as success
              }
              // hard error → rollback UI and notify
              this.statusActionChange.emit({ ...this.statusAction, isSavedToBookmarks: !desired });
              this.snackBar.open('Couldn’t update Bookmark. Try again.', 'Close', { duration: 2000 });
              return EMPTY;
            }),
            finalize(() => { this.isSaving = false; })
          );
        })
      )
      .subscribe(() => {
        // on success, show minimal toast like X
        this.snackBar.dismiss(); // avoid stacking
        this.snackBar.open(
          this.statusAction.isSavedToBookmarks ? 'Added to Bookmarks' : 'Removed from Bookmarks',
          'Close',
          { duration: 1200 }
        );
      });
  }

  ngOnDestroy(): void {
    this.saveSub?.unsubscribe();
  }

  // ====== ONLY SAVE FLOW CHANGED BELOW ======
  onSaveClick(): void {
    // Optimistic flip + tiny bump animation
    const nextSaved = !this.statusAction.isSavedToBookmarks;
    this.statusActionChange.emit({ ...this.statusAction, isSavedToBookmarks: nextSaved });

    this.bumpOnce();

    // Emit desired final state; switchMap ensures last tap wins
    this.saveIntent$.next(nextSaved);
  }

  private bumpOnce() {
    this.saveBump = false;
    // next microtask ensures the class re-applies
    queueMicrotask(() => { this.saveBump = true; setTimeout(() => this.saveBump = false, 180); });
  }
  // ==========================================

  // ---------- the rest of your component is unchanged ----------
  ngOnChanges(_: SimpleChanges) { }

  openReplyDialog(): void {
    const ref = this.dialog.open(ReplyDialogComponent, {
      width: '500px',
      data: { parentStatus: this.parentStatus ?? this.reply, statusAction: this.statusAction }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.statusActionChange.emit({ ...this.statusAction, numReplies: this.statusAction.numReplies + 1 });
      }
    });
  }

  openShareDialog(): void {
    const ref = this.dialog.open(ShareDialogComponent, {
      width: '560px',
      data: { statusAction: this.statusAction }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.statusActionChange.emit({ ...this.statusAction, numShares: this.statusAction.numShares + 1 });
      }
    });
  }

  repost(): void {
    const optimistic = { ...this.statusAction, numShares: this.statusAction.numShares + 1 };
    this.statusActionChange.emit(optimistic);
    this.statusServices.createStatus({
      content: '',
      privacy: this.statusAction.privacy,
      replyAudience: this.statusAction.replyAudience,
      shareAudience: this.statusAction.shareAudience,
      parentStatus: { statusId: this.statusAction.statusId, statusOwnerId: this.statusAction.statusOwnerId, parentAssociation: 'SHARE' }
    }, undefined).subscribe({
      next: () => { },
      error: () => this.statusActionChange.emit(this.statusAction)
    });
  }

  toggleLike() {
    const req = { statusId: this.statusAction.statusId, statusOwnerId: this.statusAction.statusOwnerId };
    const updated = {
      ...this.statusAction,
      liked: !this.statusAction.liked,
      numLikes: this.statusAction.liked ? this.statusAction.numLikes - 1 : this.statusAction.numLikes + 1
    };
    this.statusActionChange.emit(updated);
    (this.statusAction.liked ? this.reactionService.unlikeStatus(req) : this.reactionService.likeStatus(req))
      .subscribe({ error: () => this.statusActionChange.emit(this.statusAction) });
  }

  private xUrl() { return `https://x.com/user/status/${this.statusAction.statusId}`; }
  copyLink() { navigator.clipboard.writeText(this.xUrl()).catch(() => { }); }
  shareVia() {
    const url = this.xUrl(), text = 'Check out this post on X:', title = 'Share Post';
    if (navigator.share) navigator.share({ title, text, url }).catch(() => this.copyLink());
    else this.copyLink();
  }
}

