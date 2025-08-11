import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';
import { ProfileServices } from '../services/profile.services';
import { UserSeekResponse, UserService } from '../services/user.service';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from '@angular/router';
import { MatMenuModule } from "@angular/material/menu";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatSliderModule } from '@angular/material/slider';
import { MuteDialogComponent } from '../mute-dialog-component/mute-dialog-component.component';
import { MuteDuration } from '../models/MuteDurationDto';
import { Observable, Subscription } from 'rxjs';
import { UserListDialogComponent } from '../user-list-dialog-component/user-list-dialog-component.component';

type Priority = 'RESTRICTED' | 'FAVOURITE' | 'DEFAULT';
const PRIORITIES: Priority[] = ['RESTRICTED', 'FAVOURITE', 'DEFAULT'];
export type FollowerMap = { [key: string]: UserSeekResponse[] };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatTabsModule, MatIconModule, CommonModule,
    MatProgressSpinnerModule, MatMenuModule,
    MatInputModule, MatAutocompleteModule, MatSliderModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  profile!: ProfileResponseDto;
  initialSpinner = false;
  isNotFound = true;
  CurrentUserName!: string;
  isPersonalProfile!: boolean;
  followSpinner = false;
  menuSpinner = false;
  menuOpen: any;
  blockSpinner: any;
  displaySnackBar = true;
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
      this.isPersonalProfile = this.CurrentUserName === this.profileServices.userName;
      this.fetchProfileData(true);
    });
  }

  private fetchProfileData(isInitialCall: boolean): void {
    this.initialSpinner = isInitialCall;
    this.profileServices.GetDataOfProfile(this.CurrentUserName).subscribe({
      next: (result) => {
        if (result) {
          this.profile = result;
          this.profile.userAvatar.profilePicture = `data:image/png;base64,${this.profile.userAvatar.profilePicture}`;
          this.profile.profileCoverPhoto = `data:image/png;base64,${this.profile.profileCoverPhoto}`;
          this.isNotFound = false;
          console.log(result)
        }
        this.initialSpinner = false;
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

  private unmute(refrech: boolean): Subscription {
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



  /** ---------- UTILITIES ---------- **/
  private showSnackBar(message: string): void {

    this.snackBar.open(message, 'Close', { duration: 1500 });
  }


  loadFollowers(): void {
    this.userService.getFollowers(this.profile.userAvatar.userId)
      .subscribe(data => {
        if (data)
          this.openUserList("Followers", data)

      });
  }

  loadFollowing(): void {
    this.userService.getFollowings(this.profile.userAvatar.userId)
      .subscribe(data => {
        if (data)
          this.openUserList('Following', data)

      });
  }


  openUserList(title: string, FollowerMap: FollowerMap): void {
    console.log(FollowerMap)
    this.dialog.open(UserListDialogComponent, {
      width: '400px', height: "400px",
      data: { title, FollowerMap }
    });
  }
}
