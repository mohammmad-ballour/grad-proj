import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogActions } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { UserResponse, UserService } from '../services/user.service';
import { UserItemComponent } from '../user-item-component/user-item-component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogActions,
    MatProgressSpinnerModule,
    UserItemComponent
  ],
  templateUrl: 'user-list-dialog-component.component.html',
  styleUrls: ['user-list-dialog-component.component.css']
})
export class UserListDialogComponent implements AfterViewInit, OnDestroy {

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;

  followSpinner = false;
  currentUserId!: number;
  isFollowersLoading = false;
  isLoadingFailed = false;
  hasMore = true;
  page = 1;
  pageSize = 10;

  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; UserResponse: UserResponse[], userId: number },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    if (this.sentinel) {
      this.observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !this.isFollowersLoading && this.hasMore) {
          this.loadMoreUsers();
        }
      }, {
        root: null, // dialog scroll container
        threshold: 0.1
      });
      this.observer.observe(this.sentinel.nativeElement);
    }
  }


  private loadMoreUsers(): void {
    this.isFollowersLoading = true;
    const request$ =
      this.data.title == 'Following'
        ? this.userService.getFollowings(this.data.userId, this.page)
        : this.data.title == 'Followers'
          ? this.userService.getFollowers(this.data.userId, this.page)
          : this.userService.getMutualFollowings(this.data.userId, this.page);


    request$.subscribe({
      next: (users) => {
        if (users?.length) {
          this.data.UserResponse.push(...users);
          this.page++;
          if (users.length < this.pageSize) {
            this.hasMore = false;
            this.disconnectObserver();
          }
        } else {
          this.hasMore = false;
          this.disconnectObserver();
        }
      },
      error: () => {
        this.isLoadingFailed = true;
      },
      complete: () => {
        this.isFollowersLoading = false;
      }
    });
  }


  private disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }



  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
    this.destroy$.next();
    this.destroy$.complete();
  }

  GoTOProfile(username: string) {
    this.close();
    this.router.navigate([`${username}`]);

  }


  follow(user: UserResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userAvatar.userId;
    this.userService.follow(user.userAvatar.userId).subscribe({
      next: () => {
        user.isFollowedByCurrentUser = true;
      },
      error: () => {
        this.followSpinner = false;
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }

  unFollow(user: UserResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userAvatar.userId;
    this.userService.unfollow(user.userAvatar.userId).subscribe({
      next: () => {
        user.isFollowedByCurrentUser = false;
      },
      error: () => {
        this.followSpinner = false;
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }

}
