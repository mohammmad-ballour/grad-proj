import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { UserAvatar } from "../../../../models/ProfileResponseDto";

@Component({
  selector: 'app-members-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Members</h2>
    <mat-dialog-content>
      <ul class="list-unstyled">
        @for (member of data.members; track member.userId) {
          <li class="d-flex align-items-center mb-2">
            <img [src]="'data:image/png;base64,' + member.profilePicture" 
                 (error)="onImageError($event, 'assets/ProfileAvatar.png')"
                 class="rounded-circle me-2" width="32" height="32" alt="">
            <div class="d-flex flex-column">
              <strong>{{ member.displayName }}</strong>
              <small class="text-muted">{{ member.username }}</small>
            </div>
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
})
export class MembersDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MembersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { members: UserAvatar[] }
  ) { }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }
}