import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutes } from '../../../config/app-routes.enum';
import { SignupService } from '../services/signup.services';
import { finalize, from } from 'rxjs';
import { CustomValidators } from '../../../core/validators/CustomValidators';
import { TimezoneSelectorComponent } from "../../../core/sharedComponent/Timezone/timezone-selector.component";
import { TIMEZONES } from '../../../core/constants/timezones.constant';
import { COUNTRIES } from '../../../core/constants/countries.constant';
import { ResidenceSelectorComponent } from "../../../core/sharedComponent/Country/country-selector.component";

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    TimezoneSelectorComponent,
    ResidenceSelectorComponent
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent {

  signupForm: FormGroup;
  showPassword = signal(false);
  loading = signal(false);
  sigupFailed = signal(false);



  allTimezonesFlat = TIMEZONES.flatMap(g => g.zones);
  constructor(private formBuilder: FormBuilder, private signupService: SignupService, private router: Router) {

    this.signupForm = this.formBuilder.group({
      email: ['', [Validators.required, this.stricterEmailValidator]],
      username: ['', [Validators.required, this.unicodeUsernameValidator]],
      password: ['', [Validators.required, this.passwordComplexity]],
      confirmPassword: ['', Validators.required],
      dob: ['', [Validators.required, CustomValidators.ageValidator(10, 100)]],
      residence: ['', Validators.required],
      gender: ['', Validators.required],
      timezoneId: ['', [Validators.required, CustomValidators.validTimezoneValidator(this.allTimezonesFlat)]],

    }, { validators: this.passwordMatchValidator });



  }

  get password() { return this.signupForm.get('password')!; }
  get confirmPassword() { return this.signupForm.get('confirmPassword')!; }
  get email() { return this.signupForm.get('email')!; }
  get username() { return this.signupForm.get('username')!; }
  get dateOfBirth() { return this.signupForm.get('dob')!; }
  get residence(): FormControl { return this.signupForm.get('residence') as FormControl; }
  get gender() { return this.signupForm.get('gender')!; }

  get timezoneControl(): FormControl {
    return this.signupForm.get('timezoneId') as FormControl;
  }





  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  private stricterEmailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
    const valid = emailRegex.test(control.value);
    return valid ? null : { email: true };
  };


  passwordComplexity(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const errors: ValidationErrors = {};
    if (value.length < 8) errors['minLength'] = true;
    if (value.length > 32) errors['maxLength'] = true;
    if (/\s/.test(value)) errors['whitespace'] = true;
    if (!/[a-zA-Z]/.test(value)) errors['letterMissing'] = true;
    if (!/[0-9]/.test(value)) errors['numberMissing'] = true;
    return Object.keys(errors).length ? errors : null;
  }

  unicodeUsernameValidator(control: AbstractControl): ValidationErrors | null {
    const regex = /^\p{L}[\p{L}0-9._-]{1,28}[\p{L}0-9]$/u;
    return regex.test(control.value) ? null : { unicodeUsernameValidator: true };
  }



  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const passwordControl = group.get('password');
    const confirmPasswordControl = group.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl) return null;

    const password = passwordControl.value;
    const confirmPassword = confirmPasswordControl.value;

    if (password !== confirmPassword) {
      // Set manual error on the confirmPassword control
      confirmPasswordControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Only clear the custom error if it exists and no other errors
      if (confirmPasswordControl.hasError('passwordMismatch')) {
        confirmPasswordControl.setErrors(null);
      }
      return null;
    }
  }




  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading.set(true); // Immediately show the spinner
    this.sigupFailed.set(false);
    const formValue = { ...this.signupForm.value };
    delete formValue.confirmPassword;

    setTimeout(() => {
      this.signupService.signup(formValue).pipe(
        finalize(() => { this.loading.set(false); this.sigupFailed.set(true) })
      ).subscribe({
        next: () => this.sigupFailed.set(false),
        error: () => this.sigupFailed.set(true)
      }
      );
    }, 500);

  }

  GoToLogIn() {
    this.router.navigate([`${AppRoutes.LOGIN}`])
  }


}
