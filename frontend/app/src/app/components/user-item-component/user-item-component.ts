import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-item',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="user-item">
      <div class="user-info">
        <img  
          [src]="showImage(user.profilePicture)"
          alt="{{ user.displayName }}"
          width="40" height="40" />
        <div class="user-details">
          <span class="user-name">{{ user.displayName }}</span>
          <span class="profile-bio">{{ user.profileBio }}</span>
        </div>
      </div>

      <button 
        mat-flat-button 
        color="primary" 
        class="follow-btn"
        (click)="handleClick()"
        [disabled]="isLoading && currentUserId === user.userId">
        
        @if (isLoading && currentUserId === user.userId) {
          <mat-progress-spinner 
            diameter="18" 
            strokeWidth="3" 
            mode="indeterminate" 
            color="accent"
            class="follow-spinner">
          </mat-progress-spinner>
        } @else {
          <span>{{ isBeingFollowed ? 'Unfollow' : 'Follow' }}</span>
        }
      </button>
    </div>
  `,
  styles: [`
    .user-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .user-info { display: flex; align-items: center; }
    .user-details { margin-left: 10px; display: flex; flex-direction: column; }
    .user-name { font-weight: bold; }
    .profile-bio { font-size: 0.85em; color: gray; }
    .follow-btn { min-width: 80px; }
    .follow-spinner { display: inline-block; }
  `]
})
export class UserItemComponent {
  @Input() user!: any;
  @Input() isLoading = false;
  @Input() isBeingFollowed = false;
  @Input() currentUserId?: number;
  @Output() onFollow = new EventEmitter<number>();
  @Output() onUnFollow = new EventEmitter<number>();

  showImage(base64String: string | null): string {
    return base64String
      ? `data:image/jpeg;base64,${base64String}`
      : 'assets/ProfileAvatar.png';
  }

  handleClick() {
    if (this.isBeingFollowed) {
      this.onUnFollow.emit(this.user.userId);
    } else {
      this.onFollow.emit(this.user.userId);
    }
  }
}
