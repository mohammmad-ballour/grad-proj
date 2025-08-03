import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppRoutes } from '../../config/app-routes.enum';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(): boolean {
        if (this.auth.isAuthenticated()) {
            return true;
        }
        this.router.navigate([`${AppRoutes.LOGIN}`]);
        return false;

    }
}
