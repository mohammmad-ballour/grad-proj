import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusReactionService } from '../services/status-reaction.service';
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { StatusServices } from '../services/status.services';
import { ReplySnippet, StatusResponse } from '../models/StatusWithRepliesResponseDto';
import { ReplyDialogComponent } from './reply-dialog-component/reply-dialog-component.component';
import { ShareDialogComponent } from './share-dialog.component/share-dialog.component.component';


@Component({
  selector: 'app-status-action-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
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
          <button mat-menu-item (click)="repost()">
            <i class="bi bi-arrow-repeat"></i> Repost
          </button>
          <button mat-menu-item (click)="openShareDialog()">
            <i class="bi bi-chat-square-quote"></i> Quote
          </button>
        </mat-menu>
      }

      <!-- save -->
      <button mat-button class="action-btn" (click)="toggleSave()">
        <i class="bi" [ngClass]="statusAction.saved ? 'bi-bookmark-fill saved' : 'bi-bookmark'"></i>
      </button>

      <!-- external share menu -->
      <button mat-button class="action-btn" [matMenuTriggerFor]="shareMenu">
        <i class="bi bi-upload"></i>
      </button>
      <mat-menu #shareMenu="matMenu">
        <button mat-menu-item (click)="copyLink()"> <i class="bi bi-link-45deg"></i> Copy link </button>
        <button mat-menu-item (click)="shareVia()"> <i class="bi bi-share-fill"></i> Share via DM</button>
      </mat-menu>
    </mat-card-actions>
  `,
  styles: [`
    .actions { display:flex; justify-content: space-around; padding:8px 0 0; border-top:1px solid #e6ecf0; margin-top:8px; }
    .action-btn { font-size:13px; color:#657786; display:flex; align-items:center; gap:4px; }
    .action-btn:hover { color:#1da1f2; background:none; }
    .liked { color:#e0245e !important; }
    .saved { color:#1da1f2 !important; }
  `],
})
export class StatusActionCardComponent {
  @Input() statusAction!: StatusActionDto;
  @Input() parentStatus!: StatusResponse;
  @Input() reply!: ReplySnippet;
  @Output() statusActionChange = new EventEmitter<StatusActionDto>();

  constructor(
    public reactionService: StatusReactionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private statusServices: StatusServices
  ) { }

  ngOnChanges(_: SimpleChanges) { }

  openReplyDialog(): void {
    const dialogRef = this.dialog.open(ReplyDialogComponent, {
      width: '500px',
      data: { parentStatus: this.parentStatus ?? this.reply, statusAction: this.statusAction }
    });
    dialogRef.afterClosed().subscribe(ok => {
      if (ok) {
        this.statusActionChange.emit({ ...this.statusAction, numReplies: this.statusAction.numReplies + 1 });
      }
    });
  }

  openShareDialog(): void {
    const dialogRef = this.dialog.open(ShareDialogComponent, {
      width: '560px',
      data: { statusAction: this.statusAction }
    });
    dialogRef.afterClosed().subscribe(ok => {
      if (ok) {
        this.statusActionChange.emit({ ...this.statusAction, numShares: this.statusAction.numShares + 1 });
      }
    });
  }

  repost(): void {
    // optimistic update
    const optimistic = { ...this.statusAction, numShares: this.statusAction.numShares + 1 };
    this.statusActionChange.emit(optimistic);

    // create a "share with no comment"
    this.statusServices.createStatus({
      content: '', // no comment
      privacy: this.statusAction.privacy,
      replyAudience: this.statusAction.replyAudience,
      shareAudience: this.statusAction.shareAudience,
      parentStatus: {
        statusId: this.statusAction.statusId,
        statusOwnerId: this.statusAction.statusOwnerId,
        parentAssociation: 'SHARE'
      }
    }, undefined).subscribe({
      next: () => { },
      error: () => this.statusActionChange.emit(this.statusAction) // rollback
    });
  }

  toggleLike() {
    const request = { statusId: this.statusAction.statusId, statusOwnerId: this.statusAction.statusOwnerId };
    const updated = {
      ...this.statusAction,
      liked: !this.statusAction.liked,
      numLikes: this.statusAction.liked ? this.statusAction.numLikes - 1 : this.statusAction.numLikes + 1
    };
    this.statusActionChange.emit(updated);

    (this.statusAction.liked
      ? this.reactionService.unlikeStatus(request)
      : this.reactionService.likeStatus(request)
    ).subscribe({
      next: () => { },
      error: () => this.statusActionChange.emit(this.statusAction)
    });
  }

  toggleSave() {
    this.statusAction.saved = !this.statusAction.saved;
    this.snackBar.open(this.statusAction.saved ? 'Post saved' : 'Post unsaved', 'Close', { duration: 2000 });
  }

  private xUrl() { return `https://x.com/user/status/${this.statusAction.statusId}`; }

  copyLink() {
    navigator.clipboard.writeText(this.xUrl()).catch(err => console.error('Failed to copy link', err));
  }

  shareVia() {
    const url = this.xUrl(), text = 'Check out this post on X:', title = 'Share Post';
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => this.copyLink());
    } else {
      this.copyLink();
    }
  }
}
