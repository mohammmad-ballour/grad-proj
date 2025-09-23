import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { StatusReactionService } from '../services/status-reaction.service';
import { StatusActionDto } from '../models/ReactToStatusRequestDto';

@Component({
  selector: 'app-status-action-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
      <!-- Actions -->
      <mat-card-actions class="actions">
        <button mat-button class="action-btn" (click)="toggleLike()">
          <i class="bi" [ngClass]="statusAction.liked ? 'bi-heart-fill liked' : 'bi-heart'"></i>
          {{ statusAction.numLikes }}
        </button>
        <button mat-button class="action-btn">
          <i class="bi bi-chat"></i> {{ statusAction.numReplies }}
        </button>
        <button mat-button class="action-btn">
          <i class="bi bi-repeat"></i> {{ statusAction.numShares }}
        </button>
        <button mat-button class="action-btn" (click)="toggleSave()">
          <i class="bi" [ngClass]="statusAction.saved ? 'bi-bookmark-fill saved' : 'bi-bookmark'"></i>
        </button>
        <button mat-button class="action-btn" [matMenuTriggerFor]="shareMenu">
         <i class="bi bi-upload"></i>
        </button>
        <mat-menu #shareMenu="matMenu">
          <button mat-menu-item (click)="copyLink()"> <i class="bi bi-link-45deg"></i> Copy link </button>
          <button mat-menu-item (click)="shareVia()"> <i class="bi bi-share-fill"></i> Share via </button>
        </mat-menu>
      </mat-card-actions>
  `,
  styles: [
    `
      /* Actions */
      .actions {
        display: flex;
        justify-content: space-around;
        padding: 8px 0 0;
        border-top: 1px solid #e6ecf0;
        margin-top: 8px;
      }
      .action-btn {
        font-size: 13px;
        color: #657786;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .action-btn:hover {
        color: #1da1f2;
        background: none;
      }
      .liked {
        color: #e0245e !important;
      }
      .saved {
        color: #1da1f2 !important;
      }
    `,
  ],
})
export class StatusActionCardComponent {
  @Input() statusAction!: StatusActionDto;
  @Output() statusActionChange = new EventEmitter<StatusActionDto>();

  constructor(public reactionService: StatusReactionService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['statusAction']) {
      console.log('statusAction changed:', this.statusAction);
    }
  }

  toggleLike() {
    const request = {
      statusId: this.statusAction.statusId,
      statusOwnerId: this.statusAction.statusOwnerId
    };

    // Create optimistic update
    const updated = {
      ...this.statusAction,
      liked: !this.statusAction.liked,
      numLikes: this.statusAction.liked
        ? this.statusAction.numLikes - 1
        : this.statusAction.numLikes + 1
    };

    // Emit immediately so UI updates
    this.statusActionChange.emit(updated);

    if (this.statusAction.liked) {
      this.reactionService.unlikeStatus(request).subscribe({
        next: () => {
          console.log('unlike')
        },
        error: () => this.statusActionChange.emit(this.statusAction) // rollback on error
      });
    } else {
      this.reactionService.likeStatus(request).subscribe({
        next: () => {
          console.log('like')
        },
        error: () => this.statusActionChange.emit(this.statusAction) // rollback on error
      });
    }
  }

  toggleSave() {
    this.statusAction.saved = this.statusAction.saved;
    // const request = {
    //   statusId: this.statusAction.statusId,
    //   statusOwnerId: this.statusAction.statusOwnerId
    // };

    // // Create optimistic update
    // const updated = {
    //   ...this.statusAction,
    //   saved: !this.statusAction.saved
    // };

    // // Emit immediately so UI updates
    // this.statusActionChange.emit(updated);

    // if (this.statusAction.saved) {
    //   this.reactionService.unsaveStatus(request).subscribe({
    //     next: () => {
    //       console.log('unsave')
    //     },
    //     error: () => this.statusActionChange.emit(this.statusAction) // rollback on error
    //   });
    // } else {
    //   this.reactionService.saveStatus(request).subscribe({
    //     next: () => {
    //       console.log('save')
    //     },
    //     error: () => this.statusActionChange.emit(this.statusAction) // rollback on error
    //   });
    // }
  }

  copyLink() {
    const url = `https://x.com/user/status/${this.statusAction.statusId}`; // Adjust base URL as needed, assuming placeholder
    navigator.clipboard.writeText(url).then(() => {
      console.log('Link copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy link', err);
    });
  }

  shareVia() {
    const url = `https://x.com/user/status/${this.statusAction.statusId}`; // Adjust base URL as needed, assuming placeholder
    const text = 'Check out this post on X:';
    const title = 'Share Post';

    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url
      }).then(() => {
        console.log('Shared successfully');
      }).catch(err => {
        console.error('Error sharing', err);
        // Fallback to copying link
        this.copyLink();
      });
    } else {
      console.log('Web Share API not supported, falling back to copy link');
      this.copyLink();
    }
  }
}