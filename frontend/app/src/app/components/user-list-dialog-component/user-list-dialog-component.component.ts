import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../services/user.service';

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
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <div *ngFor="let user of data.users" class="user-item">
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

  <button mat-flat-button color="primary" class="follow-btn" (click)="follow(user.userId)" [disabled]="followSpinner && currentFollowingUserId === user.userId">
    <mat-progress-spinner 
      *ngIf="followSpinner && currentFollowingUserId === user.userId"
      diameter="18" strokeWidth="3" mode="indeterminate" color="accent"
      class="follow-spinner">
    </mat-progress-spinner>
    <span *ngIf="!followSpinner || currentFollowingUserId !== user.userId">Follow</span>
  </button>
</div>

      <ng-template #noUsers>
        <p>No users found.</p>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styleUrls: [`user-list-dialog-component.component.css`]
})
export class UserListDialogComponent {
  followSpinner = false;
  currentFollowingUserId!: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; users: UserSeekResponse[] },
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
