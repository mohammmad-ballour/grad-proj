import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';
import { ProfileServices } from '../services/profile.services';
import { UserService } from '../services/user.service';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile!: ProfileResponseDto;
  spinner = true;
  isNotFound = true;
  CurrentUserName!: string;
  isPersonalProfile!: boolean;
  isBeingFollowed!: boolean;

  constructor(
    private dialog: MatDialog,
    private profileServices: ProfileServices,
    private userService: UserService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.CurrentUserName = params.get('username') || '';
      this.isPersonalProfile = (this.CurrentUserName == this.profileServices.userName)
      this.fetchProfileData();
    });
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src =
      'assets/ProfileAvatar.png';
  }

  onCoverError(event: Event) {
    (event.target as HTMLImageElement).src =
      'assets/coverPhoto.png';
  }

  fetchProfileData(): void {
    this.profileServices.GetDataOfProfile(this.CurrentUserName).subscribe({
      next: (result) => {
        if (result) {
          this.profile = result;
          this.profile.userAvatar.profilePicture = `data:image/png;base64,${this.profile.userAvatar.profilePicture}`;
          this.profile.profileCoverPhoto = `data:image/png;base64,${this.profile.profileCoverPhoto}`;
          this.spinner = false;
          this.isNotFound = false;
          this.isBeingFollowed = result.isBeingFollowed;
        } else {
          this.spinner = false
        }
      }
    });
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

  toggleFollow() {
    const prpfileOwnerId = this.profile.userAvatar.userId;
    if (this.isBeingFollowed) {
      this.userService.unfollow(prpfileOwnerId).subscribe(() => {
        this.isBeingFollowed = false;
        this.profile.followerNo!--;
      });
    } else {
      this.userService.follow(prpfileOwnerId).subscribe(() => {
        this.isBeingFollowed = true;
        this.profile.followerNo!++;
      });
    }
  }


}
