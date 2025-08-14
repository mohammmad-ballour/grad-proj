import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '../../../config/app-routes.enum';
import { LoginService } from '../services/login.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

@Component({
    standalone: true,
    selector: 'app-login',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: 'login.component.html',
    styleUrl: 'login.component.css',

})
export class LoginComponent {

    readonly form: FormGroup;
    loading = signal(false);
    hidePassword = signal(true);
    loginFailed = signal(false);

    constructor(private formBuilder: FormBuilder, private loginService: LoginService, private router: Router) {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+$')]],
            password: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.form.valid) {
            this.loading.set(true); // Immediately show the spinner
            this.loginFailed.set(false);
            setTimeout(() => {
                this.loginService.login(this.form.value, AppRoutes.HOME).pipe(
                    finalize(() => this.loading.set(false))
                ).subscribe(result => {
                    if (result) {
                        this.loginFailed.set(false);
                    }
                    else {
                        this.loginFailed.set(true);
                    }

                });

            }, 500);
        }
    }

    GoToSignUp() {
        this.router.navigate([`${AppRoutes.SIGNUP}`]);
    }
}
