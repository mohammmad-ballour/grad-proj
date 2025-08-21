import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '../../config/app-routes.enum';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'authToken';

    constructor(private router: Router) { }

    // Token getter
    get TokenKey(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Token setter
    set TokenKey(token: string | null) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    private decodeToken(): any | null {
        const token = this.TokenKey;
        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('Invalid JWT format');
            return null;
        }

        try {
            const payload = parts[1];
            const decodedJson = atob(payload);
            return JSON.parse(decodedJson);
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    }

    // Get the username claim
    get UserName(): string | null {
        const decoded = this.decodeToken();
        return decoded?.preferred_username || null;
    }

    // Get the user ID claim
    get UserId(): string {
        const decoded = this.decodeToken();
        return decoded?.uid || "empty";
    }

    // Remove token & redirect to login
    logout(): void {
        this.TokenKey = null;
        localStorage.removeItem(this.TOKEN_KEY);
        this.router.navigate([AppRoutes.LOGIN]);
    }

    // Check if token exists (optionally add expiry check here)
    isAuthenticated(): boolean {
        return !!this.TokenKey;
    }
}
