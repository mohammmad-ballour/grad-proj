import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="media-viewer">
      @if (data.mimeType.startsWith('image/')) {
        <img
          [src]="data.mediaUrl"
          alt="Media content"
          class="media-content"
          
        />
      } @else {
        <video
          controls
          [src]="data.mediaUrl"
          class="media-content"
          aria-label="Video content"
        ></video>
      }
      <button
        mat-icon-button
        class="close-btn"
        (click)="dialogRef.close()"
        aria-label="Close media viewer"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .media-viewer {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background: black;
      position: relative;
      overflow: hidden;
    }
    .media-content {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      color: white;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
    }
    .close-btn:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  `]
})
export class MediaViewerComponent implements OnInit {
  isImage: boolean = false; // Initialize with a default value

  constructor(
    public dialogRef: MatDialogRef<MediaViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mimeType: string; mediaUrl: string }
  ) { }

  ngOnInit() {
    // Initialize isImage after data is injected
    this.isImage = this.data.mediaUrl.includes('image/');
  }


}