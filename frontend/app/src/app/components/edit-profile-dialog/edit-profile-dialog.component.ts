import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditProfileDialogData } from '../models/EditProfileDialogData';
import { TimezoneSelectorComponent } from '../../core/sharedComponent/Timezone/timezone-selector.component';
import { TIMEZONES } from '../../core/constants/timezones.constant';
import { CustomValidators } from '../../core/validators/CustomValidators';
import { MatSelectModule } from '@angular/material/select';
import { ResidenceSelectorComponent } from '../../core/sharedComponent/Country/country-selector.component';
import { ProfileServices } from '../services/profile.services';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    TimezoneSelectorComponent,
    ResidenceSelectorComponent
  ],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.css']
})
export class EditProfileDialogComponent {
  profileForm: FormGroup;
  coverPhotoFile: File | null = null;
  profilePhotoFile: File | null = null;
  coverPhotoUrl: string | SafeUrl;
  profilePhotoUrl: string | SafeUrl;
  allTimezonesFlat = TIMEZONES.flatMap(g => g.zones);
  isDefaultProfilePhoto = false;
  defaultProfilePhoto = 'assets/ProfileAvatar.png';
  defaultCoverPhoto = 'assets/coverPhoto.png';

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public profileData: EditProfileDialogData,
    private fb: FormBuilder,
    private profileServices: ProfileServices,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.coverPhotoUrl = profileData.profileCoverPhoto;
    this.profilePhotoUrl = profileData.profilePicture;

