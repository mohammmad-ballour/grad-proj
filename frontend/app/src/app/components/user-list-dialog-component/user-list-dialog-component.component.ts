import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserSeekResponse, UserService } from '../services/user.service';
import { finalize } from "rxjs/operators";
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
  pageSize = 10;
  hasMore = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; userSeekResponse: UserSeekResponse[], userId: number },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService
  ) {
  }


  seeMore(): void {
    if (this.isFollowersLoading || !this.hasMore) return;
    if (this.data.userSeekResponse.length === 0) return;

    this.isFollowersLoading = true;

    const lastFollower = this.data.userSeekResponse.at(-1);
    const seekRequest = {
      lastHappenedAt: lastFollower!.actionHappenedAt, // keep EXACT value from backend
      lastEntityId: lastFollower!.userId
    };

    this.userService.getFollowers(this.data.userId, seekRequest)
      .pipe(finalize(() => this.isFollowersLoading = false))
      .subscribe({
        next: (followers) => {
          if (followers?.length) {
            this.data.userSeekResponse.push(...followers);
            if (followers.length < this.pageSize) this.hasMore = false;
          } else {
            this.hasMore = false;
          }
        },
        error: (err) => console.error('Pagination error', err)
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
