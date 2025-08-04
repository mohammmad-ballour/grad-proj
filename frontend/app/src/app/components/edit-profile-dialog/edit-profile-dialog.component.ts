import {Component, Inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {EditProfileDialogData} from '../models/EditProfileDialogData';
import {TimezoneSelectorComponent} from '../../core/sharedComponent/Timezone/timezone-selector.component';
import {TIMEZONES} from '../../core/constants/timezones.constant';
import {CustomValidators} from '../../core/validators/CustomValidators';
import {MatSelectModule} from '@angular/material/select';
import {CountrySelectorComponent} from "../../core/sharedComponent/Country/country-selector.component";
import {ProfileServices} from '../services/profile.services';
import {ProfileRequestDto} from '../models/ProfileRequestDto';

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
    CountrySelectorComponent
  ],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.css']
})
export class EditProfileDialogComponent {
  profileForm: FormGroup;
  coverPhotoFile: File | null = null;
  profilePhotoFile: File | null = null;
  coverPhotoUrl = '';
  profilePhotoUrl = '';
  allTimezonesFlat = TIMEZONES.flatMap(g => g.zones);

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public profileData: EditProfileDialogData,
    private fb: FormBuilder, private profileServices: ProfileServices
  ) {
    this.coverPhotoUrl = profileData.profileCoverPhoto || '';
    this.profilePhotoUrl = profileData.profilePicture || '';

    this.profileForm = this.fb.group({
      displayName: [profileData.displayName || '', [Validators.required, Validators.maxLength(50)]],
      bio: [profileData.profileBio || '', Validators.maxLength(160)],
      residence: [profileData.residence || '', Validators.required],
      dob: [profileData.dob || '', CustomValidators.ageValidator(10, 100)],
      gender: [profileData.gender.toUpperCase() || '', Validators.required],
      timezoneId: [profileData.timezoneId || '', [Validators.required, CustomValidators.validTimezoneValidator(this.allTimezonesFlat)]]
    });

  }
  get gender() { return this.profileForm.get('gender')!; }
  get dateOfBirth() { return this.profileForm.get('dob')!; }

  get timezoneControl(): FormControl {
    return this.profileForm.get('timezoneId') as FormControl;

  }
  get residence(): FormControl {
    return this.profileForm.get('residence') as FormControl;
  }

  closeDialog(isChanged: boolean) {
    this.dialogRef.close(isChanged);
  }

  onCoverPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImage(file)) {
      this.coverPhotoFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.coverPhotoUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }
  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src =
      'assets/ProfileAvatar.png';
  }

  onCoverError(event: Event) {
    (event.target as HTMLImageElement).src =
      'assets/coverPhoto.png';
  }

  onProfilePhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImage(file)) {
      this.profilePhotoFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.profilePhotoUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  private isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  }

  isFormValid(): boolean {
    return this.profileForm.valid;
  }

  save() {
    if (this.isFormValid()) {
      if (!this.hasChangedFields()) {
        this.closeDialog(false);
        return;
      }
      const ProfileFields = this.getChangedProfileFields();
      this.profileServices.UpdateDataOfProfile(ProfileFields)
        .subscribe({
          next: () => this.closeDialog(true),
          error: (e) => {
            confirm('Update failed');
            this.closeDialog(true);
          }
        });
    }
  }

  private getChangedProfileFields(): Partial<ProfileRequestDto> {
    const changes: Partial<ProfileRequestDto> = {};


    changes.displayName = this.profileForm.get('displayName')?.value.trim();

    changes.profileBio = this.profileForm.get('bio')?.value.trim().substring(0, 160);

    changes.residence = this.profileForm.get('residence')?.value.trim().substring(0, 30);

    changes.dob = this.profileForm.get('dob')?.value || "empty";

    changes.gender = this.profileForm.get('gender')?.value;

    changes.timezoneId = this.profileForm.get('timezoneId')?.value;

    if (this.profilePhotoFile) {
      changes.profilePicture = this.profilePhotoFile;
    }

    if (this.coverPhotoFile) {
      changes.profileCoverPhoto = this.coverPhotoFile;
    }

    return changes;
  }

  private hasChangedFields(): boolean {
    if (this.profileForm.get('displayName')?.value.trim() !== this.profileData.displayName) {
      return true;
    }

    if (this.profileForm.get('bio')?.value.trim() !== this.profileData.profileBio) {
      return true;
    }

    if (this.profileForm.get('residence')?.value.trim() !== this.profileData.residence) {
      return true;
    }

    if (this.profileForm.get('dob')?.value !== this.profileData.dob) {
      return true;
    }

    if (this.profileForm.get('gender')?.value !== this.profileData.gender.toUpperCase()) {
      return true;
    }

    if (this.profileForm.get('timezoneId')?.value !== this.profileData.timezoneId) {
      return true;
    }

    if (this.profilePhotoFile) {
      return true;
    }

    if (this.coverPhotoFile) {
      return true;
    }

    return false; // No changes found
  }

}
