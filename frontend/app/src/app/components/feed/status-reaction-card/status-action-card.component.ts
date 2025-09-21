import { Component, Input, ChangeDetectorRef } from '@angular/core';
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


  constructor(private cdr: ChangeDetectorRef,
    public reactionService: StatusReactionService
  ) {
    console.log(this.statusAction)

  }
  ngOnInit() {
    console.log(this.statusAction)
  }

  toggleLike() {
    const request = {
      statusId: this.statusAction.statusId,          // the post/status ID
      statusOwnerId: this.statusAction.statusOwnerId // the user who owns the status
    };
    console.log('test')
    console.log(this.statusAction.liked)

    if (this.statusAction.liked) {
      this.reactionService.unlikeStatus(request).subscribe({
        next: () => this.statusAction.liked = false,
        complete() {
          console.log('unlike')
        },
      });
    } else {
      this.reactionService.likeStatus(request).subscribe({
        next: () => this.statusAction.liked = true
        , complete() {
          console.log('like')
        }
      });
    }
  }

}