    this.profileForm = this.fb.group({
      displayName: [profileData.displayName || '', [Validators.required, Validators.maxLength(30)]],
      bio: [profileData.profileBio || '', Validators.maxLength(100)],
      residence: [profileData.residence || '', Validators.required],
      dob: [profileData.dob || '', CustomValidators.ageValidator(10, 100)],
      gender: [profileData.gender?.toUpperCase() || '', Validators.required],
      timezoneId: [profileData.timezoneId || '', [Validators.required, CustomValidators.validTimezoneValidator(this.allTimezonesFlat)]]
    });
  }

  get gender() { return this.profileForm.get('gender')!; }
  get dateOfBirth() { return this.profileForm.get('dob')!; }
  get timezoneControl(): FormControl { return this.profileForm.get('timezoneId') as FormControl; }
  get residence(): FormControl { return this.profileForm.get('residence') as FormControl; }

  closeDialog(isChanged: boolean) {
    this.dialogRef.close(isChanged);
  }


  removeProfilePhoto(): void {
    this.profilePhotoUrl = this.defaultProfilePhoto;
    this.profilePhotoFile = null;
  }

  removeCoverPhoto(): void {
    this.coverPhotoUrl = this.defaultCoverPhoto;
    this.coverPhotoFile = null;
  }

  onCoverPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImage(file)) {
      this.coverPhotoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.coverPhotoUrl = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onProfilePhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImage(file)) {
      this.profilePhotoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePhotoUrl = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onAvatarError() {
    this.profilePhotoUrl = this.defaultProfilePhoto;

  }

  onCoverError() {
    this.coverPhotoUrl = this.defaultCoverPhoto;
  }

  private isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  }

  save() {
    if (this.profileForm.valid) {
      if (!this.hasChangedFields()) {
        this.closeDialog(false);
        return;
      }
      this.profileForm.disable();
      const formData = this.createFormData();
      this.profileServices.UpdateDataOfProfile(formData).subscribe({
        next: () => {
          this.profileForm.enable();
          this.closeDialog(true);
        },
        error: () => {
          this.profileForm.enable();
          this.snackBar.open('Failed to update profile. Please try again.', 'Close', { duration: 5000 });
          this.closeDialog(true);
        }
      });
    }
  }
  private hasChangedFields(): boolean {
    const formValue = this.profileForm.value;
    return (
      formValue.displayName?.trim() !== (this.profileData.displayName || '') ||
      formValue.bio?.trim() !== (this.profileData.profileBio || '') ||
      formValue.residence?.trim() !== (this.profileData.residence || '') ||
      formValue.dob !== (this.profileData.dob || '') ||
      formValue.gender?.toUpperCase() !== (this.profileData.gender?.toUpperCase() || '') ||
      formValue.timezoneId !== (this.profileData.timezoneId || '') ||
      !!this.profilePhotoFile ||
      (this.profilePhotoUrl === this.defaultProfilePhoto && this.profilePhotoUrl !== this.profileData.profilePicture) ||
      !!this.coverPhotoFile ||
      (this.coverPhotoUrl === this.defaultCoverPhoto && this.coverPhotoUrl !== this.profileData.profileCoverPhoto)
    );
  }
  private base64ToFile(base64: string, fileName: string, mimeType: string): File | null {
    try {
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return new File([blob], fileName, { type: mimeType });
    } catch (error) {
      console.error('Failed to convert base64 to File:', error);
      return null;
    }
  }
  private createFormData(): FormData {
    const formData = new FormData();
    const formValue = this.profileForm.value;

    // Append text fields, including old values if unchanged
    formData.append('displayName', formValue.displayName?.trim() && formValue.displayName.trim() !== this.profileData.displayName
      ? formValue.displayName.trim()
      : this.profileData.displayName || '');

    formData.append('profileBio', formValue.bio === '' ? '' :
      (formValue.bio?.trim() && formValue.bio.trim() !== this.profileData.profileBio
        ? formValue.bio.trim()
        : this.profileData.profileBio || ''));

    formData.append('residence', formValue.residence?.trim() && formValue.residence.trim() !== this.profileData.residence
      ? formValue.residence.trim()
      : this.profileData.residence || '');

    formData.append('dob', formValue.dob && formValue.dob !== this.profileData.dob
      ? formValue.dob
      : this.profileData.dob || '');

    formData.append('gender', formValue.gender && formValue.gender.toUpperCase() !== this.profileData.gender?.toUpperCase()
      ? formValue.gender.toUpperCase()
      : this.profileData.gender?.toUpperCase() || '');

    formData.append('timezoneId', formValue.timezoneId && formValue.timezoneId !== this.profileData.timezoneId
      ? formValue.timezoneId
      : this.profileData.timezoneId || '');

    // Append profile picture, including old value if unchanged, skip if removed
    if (this.profilePhotoFile) {
      formData.append('profilePicture', this.profilePhotoFile);
    } else if (this.profilePhotoUrl === this.defaultProfilePhoto && this.profilePhotoUrl !== this.profileData.profilePicture) {
      // If the profile photo was removed, send a default value

      formData.append('profilePicture', new File([], ""));

    } else {
      // Append existing profile picture if unchanged
      const existingProfileFile = this.base64ToFile(this.profileData.profilePicture, 'profile-picture.png', 'image/png');
      if (existingProfileFile) {
        formData.append('profilePicture', existingProfileFile);
      }
    }
    // If profile photo was removed (profilePhotoUrl === defaultProfilePhoto and differs from profileData.profilePicture),
    // do not append to indicate removal

    // Append cover photo, including old value if unchanged, skip if removed
    if (this.coverPhotoFile) {
      formData.append('profileCoverPhoto', this.coverPhotoFile);
    } else if (this.coverPhotoUrl === this.defaultCoverPhoto && this.coverPhotoUrl !== this.profileData.profileCoverPhoto) {
      // If the cover photo was removed, send null
      formData.append('profileCoverPhoto', new File([], "",));
    } else {
      // Append existing cover photo if unchanged
      const existingCoverFile = this.base64ToFile(this.profileData.profileCoverPhoto, 'cover-photo.png', 'image/png');
      if (existingCoverFile) {
        formData.append('profileCoverPhoto', existingCoverFile);
      }
    }

    // If cover photo was removed (coverPhotoUrl === defaultCoverPhoto and differs from profileData.profileCoverPhoto),
    // do not append to indicate removal

    return formData;
  }
}
