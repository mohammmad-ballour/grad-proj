import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { UserAvatar } from "../../../../profile/models/ProfileResponseDto";
import { ChatService } from "../../../services/chat.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AppRoutes } from "../../../../../config/app-routes.enum";

@Component({
  selector: 'app-members-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Members</h2>
    <mat-dialog-content>
      <div class="list-unstyled" >
        @for (member of data.members; track member.userId) {
         <div class="d-flex align-items-center justify-content-between mb-2">
  <!-- Member Info -->
  <div class="d-flex align-items-center  "  style="margin-top: 10px;">
    <img [src]="'data:image/png;base64,' + member.profilePicture"
         (error)="onImageError($event, 'assets/ProfileAvatar.png')"
         class="rounded-circle me-2" width="32" height="32" alt="">

    <div class="d-flex flex-column">
      <strong>{{ member.displayName }}</strong>
      <small class="text-muted">{{ member.username }}</small>
    </div>
  </div>

  <!-- Chat Button at the end --> 
   @if(member.userId!=  data.activeUserId){
    <button type="button"  class="btn btn-sm   ms-2"
            (click)="$event.stopPropagation(); openChat(member.userId)"
          >
      <mat-icon>chat</mat-icon>
    </button>
   }
</div>

        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button  (click)="closeDialog()" >Close</button>
    </mat-dialog-actions>
  `,
})
export class MembersDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<MembersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { members: UserAvatar[], activeUserId: number },
    private chatService: ChatService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }
  openNewChatt: boolean = false;
  openChat(userId: number): void {
    this.chatService.createOneOnOneChat(userId).subscribe({
      next: (chatId: string) => {
        this.openNewChatt = true;
        const deletedChats: string[] = JSON.parse(localStorage.getItem('deletedChats') || '[]');
        const updatedDeletedChats = deletedChats.filter(id => id !== chatId);
        localStorage.setItem('deletedChats', JSON.stringify(updatedDeletedChats));


        this.router.navigate([AppRoutes.MESSAGES]);
        this.router.navigate([AppRoutes.MESSAGES, chatId]);
        this.closeDialog();
      },
      error: () => {
        this.snackBar.open('Failed to open chat. Please try again later.', 'Close', { duration: 3000 });
      }
    });
  }
  closeDialog() {

    this.dialogRef.close(this.openNewChatt);
  }

}