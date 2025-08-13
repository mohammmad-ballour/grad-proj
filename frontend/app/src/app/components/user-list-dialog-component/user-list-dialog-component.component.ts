import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogActions } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { UserSeekResponse, UserService } from '../services/user.service';
import { UserItemComponent } from '../user-item-component/user-item-component';

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
    @Inject(MAT_DIALOG_DATA) public data: { title: string; userSeekResponse: UserSeekResponse[], userId: number },
    private dialogRef: MatDialogRef<UserListDialogComponent>,
    private userService: UserService
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

    this.userService.getFollowers(this.data.userId, this.page)
      .subscribe({
        next: (followers) => {
          console.log(followers)
          if (followers?.length) {
            this.data.userSeekResponse.push(...followers);
            this.page++;
            if (followers.length < this.pageSize) {
              this.hasMore = false;
              this.disconnectObserver();
            }
          } else {
            this.hasMore = false;
            this.disconnectObserver();
          }
        },
        error: () => {
          this.isFollowersLoading = false

          this.isLoadingFailed = true;
        },
        complete: () => {
          this.isFollowersLoading = false
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



  follow(user: UserSeekResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userId;
    this.userService.follow(user.userId).subscribe({
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

  unFollow(user: UserSeekResponse) {
    this.followSpinner = true;
    this.currentUserId = user.userId;
    this.userService.unfollow(user.userId).subscribe({
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
