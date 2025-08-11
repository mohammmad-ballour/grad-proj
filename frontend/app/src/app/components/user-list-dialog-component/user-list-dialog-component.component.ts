import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../services/user.service';
import { FollowerMap } from '../profile/profile.component';
import { UserItemComponent } from "../user-item-component/user-item-component";

export interface UserSeekResponse {
  userId: number;
  displayName: string;
  profilePicture: string | null;
  actionHappenedAt: string;
  profileBio: string | null;
}

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
  objectKeys = Object.keys; // 🔹 lets you call objectKeys(...) in the template
  toggleFollow: boolean | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; FollowerMap: FollowerMap },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService
  ) { }


  follow(userId: number) {
    this.followSpinner = true;
    this.currentUserId = userId;

    this.userService.follow(userId).subscribe({
      next: () => {
        this.followSpinner = false;
        // Find the index of the user in YOU_FOLLOW
        const index = this.data.FollowerMap['NORMAL'].findIndex(u => u.userId === userId);

        if (index !== -1) {
          // Remove the user object from YOU_FOLLOW
          const [removedUser] = this.data.FollowerMap['NORMAL'].splice(index, 1);

          // Add the removed user to NORMAL
          this.data.FollowerMap['YOU_FOLLOW'].push(removedUser);
        }

        // Additional success logic if needed
      },
      error: () => {
        this.followSpinner = false;
        // Handle error (show message, etc.)
      },
      complete: () => {

      }
    });
  }

  unFollow(userId: number) {
    this.followSpinner = true;
    this.currentUserId = userId;

    this.userService.unfollow(userId).subscribe({
      next: () => {
        this.followSpinner = false;

        // Find the index of the user in YOU_FOLLOW
        const index = this.data.FollowerMap['YOU_FOLLOW'].findIndex(u => u.userId === userId);

        if (index !== -1) {
          // Remove the user object from YOU_FOLLOW
          const [removedUser] = this.data.FollowerMap['YOU_FOLLOW'].splice(index, 1);

          // Add the removed user to NORMAL
          this.data.FollowerMap['NORMAL'].push(removedUser);
        }
      },
      error: () => {
        this.followSpinner = false;
        // Handle error (show message, etc.)
      }
    });
  }


  close() {
    this.dialogRef.close();
  }
}
