import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserSeekResponse } from '../services/user.service';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-user-item',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="user-item">
      <div class="user-info">
        <img class="img" 
          [src]="showImage(user.profilePicture)"
          alt="{{ user.displayName }}"
          width="40" height="40" />
       
           
        <div class="user-details">
          <span class="user-name">{{ user.displayName }} <mat-icon class="verified" > verified</mat-icon></span>
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
          <span>{{ user.followedByCurrentUser ? 'Unfollow' : 'Follow' }}</span>
        }
      </button>
    </div>
  `,
  styles: [`
    .user-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .user-info { display: flex; align-items: center;   }
    .user-details { margin-left: 10px; display: flex; flex-direction: column;  }
    .user-name { font-weight: bold;display: flex; }
    .profile-bio { font-size: 0.85em; color: gray; }
    .follow-btn {  width: 70px;height:25px }
    .follow-spinner { display: inline-block; }
    .img{    border-radius: 50px;}
    .verified{
          color: #4a7af9;
              font-size: 20px;
              

 
    }
  `]
})
export class UserItemComponent {
  @Input() user!: UserSeekResponse;
  @Input() isLoading = false;
  @Input() currentUserId?: number;
  @Output() onFollow = new EventEmitter<UserSeekResponse>();
  @Output() onUnFollow = new EventEmitter<UserSeekResponse>();

  showImage(base64String: string | null): string {
    return base64String
      ? `data:image/jpeg;base64,${base64String}`
      : 'assets/ProfileAvatar.png';
  }

  handleClick() {
    if (this.user.followedByCurrentUser) {
      this.onUnFollow.emit(this.user);
    } else {
      this.onFollow.emit(this.user);
    }
  }
}
