import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StatusActionDto } from '../../models/ReactToStatusRequestDto';
import { StatusServices } from '../../services/status.services';

type MediaKind = 'image' | 'video';
interface MediaPreview { kind: MediaKind; url: string; name: string; }

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="share-dialog">
      <!-- Header -->
      <div class="header">
        <button mat-icon-button (click)="close()"><i class="bi bi-x"></i></button>
        <h2>Add a comment</h2>
        <button
          mat-raised-button
          color="primary"
          (click)="postQuote()"
          [disabled]="posting || (!content.trim() && selectedFiles.length === 0)">
          Post
        </button>
      </div>

      <!-- Composer -->
      <div class="composer">
        <textarea [(ngModel)]="content" placeholder="Add a comment" rows="4"></textarea>
      </div>

      <!-- Media previews -->
      <div class="previews" *ngIf="previews.length > 0">
        <div class="preview" *ngFor="let p of previews; let i = index">
          <ng-container [ngSwitch]="p.kind">
            <img *ngSwitchCase="'image'" [src]="p.url" [alt]="p.name">
            <video *ngSwitchCase="'video'" [src]="p.url" controls playsinline></video>
          </ng-container>
          <button mat-icon-button class="remove" (click)="remove(i)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- Quoted card -->
      <div class="quoted">
        <div class="quoted-content">
          <div class="avatar-container">
            <img class="avatar" [src]="processProfilePicture(data.statusAction.profilePicture)"
                 (error)="onImgErr($event)" />
          </div>
          <div class="info">
            <div class="top-line">
              <span class="username">{{ data.statusAction.username }}</span>
              <span class="handle">{{ '@'+data.statusAction.username }}</span>
              <span class="dot">·</span>
              <span class="time">{{ relativeTime(data.statusAction.postedAt) }}</span>
            </div>
            <p class="text">{{ data.statusAction.content }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="left">
          <button mat-icon-button (click)="triggerFileInput()" [disabled]="selectedFiles.length >= MAX_MEDIA">
            <i class="bi bi-image"></i>
          </button>
          <input
            #fileInput
            type="file"
            multiple
            accept="image/*,video/*"
            (change)="onFileSelected($event)"
            style="display:none">
          <span class="hint" *ngIf="selectedFiles.length > 0">{{selectedFiles.length}} / {{MAX_MEDIA}}</span>
        </div>
        <span class="error" *ngIf="error">{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .share-dialog {
      background:#000;
      color:#fff;
      padding:16px;
      display:flex;
      flex-direction:column;
      max-height:80vh;
    }

    .header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:8px;
    }

    .composer textarea {
      width:100%;
      border:none;
      background:transparent;
      color:#fff;
      resize:none;
      outline:none;
      font-size:15px;
    }

    /* Avatar fixed look */
    .avatar-container {
      width:42px;
      height:42px;
      border-radius:50%;
      overflow:hidden;
      border:1px solid #2a2a2a;
      flex-shrink:0;
    }
    .avatar {
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
      border-radius:50%;
    }

    .quoted {
      margin-top:8px;
      border:1px solid #2a2a2a;
      border-radius:14px;
      background:#0a0a0a;
      padding:10px 12px;
    }

    .quoted-content {
      display:flex;
      gap:10px;
      align-items:flex-start;
    }

    .top-line {
      display:flex;
      gap:6px;
      align-items:center;
      font-size:13px;
      color:#8b98a5;
    }

    .username { font-weight:600; color:#fff; }
    .handle, .dot, .time { color:#8b98a5; font-size:13px; }
    .text { margin-top:4px; font-size:14px; white-space:pre-wrap; }

    .previews {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:8px;
      margin:6px 0 8px;
    }

    .preview {
      position:relative;
      border-radius:12px;
      overflow:hidden;
      border:1px solid #2a2a2a;
      background:#0a0a0a;
    }

    .preview img, .preview video {
      width:100%;
      height:100%;
      object-fit:cover;
      aspect-ratio:1/1;
    }

    .preview .remove {
      position:absolute;
      top:4px;
      right:4px;
      background:rgba(0,0,0,.6);
    }

    .footer {
      display:flex;
      align-items:center;
      justify-content:space-between;
      border-top:1px solid #1f1f1f;
      padding-top:10px;
      margin-top:auto;
    }

    .left { display:flex; align-items:center; gap:10px; }
    .hint { color:#8b98a5; font-size:12px; }
    .error { color:#ff6b6b; font-size:12px; }
  `]
})
export class ShareDialogComponent {
  content = '';
  posting = false;
  error = '';

  readonly MAX_MEDIA = 4;
  readonly MAX_IMG_MB = 10;
  readonly MAX_VID_MB = 50;
  readonly IMG_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  readonly VID_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  selectedFiles: File[] = [];
  previews: MediaPreview[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  fallbackAvatar = 'assets/ProfileAvatar.png';

  constructor(
    private dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { statusAction: StatusActionDto },
    private statusServices: StatusServices
  ) { }

  triggerFileInput() { this.fileInput.nativeElement.click(); }

  close() { this.dialogRef.close(false); }

  processProfilePicture(img?: string) {
    return img ? `data:image/png;base64,${img}` : this.fallbackAvatar;
  }

  onImgErr(ev: Event) { (ev.target as HTMLImageElement).src = this.fallbackAvatar; }

  relativeTime(postedAt: string): string {
    const now = new Date(), t = new Date(postedAt);
    const diff = (now.getTime() - t.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    const m = diff / 60; if (m < 60) return `${Math.floor(m)}m`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h`;
    return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onFileSelected(ev: Event) {
    this.error = '';
    const input = ev.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []);
    if (!newFiles.length) return;

    for (const f of newFiles) {
      if (this.selectedFiles.length >= this.MAX_MEDIA) {
        this.error = `Max ${this.MAX_MEDIA} media items.`;
        break;
      }

      const isImg = this.IMG_TYPES.includes(f.type);
      const isVid = this.VID_TYPES.includes(f.type);
      if (!isImg && !isVid) { this.error = 'Only images or videos are allowed.'; continue; }

      const sizeMB = f.size / (1024 * 1024);
      if (isImg && sizeMB > this.MAX_IMG_MB) { this.error = `Images ≤ ${this.MAX_IMG_MB}MB.`; continue; }
      if (isVid && sizeMB > this.MAX_VID_MB) { this.error = `Videos ≤ ${this.MAX_VID_MB}MB.`; continue; }

      this.selectedFiles.push(f);
      this.previews.push({ kind: isVid ? 'video' : 'image', url: URL.createObjectURL(f), name: f.name });
    }
    input.value = '';
  }

  remove(i: number) {
    URL.revokeObjectURL(this.previews[i].url);
    this.previews.splice(i, 1);
    this.selectedFiles.splice(i, 1);
  }

  postQuote() {
    if (this.posting) return;
    if (!this.content.trim() && this.selectedFiles.length === 0) {
      this.error = 'Add a comment or attach media.'; return;
    }

    this.posting = true;
    this.statusServices.createStatus({
      content: this.content.trim(),
      privacy: this.data.statusAction.privacy,
      replyAudience: this.data.statusAction.replyAudience,
      shareAudience: this.data.statusAction.shareAudience,
      parentStatus: {
        statusId: this.data.statusAction.statusId,
        statusOwnerId: this.data.statusAction.statusOwnerId,
        parentAssociation: 'SHARE'
      }
    }, this.selectedFiles).subscribe({
      next: () => this.dialogRef.close(true),
      error: (e) => { console.error(e); this.posting = false; }
    });
  }
}
