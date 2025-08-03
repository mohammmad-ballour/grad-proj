import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';
import { ProfileServices } from '../services/profile.services';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile!: ProfileResponseDto;
  isLoading = false;
  errorMessage = '';
  constructor(
    private dialog: MatDialog,
    private profileServices: ProfileServices
  ) {

  }



  ngOnInit(): void {
    this.fetchProfileData();
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
  }

  onCoverError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/1200x300/cccccc/cccccc?text=';
  }

  fetchProfileData(): void {
    this.profileServices.GetDataOfProfile().subscribe({
      next: (result) => {
        if (result) {

          this.profile = result;
          this.profile.userAvatar.profilePicture = `data:image/png;base64,${this.profile.userAvatar.profilePicture}`;
          this.profile.profileCoverPhoto = `data:image/png;base64,${this.profile.profileCoverPhoto}`;
          this.isLoading = true;
        } else {
          this.errorMessage = 'No profile data received';
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile data';
        console.error(error);
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
      if (changed)
        this.fetchProfileData();
    });
  }




}
