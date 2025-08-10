import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../services/user.service';
import { FollowerMap } from '../profile/profile.component';

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
    CommonModule
  ],
  templateUrl: `user-list-dialog-component.component.html`,
  styleUrls: [`user-list-dialog-component.component.css`]
})
export class UserListDialogComponent {
  followSpinner = false;
  currentFollowingUserId!: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; FollowerMap: FollowerMap },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService
  ) { }

  showImage(base64String: string | null): string {
    if (base64String) {
      return `data:image/jpeg;base64,${base64String}`;
    }
    return 'assets/ProfileAvatar.png'; // fallback image path
  }

  follow(userId: number) {
    this.followSpinner = true;
    this.currentFollowingUserId = userId;

    this.userService.follow(userId).subscribe({
      next: () => {
        this.followSpinner = false;
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

  close() {
    this.dialogRef.close();
  }
}
