import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserResponse } from '../services/user.service';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-user-item',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: `user-item-component.html`,
  styleUrl: `user-item-component.css`
})
export class UserItemComponent {

  @Input() user!: UserResponse;
  @Input() isLoading = false;
  @Input() isMutualFollowings!: boolean;
  @Input() currentUserId?: number;
  @Output() onFollow = new EventEmitter<UserResponse>();
  @Output() onUnFollow = new EventEmitter<UserResponse>();
  @Output() GoTOProfile = new EventEmitter<string>();
  ngOnInit() {
    if (this.isMutualFollowings) {
      this.user.isFollowedByCurrentUser = true;
    }
  }
  showImage(base64String: string | null): string {
    return base64String
      ? `data:image/jpeg;base64,${base64String}`
      : 'assets/ProfileAvatar.png';
  }

  handleClick() {
    if (this.user.isFollowedByCurrentUser) {
      this.onUnFollow.emit(this.user);
    } else {
      this.onFollow.emit(this.user);
    }
  }
}
