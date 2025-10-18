import { AfterViewInit, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileResponseDto } from './models/ProfileResponseDto';
import { EditProfileDialogComponent } from './edit-profile-dialog/edit-profile-dialog.component';
import { UserResponse, UserService } from './services/user.service';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuModule } from "@angular/material/menu";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatSliderModule } from '@angular/material/slider';
import { MuteDuration } from './models/MuteDurationDto';
import { Observable, Subscription } from 'rxjs';
import { UserListDialogComponent } from './user-list-dialog-component/user-list-dialog-component.component';
import { ChatService } from '../chatting/services/chat.service';
import { AppRoutes } from '../../config/app-routes.enum';
import { ProfileServices } from './services/profile.services';
import { MuteDialogComponent } from './mute-dialog-component/mute-dialog-component.component';
import { UserStatusService } from './services/user-status.service';
import { TimestampSeekRequest } from '../models/TimestampSeekRequestDto';
import { StatusResponse } from '../feed/models/StatusWithRepliesResponseDto';
import { StatusMediaResponse } from './models/StatusMediaResponse';
import { MediaService } from '../services/media.service';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusCardComponent } from '../feed/status-card/status-card.component';


type Priority = 'RESTRICTED' | 'FAVOURITE' | 'DEFAULT';
const PRIORITIES: Priority[] = ['RESTRICTED', 'FAVOURITE', 'DEFAULT'];
export type Map = { [key: string]: UserSeek[] };
export interface UserSeek {
  userId: number;
  displayName: string;
  profilePicture: string | null; // Base64 encoded
  actionHappenedAt: string;      // ISO string
  profileBio: string | null;
}
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatTabsModule, MatIconModule, CommonModule,
    MatProgressSpinnerModule, MatMenuModule,
    MatInputModule, MatAutocompleteModule, MatSliderModule,
    StatusCardComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit {


  profile!: ProfileResponseDto;
  initialSpinner = false;
  isNotFound = true;
  CurrentUserName!: string;
  isPersonalProfile!: boolean;
  followSpinner = false;
  menuSpinner = false;
  menuOpen: any;
  dialogViewisOpen = false;
  blockSpinner: any;
  displaySnackBar = true;


  // track loading states
  isPostsLoading = false;
  isRepliesLoading = false;
  isMediaLoading = false;
  isLikesLoading = false;
  posts: StatusResponse[] = [];
  replies: StatusResponse[] = [];
  media: StatusMediaResponse[] = [];
  likes: StatusResponse[] = []
  // optional: keep a seek request for pagination
  seekRequest?: TimestampSeekRequest;
  constructor(
    private dialog: MatDialog,
    private profileServices: ProfileServices,
    private userService: UserService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private chatService: ChatService,
    private router: Router,
    private userStatusService: UserStatusService,
    public mediaService: MediaService,

  ) { }


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username') || '';
      if (this.CurrentUserName !== username) {
        this.CurrentUserName = username;
        this.isPersonalProfile = this.CurrentUserName === this.profileServices.userName;
        this.resetUserContent();
        this.fetchProfileData(true);

      }
    });
  }
  /** ---------- Fetch Profile ---------- **/
  private fetchProfileData(isInitialCall: boolean) {
    this.initialSpinner = isInitialCall;
    this.profileServices.GetDataOfProfile(this.CurrentUserName).subscribe({
      next: (result) => {
        if (result) {
          this.profile = result;
          this.profile.userAvatar.profilePicture = `data:image/png;base64,${this.profile.userAvatar.profilePicture}`;
          this.profile.profileCoverPhoto = `data:image/png;base64,${this.profile.profileCoverPhoto}`;
          this.isNotFound = false;

        }
        this.initialSpinner = false;
      },
      complete: () => {
        if (!this.profile.isBlocked && !this.isPersonalProfile) {
          this.getSomeMutualFollowings();
        }
        this.onTabChange(0);
      }
    });
  }


  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  openEditProfile(): void {
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '600px',
      panelClass: 'edit-profile-dialog',
      backdropClass: 'custom-backdrop',
      data: {
        displayName: this.profile.userAvatar?.displayName ?? '',
        dob: this.profile.aboutUser?.dob ?? '',
        gender: this.profile.aboutUser?.gender ?? '',
        residence: this.profile.aboutUser?.residence ?? '',
        profileBio: this.profile.profileBio ?? '',
        profilePicture: this.profile.userAvatar?.profilePicture ?? '',
        profileCoverPhoto: this.profile.profileCoverPhoto ?? '',
        timezoneId: this.profile.aboutUser?.timezoneId ?? ''
      }
    });

    dialogRef.afterClosed().subscribe(changed => {
      if (changed) this.fetchProfileData(true);
    });
  }

  /** ---------- GENERIC TOGGLE HANDLER ---------- **/
  private handleToggleAction(
    condition: boolean,
    actionIfFalse$: Observable<void>,
    actionIfTrue$: Observable<void>,
    successMessageIfFalse: string,
    successMessageIfTrue: string,
    errorMessageIfFalse: string,
    errorMessageIfTrue: string,
    stateUpdater: () => void,
    spinnerSetter: (state: boolean) => void,
    refrech: boolean
  ): void {
    spinnerSetter(true);

    const request$ = condition ? actionIfTrue$ : actionIfFalse$;

    request$.subscribe({
      next: () => {
        stateUpdater();
        if (refrech)
          this.showSnackBar(condition ? successMessageIfTrue : successMessageIfFalse);
        this.fetchProfileData(false)
      },
      error: () => {
        if (refrech)
          this.showSnackBar(condition ? errorMessageIfTrue : errorMessageIfFalse);
      },
      complete: () => {
        spinnerSetter(false);
      }
    });


  }

  /** ---------- FOLLOW ---------- **/
  toggleFollow(refrech: boolean): void {
    const userId = this.profile.userAvatar.userId;

    this.handleToggleAction(
      this.profile.isBeingFollowed,
      this.userService.follow(userId),
      this.userService.unfollow(userId),
      'Followed successfully',
      'Unfollowed successfully',
      'Failed to follow',
      'Failed to unfollow',
      () => (this.profile.isBeingFollowed = !this.profile.isBeingFollowed),
      (state) => (this.followSpinner = state),
      refrech
    );
  }

  /** ---------- BLOCK ---------- **/
  toggleBlock(): void {
    const userId = this.profile.userAvatar.userId;

    this.handleToggleAction(
      this.profile.isBlocked,
      this.userService.Block(userId),
      this.userService.UNBlock(userId),
      'Blocked successfully',
      'Unblocked successfully',
      'Failed to block',
      'Failed to unblock',
      () => {
        this.profile.isBlocked = !this.profile.isBlocked;
        // Auto-unfollow on block if needed
        if (this.profile.isBlocked && this.profile.isBeingFollowed) {
          this.toggleFollow(false); // will unfollow
        }
      },
      (state) => (this.menuSpinner = state),
      true
    );
  }

  /** ---------- PRIORITY ---------- **/
  updatePriority(priorityName: string): void {
    const normalized = PRIORITIES.includes(priorityName.toUpperCase() as Priority)
      ? priorityName.toUpperCase() as Priority
      : 'DEFAULT';

    const userId = this.profile.userAvatar.userId;

    this.handleToggleAction(
      false, // no toggle here, just call once
      this.userService.UpdatePriority(userId, normalized),
      this.userService.UpdatePriority(userId, normalized),
      'Priority updated successfully',  // Success message added
      'Priority updated successfully',
      'Failed to update priority',      // Error message added
      'Failed to update priority',
      () => (this.profile.followingPriority = normalized),
      (state) => (this.followSpinner = state),
      true
    );
  }


  /** ---------- MUTE / UNMUTE ---------- **/
  openMuteDialog(): void {
    const dialogRef = this.dialog.open(MuteDialogComponent, {
      width: '400px',
      data: {
        userId: this.profile.userAvatar.userId,
        isMuted: this.profile.isMuted
      },
    });

    dialogRef.afterClosed().subscribe((result: MuteDuration | boolean | undefined) => {
      if (result === false || result === undefined) {
        // Cancel clicked → do nothing
        return;
      }

      if (typeof result === 'object' && 'unit' in result) {
        // Mute action
        this.mute(result);
      }
      else if (result === true) {
        // Unmute action
        this.unmute(true);
      }
    });
  }




  private mute(duration: MuteDuration): void {
    if (this.profile.isMuted) {
      this.displaySnackBar = false;
      // First unmute, then mute again with the new duration
      this.unmute(false).add(() => {
        this.callMute(duration);
      });
    } else {
      this.callMute(duration);
    }
  }

  private callMute(duration: MuteDuration): void {
    this.menuSpinner = true

    this.userService.Mute(this.profile.userAvatar.userId, duration).subscribe(

      {
        next: () => {
          this.profile.isMuted = true;
          this.showSnackBar('Muted successfully');
        },
        error: () => {
          this.showSnackBar('Mute failed.');
          this.menuSpinner = false;
        },
        complete: () => {
          this.menuSpinner = false
        }
      }
    );

  }

  public unmute(refrech: boolean): Subscription {
    this.menuSpinner = true

    return this.userService.Unmute(this.profile.userAvatar.userId).subscribe({
      next: () => {
        if (refrech) {
          this.showSnackBar('Unmuted successfully');
          this.fetchProfileData(false);

        }
      },
      error: () => {
        if (refrech)
          this.showSnackBar('Unmute failed.');
        this.menuSpinner = false

      },
      complete: () => {
        this.menuSpinner = false
      }
    });
  }


  isFollowersLoading = false;
  isFollowingLoading = false;

  loadFollowers(): void {
    this.isFollowersLoading = true;
    this.userService.getFollowers(this.profile.userAvatar.userId, 0)
      .subscribe({
        next: (followers) => {
          if (followers) {
            this.openUserList('Followers', followers);
          }
        },
        error: () => { },
        complete: () => {
          this.isFollowersLoading = false;
        }
      });
  }

  loadFollowing(): void {
    this.isFollowingLoading = true;
    this.userService.getFollowings(this.profile.userAvatar.userId, 0)
      .subscribe({
        next: (following) => {
          if (following) {

            this.openUserList('Following', following);
          }
        },
        error: () => { },
        complete: () => {
          this.isFollowingLoading = false;
        }
      });
  }

  loadMutualFollowings() {
    this.userService
      .getMutualFollowings(this.profile.userAvatar.userId, 0)
      .subscribe({
        next: (mutualFollowings) => {
          if (mutualFollowings) {
            this.openUserList('MutualFollowings', mutualFollowings)
          }
        },
        error: (err) => {
          console.error('Error fetching mutual followings:', err);
        }
      });
  }

  openUserList(title: string, UserResponse: UserResponse[]): void {
    if (UserResponse.length > 0) {

      const dialog = this.dialog.open(UserListDialogComponent, {
        width: '1000px', height: UserResponse.length < 4 ? `${UserResponse.length * 215}px` : "500px",
        data: { title, UserResponse, userId: this.profile.userAvatar.userId }
      });
      dialog.afterClosed().subscribe(() => {
        this.fetchProfileData(false);
      });
    } else {
      if (this.profile.followerNo == 1)

        this.showSnackBar(`just you from  ${title} the @${this.profile.username}  `);
      else
        this.showSnackBar(`There is no ${title.toLocaleLowerCase()} to show `);
    }


  }
  MutualFollowings!: string;

  getSomeMutualFollowings() {
    this.userService
      .getMutualFollowings(this.profile.userAvatar.userId, 0)
      .subscribe({
        next: (mutualFollowings) => {
          if (mutualFollowings && mutualFollowings.length > 0) {
            // Take first 3, map to usernames, and join with commas
            this.MutualFollowings = mutualFollowings
              .slice(0, 3)
              .map(user => user.userAvatar.username) // assuming API returns { username: string, ... }
              .join(', ') + `${mutualFollowings.length > 3 ? ` + ${mutualFollowings.length - 3} more` : ''} `;

          } else {
            this.MutualFollowings = '';
          }
        },
        error: (err) => {
          console.error('Error fetching mutual followings:', err);
          this.MutualFollowings = '';
        }
      });
  }

  openChat() {
    this.chatService.createOneOnOneChat(this.profile.userAvatar.userId).subscribe({
      next: (chatId: string) => {
        this.router.navigate([`${AppRoutes.MESSAGES}`, chatId]);
      },
      error: (err) => {
        if (err.status === 403) {
          this.showSnackBar('You are not allowed to message this user.');
        } else {
          this.showSnackBar('Failed to open chat. Please try again later.');
        }
      }
    });
  }




  // pagination
  pagePosts = 0;
  pageReplies = 0;
  pageMedia = 0;
  pageLikes = 0;

  hasMorePosts = true;
  hasMoreReplies = true;
  hasMoreMedia = true;
  hasMoreLikes = true;

  activeTab: 'posts' | 'replies' | 'media' | 'likes' = 'posts';
  showBackToTop = false;
  readonly PAGE_SIZE = 10;

  // scroll throttling
  private scrollTimeout: any;


  /** ---------- Reset content when switching profiles ---------- **/
  private resetUserContent() {
    this.posts = [];
    this.replies = [];
    this.media = [];
    this.likes = [];

    this.pagePosts = 0;
    this.pageReplies = 0;
    this.pageMedia = 0;
    this.pageLikes = 0;

    this.hasMorePosts = true;
    this.hasMoreReplies = true;
    this.hasMoreMedia = true;
    this.hasMoreLikes = true;
  }


  // ======= Loaders =======
  loadPosts() {
    console.log("from load posts");
    this.loadItems<StatusResponse>(
      'isPostsLoading',
      'hasMorePosts',
      'pagePosts',
      () => this.userStatusService.fetchUserPosts(this.profile.userAvatar.userId, this.pagePosts),
      'posts'
    );
  }

  loadReplies() {
    this.loadItems<StatusResponse>(
      'isRepliesLoading',
      'hasMoreReplies',
      'pageReplies',
      () => this.userStatusService.fetchUserReplies(this.profile.userAvatar.userId, this.pageReplies),
      'replies'
    );
  }

  loadMedia() {
    this.loadItems<StatusMediaResponse>(
      'isMediaLoading',
      'hasMoreMedia',
      'pageMedia',
      () => this.userStatusService.fetchUserMedia(this.profile.userAvatar.userId, this.pageMedia),
      'media'
    );
  }

  loadLikes() {
    this.loadItems<StatusResponse>(
      'isLikesLoading',
      'hasMoreLikes',
      'pageLikes',
      () => this.userStatusService.fetchStatusesLiked(this.pageLikes),
      'likes'
    );
  }

  /** ---------- Tab Change ---------- **/
  onTabChange(index: number) {
    switch (index) {
      case 0: this.activeTab = 'posts'; if (this.posts.length === 0) this.loadPosts(); break;
      case 1: this.activeTab = 'replies'; if (this.replies.length === 0) this.loadReplies(); break;
      case 2: this.activeTab = 'media'; if (this.media.length === 0) this.loadMedia(); break;
      case 3: this.activeTab = 'likes'; if (this.likes.length === 0) this.loadLikes(); break;
    }
  }


  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** ---------- Snackbar ---------- **/
  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', { duration: 1500 });
  }
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (!this.scrollContainer) {
      return;
    }

    // You can safely use this.scrollContainer.nativeElement here
    this.scrollContainer.nativeElement.addEventListener('scroll', () => {
      this.onScroll();
    });
  }

  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
    const threshold = 150;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;

    if (position >= height - threshold && !this.lockScroll) {
      this.onScrollDown();
    }
  }
  private loadItems<T>(
    loaderFlag: 'isPostsLoading' | 'isRepliesLoading' | 'isMediaLoading' | 'isLikesLoading',
    hasMoreFlag: 'hasMorePosts' | 'hasMoreReplies' | 'hasMoreMedia' | 'hasMoreLikes',
    pageKey: 'pagePosts' | 'pageReplies' | 'pageMedia' | 'pageLikes',
    fetchFn: () => Observable<T[]>,
    targetArray: 'posts' | 'replies' | 'media' | 'likes'
  ): void {
    this[loaderFlag] = true;
    this.lockScroll = true;
    fetchFn().subscribe({
      next: (res) => {
        if (res.length > 0) {
          (this[targetArray] as T[]).push(...res);
          this[pageKey]++;
          console.log(res);

        }
        this[hasMoreFlag] = res.length == this.PAGE_SIZE;
      },
      error: (err) => {
        console.error(`Error loading ${targetArray}:`, err);
        this.showSnackBar('Failed to load more content.');
        this[loaderFlag] = false;
      },
      complete: () => {
        this[loaderFlag] = false;
        console.log(this[targetArray] as T[]);
        console.log(`page key ${this[pageKey]}`);
        console.log(this[hasMoreFlag]);
        this.lockScroll = false;
      }
    });
  }
  lockScroll = false;
  onScrollDown(): void {

    console.log("from onScrollDown ")
    // Load more items based on active tab
    switch (this.activeTab) {
      case 'posts':
        if (this.hasMorePosts) {
          console.log("from onScrollDown case posts")

          this.loadPosts();
        }
        break;
      case 'replies':
        if (this.hasMoreReplies) {
          this.loadReplies();
        }
        break;
      case 'media':
        if (this.hasMoreMedia) {
          this.loadMedia();
        }
        break;
      case 'likes':
        if (this.hasMoreLikes) {
          console.log("from onScrollDown case posts")

          this.loadLikes();
        }
        break;
    }
  }
  displayOwendStatus(statusId: number) {
    console.log('test')
    this.router.navigate([`${AppRoutes.STATUS}`, statusId])
  }
  /** ---------- Handle deletion emitted from StatusCard ---------- **/
  onStatusDeleted(statusId: string): void {
    const idStr = String(statusId);

    // Remove from Posts
    this.posts = this.posts.filter(p => String(p.statusId) !== idStr);

    // Remove from Replies
    this.replies = this.replies.filter(r => String(r.statusId) !== idStr);

    // Remove from Likes
    this.likes = this.likes.filter(l => String(l.statusId) !== idStr);

    // Remove from Media
    this.media = this.media.filter(m => String(m.statusId) !== idStr);
  }

}