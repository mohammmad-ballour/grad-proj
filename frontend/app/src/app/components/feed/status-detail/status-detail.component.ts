import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';
import { CommonModule, DatePipe } from '@angular/common';
import { StatusCardComponent } from "../status-card/status-card.component"; // Import CommonModule and DatePipe
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { StatusRplyCardComponent } from "../status-reply-card/status-reply-card.component";
import { MediaServices } from '../../services/media.services';

@Component({
  selector: 'app-status-detail',
  templateUrl: './status-detail.component.html',
  styleUrls: ['./status-detail.component.css'],
  imports: [CommonModule, StatusCardComponent, StatusRplyCardComponent]
})
export class StatusDetailComponent {

  @Input() statusData!: StatusWithRepliesResponse;

  constructor(
    private sanitizer: DomSanitizer,
    mediaService: MediaServices
  ) { }
  processImage(image?: string): SafeUrl {
    if (!image) return 'assets/ProfileAvatar.png';
    return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${image}`);
  }







  processVideo(media: string): string {
    if (!media) return '';
    return `data:video/mp4;base64,${media}`;
  }

}