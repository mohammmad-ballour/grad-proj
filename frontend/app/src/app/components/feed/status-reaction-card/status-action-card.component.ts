import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatusReactionService } from '../services/status-reaction.service';
import { StatusActionDto } from '../models/ReactToStatusRequestDto';

@Component({
  selector: 'app-status-action-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
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
    `,
  ],
})
export class StatusActionCardComponent {
  @Input() statusAction!: StatusActionDto;
  @Output() statusActionChange = new EventEmitter<StatusActionDto>();

  constructor(public reactionService: StatusReactionService) {

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
}
