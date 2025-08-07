import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';

import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';
import { ProfileServices } from '../services/profile.services';
import { UserService } from '../services/user.service';

interface MutualFollower {
  displayName: string;
  profilePicture: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile!: ProfileResponseDto;
  spinner = true;
  isNotFound = false;
  CurrentUserName = '';
  isPersonalProfile = false;
  isBeingFollowed = false;
  followSpinner = false;

  mutualFollowers: MutualFollower[] = [];

  constructor(
    private dialog: MatDialog,
    private profileServices: ProfileServices,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.CurrentUserName = params.get('username') || '';
      this.isPersonalProfile = this.CurrentUserName === this.profileServices.userName;
      this.fetchProfileData();
    });
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/ProfileAvatar.png';
  }

  onCoverError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/coverPhoto.png';
  }

  fetchProfileData(): void {
    this.spinner = true;
    this.isNotFound = false;

    this.profileServices.GetDataOfProfile(this.CurrentUserName).subscribe({
      next: (result) => {
        if (result) {
          this.profile = result;
          this.profile.userAvatar.profilePicture = `data:image/png;base64,${this.profile.userAvatar.profilePicture}`;
          this.profile.profileCoverPhoto = `data:image/png;base64,${this.profile.profileCoverPhoto}`;
          this.isBeingFollowed = result.isBeingFollowed;
          this.spinner = false;

          if (!this.isPersonalProfile) {
            this.fetchMutualFollowers();
          } else {
            this.mutualFollowers = [];
          }
        } else {
          this.spinner = false;
          this.isNotFound = true;
        }
      },
      error: () => {
        this.spinner = false;
        this.isNotFound = true;
      }
    });
  }

  fetchMutualFollowers(): void {
    this.profileServices.getMutualFollowers(this.CurrentUserName).subscribe({
      next: (followers: MutualFollower[]) => {
        this.mutualFollowers = (followers || []).map(f => ({
          displayName: f.displayName,
          profilePicture: `data:image/png;base64,${f.profilePicture}`
        }));
      },
      error: () => {
        this.mutualFollowers = [];
      }
    });
  }

  getMutualFollowersText(): string {
    const count = this.mutualFollowers.length;
    const names = this.mutualFollowers.map(u => u.displayName);

    if (count === 0) return 'soso';
    if (count === 1) return `Followed by ${names[0]}`;
    if (count === 2) return `Followed by ${names[0]} and ${names[1]}`;
    if (count === 3) return `Followed by ${names[0]}, ${names[1]} and ${names[2]}`;

    const othersCount = count - 2;
    return `Followed by ${names[0]}, ${names[1]} and ${othersCount} other${othersCount > 1 ? 's' : ''}`;
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

    dialogRef.afterClosed().subscribe((changed) => {
      if (changed) {
        this.fetchProfileData();
      }
    });
  }

  toggleFollow(): void {
    const profileOwnerId = this.profile.userAvatar.userId;
    this.followSpinner = true;

    const request$ = this.isBeingFollowed
      ? this.userService.unfollow(profileOwnerId)
      : this.userService.follow(profileOwnerId);

    request$.subscribe({
      next: () => {
        this.isBeingFollowed = !this.isBeingFollowed;
        this.profile.followerNo! += this.isBeingFollowed ? 1 : -1;

        if (!this.isPersonalProfile) {
          this.fetchMutualFollowers();
        }
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }
}
