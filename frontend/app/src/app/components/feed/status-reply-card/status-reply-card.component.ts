import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReplySnippet, StatusResponse } from '../models/StatusWithRepliesResponseDto';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatCardModule } from "@angular/material/card";
import { AppRoutes } from '../../../config/app-routes.enum';
import { MatIconModule } from "@angular/material/icon";
import { MediaService } from '../../services/media.service';
import { StatusActionCardComponent } from "../status-reaction-card/status-action-card.component";
import { StatusActionDto } from '../models/ReactToStatusRequestDto';
import { TimeAgoPipe } from "../../../core/Pipes/TimeAgoPipe";

@Component({
  selector: 'app-status-reply-card',

  template: `
    <mat-card class="post" >
      <!-- User Header -->
      <mat-card-header class="header  cursor-pointer"
      (click)="displayProfile()"
      >
        <img
          mat-card-avatar
          [src]="processImage(reply.user.profilePicture)"

          alt="avatar"
          class="avatar"
        />
        <div class="header-info">
          <span class="display-name">{{ reply.user.displayName }}</span>
          <span class="username">{{ '@'+reply.user.username }}</span>
          <span class="dot">·</span>
          <span class="time">{{ reply.postedAt |timeAgo }}</span>
        </div>
      </mat-card-header>
         <!-- Post Content -->
      <mat-card-content
        #contentElement
        class="post-content cursor-pointer"
        [ngClass]="{ expanded: isExpanded }"
        (click)="displayStatus()"
        
      >
        {{ reply.content }}
      </mat-card-content>
      
   

      <!-- See More Button -->
      @if (isContentOverflowing) {
        <div class="see-more">
          <button mat-button (click)="toggleExpand()" class="see-more-btn">
            {{ isExpanded ? 'See Less' : 'See More' }}
          </button>
        </div>
      }

      <!-- Media Section -->
      @if ( reply. medias && reply.medias.length > 0) {
        <div class="media-grid" style="cursor: pointer;" (click)="displayStatus()">
          @for (media of reply.medias; track media.mediaId) {
            @if (media.mimeType.startsWith('image/')) {
              <img
                [src]="mediaService.getMediaById(media.mediaId)"
                [alt]="media.mimeType"
                class="media-item"
              />
            }
            @if (media.mimeType.startsWith('video/')) {
              <video
                controls
                class="media-item"
                [src]="mediaService.getMediaById(media.mediaId)"
              ></video>
            }
          }
        </div>
      }
        <!-- Actions -->
    <app-status-action-card
      [statusAction]="statusAction"
      [reply]="reply"
      (statusActionChange)="UpdateStatusAction($event)">
    </app-status-action-card>
          
    </mat-card>
  `,
  styles: [
    `
      .post {
         width: 98%;
        margin: 8px auto;
        border: none;
        border-radius: 12px;
        box-shadow: none;
        background-color: black;
        padding: 12px;
        overflow: hidden;
        border-radius:10px;
        
        border: 2px solid #cdd7e23b;

      }
      .cursor-pointer {
        cursor: pointer;
      }
      /* Header */
      .header {
        display: flex;
        align-items: center;
        padding: 0;
      }
      .avatar {
        border-radius: 50%;
        width: 40px;
        height: 40px;
      }
      .header-info {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        font-size: 13px;
      }
      .display-name {
        font-weight: 600;
        color: #e9eef2ff;
      }
      .username {
        color: #657786;
      }
      .dot {
        color: #657786;
      }
      .time {
        color: #657786;
      }

      /* Parent Snippet */
      .parent-snippet {
        margin: 4px 0 6px 48px;
        font-size: 13px;
        color: #657786;
      }
      .mention {
        color: #1da1f2;
      }

      /* Post Content */
      .post-content {
        font-size: 15px;
        color: #f3f7fbff;
        margin: 8px 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        transition: all 0.3s ease;
      }
      .post-content.expanded {
        -webkit-line-clamp: unset;
        overflow: visible;
      }

      .see-more-btn {
        font-size: 13px;
        color: #1da1f2;
        padding: 0;
      }

      /* Media Grid */
      .media-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 8px;
        border-radius: 12px;
        overflow: hidden;
      }
      .media-item {
        width: 100%;
        border-radius: 12px;
        object-fit: cover;
        max-height: 300px;
      }

      /* Actions */
       
       .actions {
        display: flex;
        justify-content: space-around;
        padding: 8px 0 0;
        border-top: 1px solid #e6ecf0;
        margin-top: 8px;
        
       
      }
      .action-btn {
        font-size: 13px;
        color: #1da1f2;
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: black;
        border:none;
      }
      .action-btn:hover {
        color: #1da1f2;
        background: none;
      }
      .liked {
        color: #e0245e !important;
      }
       
    `,
  ],
  imports: [CommonModule, MatCardModule, MatIconModule, StatusActionCardComponent, TimeAgoPipe]
})
export class StatusRplyCardComponent {
  displayProfile() {
    this.router.navigate([`${this.reply.user.username}`])
  }


  @Input() reply!: ReplySnippet;
  @Input() parentStatus!: StatusResponse;



  parentStatusSnippet: any;
  isExpanded: any;
  isContentOverflowing: any;
  isLiked!: boolean;
  statusAction!: StatusActionDto;
  ngOnInit() {
    this.statusAction = this.getStatusAction();
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private router: Router,
    public mediaService: MediaService
  ) {

  }
  processImage(image?: string): SafeUrl {
    if (!image) return 'assets/ProfileAvatar.png';
    return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${image}`);
  }

  displayStatus() {
    console.log(this.reply.replyId)
    console.log('test')
    this.router.navigate([`${AppRoutes.STATUS}`, this.reply.replyId])
  }

  processVideo(media: string): string {
    if (!media) return '';
    return `data:video/mp4;base64,${media}`;
  }
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }


  getStatusAction(): StatusActionDto {
    return {
      statusId: this.reply.replyId,
      statusOwnerId: this.reply.user.userId,
      numLikes: this.reply.numLikes,
      numReplies: this.reply.numReplies,
      numShares: this.reply.numShares,
      liked: this.reply.isLikedByCurrentUser,
      isSavedToBookmarks: this.reply.isSavedToBookmarks,
      isCurrentUserAllowedToReply: this.parentStatus.isCurrentUserAllowedToReply,
      isCurrentUserAllowedToShare: this.parentStatus.isCurrentUserAllowedToShare,
      privacy: this.parentStatus.privacy,
      replyAudience: this.parentStatus.replyAudience,
      shareAudience: this.parentStatus.shareAudience,
      content: this.reply.content,
      postedAt: this.reply.postedAt,
      profilePicture: this.reply.user.profilePicture,
      username: this.reply.user.username
    };
  }
  UpdateStatusAction(statusActionDto: StatusActionDto) {
    this.statusAction = statusActionDto;
    this.reply.isLikedByCurrentUser = statusActionDto.liked

  }
}