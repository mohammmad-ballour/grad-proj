import { CommonModule } from "@angular/common";
import { Component, Inject, ViewChild, ElementRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { StatusActionDto } from "../../models/ReactToStatusRequestDto";
import { StatusResponse, CreateStatusRequest, StatusPrivacy, StatusAudience, ParentAssociation, ReplySnippet } from "../../models/StatusWithRepliesResponseDto";
import { StatusServices } from "../../services/status.services";
import { ProfileServices } from "../../../profile/services/profile.services";
import { AuthService } from "../../../../core/services/auth.service";

// New dialog component to handle reply composition, mimicking X app style
@Component({
  selector: 'app-reply-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule, MatDialogModule],
  template: `
    <div class="reply-dialog">
      <!-- Header -->
      <div class="header">
        <button mat-icon-button (click)="closeDialog()">
          <i class="bi bi-x"></i>
        </button>
        <h2>Reply</h2>
        <button mat-raised-button color="primary" (click)="statusReply()" [disabled]="!content.trim()">Reply</button>
      </div>

      <!-- Original Post (mimicking the photo) -->
      <div class="original-post">
        <div class="user-info">
          <div class="avatar">
            <img [src]="processProfilePicture(data.statusAction.profilePicture)" (error)="onImageError($event,'assets/ProfileAvatar.png')" alt="User Avatar">
          </div>
          <span class="username">{{ data.statusAction.username }}</span>
          <span class="handle">{{ data.statusAction.username }}</span> <!-- Assuming username is used for both; adjust if separate handle field exists -->
          <span class="dot">·</span>
          <span class="timestamp">{{ getRelativeTime(data.statusAction.postedAt) }}</span>
        </div>
        <p class="content">{{ data.statusAction.content }}</p>
       </div>

       <div class="connector-line"></div>

       <div class="reply-input">
          <div class="avatar">
            <img [src]="profilePicture" (error)="onImageError($event,'assets/ProfileAvatar.png')" alt="Your Avatar">
          </div>
          <div class="input-container">
            <!-- Previews for selected images -->
            <div class="previews" *ngIf="previews.length > 0">
              <img *ngFor="let preview of previews" [src]="preview" alt="Preview" class="preview-img">
            </div>
            <textarea [(ngModel)]="content" placeholder="Add a reply..." rows="4"></textarea>
          </div>
      </div>

      <!-- Toolbar (like in photo) -->
      <div class="toolbar">
        <button mat-icon-button (click)="fileInput.click()"><i class="bi bi-image"></i></button> <!-- Media upload -->
        <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" multiple style="display: none;">
        <button mat-icon-button><i class="bi bi-gif"></i></button> <!-- GIF -->
        <button mat-icon-button><i class="bi bi-emoji-smile"></i></button> <!-- Emoji -->
        <button mat-icon-button><i class="bi bi-geo-alt"></i></button> <!-- Location -->
      </div>
    </div>
  `,
  styles: [
    `
      .reply-dialog {
        padding: 16px;
        background: #000; /* Dark mode like in photo */
        color: #fff;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .original-post {
        padding: 8px;
        margin-bottom: 8px;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .avatar {
        margin-right: 12px;
        flex-shrink: 0;
      }
      .avatar img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      .username {
        font-weight: bold;
      }
      .handle {
        color: #657786;
        margin-left: 4px;
      }
      .dot {
        color: #657786;
        margin: 0 4px;
      }
      .timestamp {
        color: #657786;
      }
      .connector-line {
        width: 2px;
        height: 20px;
        background: #333;
        margin-left: 20px; /* Align with avatar center (40px / 2) */
        margin-top: -10px;
        margin-bottom: -10px;
      }
      .reply-input {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      .input-container {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      textarea {
        flex: 1;
        background: transparent;
        border: none;
        color: #fff;
        resize: none;
      }
      .toolbar {
        display: flex;
        justify-content: flex-start;
        gap: 16px;
      }
      .previews {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .preview-img {
        max-width: 100px;
        max-height: 100px;
        border-radius: 8px;
      }
    `
  ],
})
export class ReplyDialogComponent {
  content: string = '';
  selectedFiles: File[] = [];
  previews: string[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  profilePicture!: string;

  constructor(
    public dialogRef: MatDialogRef<ReplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { statusAction: StatusActionDto },
    private statusServices: StatusServices,
    private profileServices: ProfileServices,
    private auth: AuthService,

  ) { }

  ngOnInit(): void {


    this.profileServices.GetDataOfProfile(this.auth.UserName).subscribe({
      next: (res) => {
        if (res)
          this.profilePicture = this.processProfilePicture(res.userAvatar.profilePicture)

      }
    })

    console.log(this.data.statusAction)
  }

  processProfilePicture(Image: string) {
    return `data:image/png;base64,${Image}`;


  }

  closeDialog(): void {

    this.dialogRef.close();
  }


  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        this.selectedFiles.push(file);
        const previewUrl = URL.createObjectURL(file);
        this.previews.push(previewUrl);
      }
    }
    // Reset the input to allow re-selection of the same file if needed
    input.value = '';
  }

  getRelativeTime(postedAt: string): string {
    const now = new Date();
    const posted = new Date(postedAt);
    const diff = now.getTime() - posted.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    if (days < 365) {
      return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  statusReply(): void {
    if (!this.content.trim()) return;

    const toCreate: CreateStatusRequest = {
      content: this.content,
      privacy: this.data.statusAction.privacy, // Default  
      replyAudience: this.data.statusAction.replyAudience, // Default;  
      shareAudience: this.data.statusAction.shareAudience, // Default;  
      parentStatus: { statusId: this.data.statusAction.statusId, statusOwnerId: this.data.statusAction.statusOwnerId, parentAssociation: "REPLY" }

    };

    this.statusServices.createStatus(toCreate, this.selectedFiles).subscribe({
      next: (statusId) => {
        this.dialogRef.close(true); // Signal success
      },
      error: (err) => {
        console.error('Failed to create reply', err);
        // Show error snackbar if needed
      }
    });
  }
}