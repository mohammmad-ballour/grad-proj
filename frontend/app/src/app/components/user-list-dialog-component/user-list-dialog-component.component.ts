import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SeekRequest, UserSeekResponse, UserService } from '../services/user.service';
import { UserItemComponent } from "../user-item-component/user-item-component";


@Component({
  selector: 'app-user-list-dialog',
  standalone: true,
  imports: [
    MatSelectModule,
    MatAutocompleteModule,
    MatDialogActions,
    MatDialogModule,
    MatProgressSpinnerModule,
    CommonModule,
    UserItemComponent
  ],
  templateUrl: `user-list-dialog-component.component.html`,
  styleUrls: [`user-list-dialog-component.component.css`]
})
export class UserListDialogComponent {

  followSpinner = false;
  currentUserId!: number;
  isBeingFollowed!: boolean;
  objectKeys = Object.keys; // for template use

  isFollowersLoading = false;  // Add this to disable multiple seeMore calls

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; userSeekResponse: UserSeekResponse[], userId: number },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService
  ) { }

  seeMore(): void {
    if (this.isFollowersLoading) return; // prevent multi calls

    if (this.data.userSeekResponse.length === 0) return; // no more data to seek from

    this.isFollowersLoading = true;
    const lastFollower = this.data.userSeekResponse[this.data.userSeekResponse.length - 1];

    const seekRequest = {
      lastHappenedAt: lastFollower.actionHappenedAt, // Date or ISO string
      lastEntityId: lastFollower.userId
    };




    // Call your API for more followers with pagination parameters
    this.userService.getFollowers(this.data.userId, seekRequest)
      .subscribe({
        next: (followers) => {
          console.log(this.data.userId)

          console.log(seekRequest);
          console.log(followers);
          if (followers && followers.length > 0) {
            // Append new followers to existing list
            this.data.userSeekResponse = this.data.userSeekResponse.concat(followers);
          } else {
            // No more followers to load - optionally disable further seeMore calls
          }
        },
        error: (error) => {
          console.log(error)
        },
        complete: () => {
          this.isFollowersLoading = false;
        }
      });
  }

  follow(user: UserSeekResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userId;
    this.userService.follow(user.userId).subscribe({
      next: () => {
        user.followedByCurrentUser = true;
      },
      error: () => {
        this.followSpinner = false;
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }

  unFollow(user: UserSeekResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userId;
    this.userService.unfollow(user.userId).subscribe({
      next: () => {
        user.followedByCurrentUser = false;
      },
      error: () => {
        this.followSpinner = false;
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
