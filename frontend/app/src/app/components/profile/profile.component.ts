import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatSliderModule } from '@angular/material/slider';
import { MuteDialogComponent } from '../mute-dialog-component/mute-dialog-component.component';
import { MuteDuration } from '../models/MuteDurationDto';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, CommonModule, MatProgressSpinnerModule, MatMenuModule,
    MatInputModule, MatAutocompleteModule, MatSliderModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  profile!: ProfileResponseDto;
  spinner = true;
  isNotFound = true;
  CurrentUserName!: string;
  isPersonalProfile!: boolean;
  isBeingFollowed = false;
  followSpinner = false;
  blockSpinner = false;
  isBlocked = false;
  menuSpinner = false;
  menuOpen = false;


  currentPriority: 'RESTRICTED' | 'FAVOURITE' | 'DEFAULT' = 'DEFAULT'; // initial value from backend
  durationInSeconds: any;

  constructor(
    private dialog: MatDialog,
    private profileServices: ProfileServices,
    private userService: UserService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
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
      },
      complete: () => {
        this.followSpinner = false;
      }
    });
  }
  isMuted = false;

  updatePriority(priorityName: string): void {
    this.followSpinner = true;

    const normalized = priorityName.toUpperCase() as 'RESTRICTED' | 'FAVOURITE' | 'DEFAULT';

    this.userService.UpdatePriority(this.profile.userAvatar.userId, normalized).subscribe({
      next: () => this.handlePriorityUpdateSuccess(normalized),
      error: (err) => this.handlePriorityUpdateError(err),
      complete: () => this.followSpinner = false
    });
  }

  private handlePriorityUpdateSuccess(priority: 'RESTRICTED' | 'FAVOURITE' | 'DEFAULT'): void {
    this.currentPriority = priority;
    console.log('Priority updated to', priority);
    this.snackBar.open('Priority is updated.', 'Close', { duration: 1000 });
  }

  private handlePriorityUpdateError(err: any): void {
    console.error('Priority update failed:', err);
    this.snackBar.open('Saving failed. Please try again.', 'Close', { duration: 1000 });
  }


  toggleBlock(): void {
    const profileOwnerId = this.profile.userAvatar.userId;

    this.menuSpinner = true; // spinner for menu
    const request$ = this.isBlocked
      ? this.userService.UNBlock(profileOwnerId)
      : this.userService.Block(profileOwnerId);

    request$.subscribe({
      next: () => this.handleToggleResult(true),
      error: () => {
        this.handleToggleResult(false);
        this.menuSpinner = false; // spinner for menu


      }
      ,
      complete: () => this.menuSpinner = false
    });
  }

  private handleToggleResult(success: boolean): void {
    const previousState = this.isBlocked;
    const action = previousState ? 'Unblock' : 'Block';

    if (success) {
      this.isBlocked = !previousState;
      this.snackBar.open(`${action}ed successfully`, 'Close', { duration: 1000 });
    } else {
      this.snackBar.open(`${action} failed, please try again`, 'Close', { duration: 1000 });
    }
  }




  openMuteDialog(): void {
    const dialogRef = this.dialog.open(MuteDialogComponent, {
      width: '3000px', // corrected from 3000px which is very large
      data: { userId: this.profile.userAvatar.userId },
    });

    dialogRef.afterClosed().subscribe((result: MuteDuration | undefined) => {
      if (result) {
        this.mute(result);
      } else {
        this.unmute();
      }
    });
  }

  private mute(duration: MuteDuration): void {
    this.menuSpinner = true;
    this.userService.Mute(this.profile.userAvatar.userId, duration)
      .subscribe({
        next: () => this.onMuteResult(true),
        error: () => this.onMuteResult(false),
        complete: () => (this.menuSpinner = false),
      });
  }

  private unmute(): void {
    this.menuSpinner = true;
    this.userService.Unmute(this.profile.userAvatar.userId)
      .subscribe({
        next: () => this.onUnmuteResult(true),
        error: () => this.onUnmuteResult(false),
        complete: () => (this.menuSpinner = false),
      });
  }

  private onMuteResult(success: boolean): void {
    if (success) {
      this.isMuted = true;
      this.showSnackBar('Muted successfully');
    } else {
      this.showSnackBar('Mute failed, please try again');
    }
  }

  private onUnmuteResult(success: boolean): void {
    if (success) {
      this.isMuted = false;
      this.showSnackBar('Unmuted successfully');
    } else {
      this.showSnackBar('Unmute failed, please try again');
    }
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 1000 });
  }




}